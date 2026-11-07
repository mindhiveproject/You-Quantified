import { useSyncExternalStore } from "react";
import { filter } from "rxjs";
import store from "../store/store";
import {
  createReceiver,
  connectReceiver,
  needsCamera,
  overlayLayers,
} from "./receivers";
import { StoreBridge } from "./bridge";
import { findOutput } from "./outputs";
import { prepareRecording } from "./recordings";

// Owns every live device for the lifetime of a project.
//
// This is a singleton rather than a hook (contrast MindHive's useSourceRuntime)
// because devices must outlive the UI that connected them: the Data Sources tab
// mounts and unmounts as the author moves between tabs, and the visual keeps
// reading the stream. React sees the Redux store, which the StoreBridge feeds,
// plus the input statuses and camera stream below.
//
// Three kinds of instance live here:
//   source - a linked data source: its block's Pipeline, with one receiver
//            attached per connected input. Keyed by the linked source's id.
//   replay - a FileReplayReceiver playing back an uploaded recording
//   marker - a MarkerReceiver a running visual sends its events to
class DeviceRuntime {
  constructor() {
    this.instances = new Map();
    this.pendingMarkers = new Map();
    // `${sourceId}/${inputId}` -> { state, device?, error? }, where `state` is
    // one of "awaiting", "connected", "lost" or "failed". Replaced rather than
    // mutated, so React can read it with useSyncExternalStore.
    this.inputStatus = {};
    this.camera = null;
    this.cameraOpening = null;
    this.cameraUsers = 0;
    this.recorder = null;
    this.listeners = new Set();
  }

  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  notify() {
    this.listeners.forEach((listener) => listener());
  }

  /* ------------------------------ camera ------------------------------ */

  // One camera for every vision receiver. yq-data's vision receivers read
  // frames off a <video> element that a VideoReceiver owns, so face tracking,
  // pose and heart rate can share it instead of each asking for the camera.
  // The element lives outside React because unmounting it kills the stream.
  async acquireCamera() {
    if (!this.camera) {
      this.cameraOpening ??= this.openCamera().finally(() => {
        this.cameraOpening = null;
      });
      await this.cameraOpening;
    }
    this.cameraUsers += 1;
    return this.camera.video;
  }

  async openCamera() {
    const yq = await import("yq-data");
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    const container = document.createElement("div");
    container.style.cssText = "position:fixed;width:0;height:0;overflow:hidden;";
    container.appendChild(video);
    document.body.appendChild(container);

    const receiver = new yq.VideoReceiver(video);
    try {
      await receiver.connect();
      await receiver.startStream();
    } catch (error) {
      container.remove();
      throw error;
    }
    this.camera = { video, receiver, container };
    this.notify();
  }

  async releaseCamera() {
    this.cameraUsers = Math.max(0, this.cameraUsers - 1);
    if (this.cameraUsers > 0 || !this.camera) return;
    const { receiver, container } = this.camera;
    this.camera = null;
    this.notify();
    try {
      await receiver.disconnect();
    } finally {
      container.remove();
    }
  }

  getCameraStream = () => this.camera?.receiver.videoStream ?? null;

  /* ------------------------------ sources ----------------------------- */

  // Store entries are keyed by name, which is what the mapping dropdown shows.
  // A second copy of the same source gets a number.
  uniqueId(wanted) {
    const taken = store.getState().deviceMeta;
    let id = wanted;
    for (let n = 2; id in taken; n += 1) id = `${wanted} ${n}`;
    return id;
  }

  setStatus(sourceId, inputId, status) {
    this.inputStatus = { ...this.inputStatus, [`${sourceId}/${inputId}`]: status };
    this.notify();
  }

  // Connects one input of a linked source (`{ id, label, block }`). Failures
  // end up in the input's status rather than being thrown.
  async connect(source, inputId) {
    const input = source.block.inputs.find(({ id }) => id === inputId);
    this.setStatus(source.id, inputId, { state: "awaiting" });

    let usesCamera = false;
    let receiver;
    try {
      const videoElement = needsCamera(input.receiver)
        ? await this.acquireCamera()
        : undefined;
      usesCamera = videoElement !== undefined;
      receiver = await createReceiver(input.receiver, { videoElement });
      await connectReceiver(input.receiver, receiver);
    } catch (error) {
      console.error(`Could not connect ${input.label}`, error);
      try {
        await receiver?.disconnect();
      } catch {
        // Never got as far as connecting.
      }
      if (usesCamera) await this.releaseCamera();
      this.setStatus(source.id, inputId, {
        state: "failed",
        error: error?.message || "Could not connect",
      });
      return;
    }

    const yq = await import("yq-data");
    const instance = this.instances.get(source.id) ?? this.openSource(yq, source);
    // Keyed by the input's own id: a block's graph names its source nodes after
    // its inputs, so two headsets of the same kind get separate slots.
    instance.pipeline.attachReceiver(input.id, receiver);

    const device = receiver.deviceID
      ? `${receiver.deviceName} ${receiver.deviceID}`
      : receiver.deviceName;
    const entry = { type: input.receiver, receiver, usesCamera };
    instance.inputs.set(input.id, entry);
    // Reports straight away, then follows the device: a headset can drop on
    // its own, and some come back by themselves.
    entry.subscription = receiver.isConnected$.subscribe((connected) =>
      this.setStatus(source.id, inputId, {
        state: connected ? "connected" : "lost",
        device,
      }),
    );
  }

  // Builds the source's pipeline, the first time one of its inputs connects.
  openSource(yq, source) {
    const { block } = source;
    const id = this.uniqueId(source.label || block.title);
    const bridge = new StoreBridge({ deviceName: block.title, keyFor: () => id });
    bridge.ensure(id);

    const pipeline = new yq.Pipeline(block.graph, {
      onError: (error, nodeId) =>
        console.error(`${block.title}: "${nodeId}" failed`, error),
    });
    pipeline.start();

    // Only the outputs the block declares. A camera node also carries the face
    // geometry the preview draws, which nobody maps to or records.
    const streams = [...pipeline.recordTargets()].map(([nodeId, output]) =>
      output.pipe(filter((packet) => findOutput(block.outputs, nodeId, packet))),
    );

    const instance = {
      kind: "source",
      id: source.id,
      pipeline,
      bridge,
      inputs: new Map(),
      subscriptions: streams.map((stream) =>
        stream.subscribe((packet) => bridge.handle(packet)),
      ),
      recordSources: () => streams,
    };
    this.instances.set(source.id, instance);
    this.recordInstance(instance);
    return instance;
  }

  // Disconnects one input. The last one closes the whole source.
  async disconnect(sourceId, inputId) {
    const instance = this.instances.get(sourceId);
    if (instance.inputs.size === 1) return this.closeSource(sourceId);

    const input = instance.inputs.get(inputId);
    instance.inputs.delete(inputId);
    instance.pipeline.detachReceiver(inputId);
    await this.closeInput(sourceId, inputId, input);
  }

  async closeInput(sourceId, inputId, input) {
    input.subscription.unsubscribe();
    this.setStatus(sourceId, inputId, undefined);
    try {
      await input.receiver.stopStream?.();
      await input.receiver.disconnect();
    } catch (error) {
      console.warn(`Error while disconnecting ${inputId}`, error);
    }
    if (input.usesCamera) await this.releaseCamera();
  }

  // Tears a source down and removes it from the store. Also how a source is
  // unlinked, which may happen before anything was connected.
  async closeSource(sourceId) {
    const instance = this.instances.get(sourceId);
    if (!instance) return;
    this.instances.delete(sourceId);

    instance.subscriptions.forEach((s) => s.unsubscribe());
    instance.pipeline.destroy();
    instance.bridge.remove();
    for (const [inputId, input] of instance.inputs) {
      await this.closeInput(sourceId, inputId, input);
    }
  }

  // Leaving a project closes everything it connected. Event markers belong to
  // the running visual, which closes them itself.
  closeProject() {
    for (const instance of this.instances.values()) {
      if (instance.kind === "source") this.closeSource(instance.id);
      if (instance.kind === "replay") this.closeRecording(instance.id);
    }
  }

  /* ------------------------------ overlay ----------------------------- */

  // Draws a connected camera input's face geometry on `canvas`, which should
  // cover `video` exactly. Returns a function that stops drawing. The overlay
  // reads the receiver's streams directly, outside the pipeline.
  async attachOverlay(sourceId, inputId, canvas, video) {
    const { type, receiver } = this.instances.get(sourceId).inputs.get(inputId);
    const layers = overlayLayers(type);
    if (!layers) return () => {};

    const { FaceOverlay } = await import("yq-data");
    const overlay = new FaceOverlay(canvas, { video, layers });
    const detach = overlay.attach(receiver);
    overlay.start();
    return () => {
      detach();
      overlay.destroy();
    };
  }

  /* ----------------------------- recordings --------------------------- */

  // Loads a recording (a File, Blob, or URL) as a replayable source. Recordings
  // from before the yq-data migration are converted on the way in.
  async loadRecording(source, name) {
    const { blob, legacy } = await prepareRecording(source);
    const yq = await import("yq-data");

    const receiver = new yq.FileReplayReceiver();
    await receiver.connect(blob);

    const id = this.uniqueId(`${name} Recording`);
    const bridge = new StoreBridge({ deviceName: "Recording", keyFor: () => id });
    bridge.ensure(id, { playing: false, looping: false, legacy });

    const subscriptions = [
      receiver.data.subscribe((packet) => bridge.handle(packet)),
      receiver.isPlaying$.subscribe((playing) => bridge.setMeta("playing", playing)),
    ];
    this.instances.set(id, {
      kind: "replay",
      id,
      receiver,
      bridge,
      subscriptions,
    });
    return id;
  }

  replayControls(id) {
    const instance = this.instances.get(id);
    if (instance?.kind !== "replay") return null;
    const { receiver, bridge } = instance;
    return {
      play: () => receiver.startStream(),
      pause: () => receiver.stopStream(),
      restart: () => {
        receiver.restart();
        receiver.stopStream();
      },
      toggleLoop: () => {
        receiver.loop = !receiver.loop;
        bridge.setMeta("looping", receiver.loop);
      },
    };
  }

  async closeRecording(id) {
    const instance = this.instances.get(id);
    this.instances.delete(id);
    instance.subscriptions.forEach((s) => s.unsubscribe());
    instance.bridge.remove();
    try {
      await instance.receiver.disconnect();
    } catch (error) {
      console.warn(`Error while closing ${id}`, error);
    }
  }

  /* ------------------------------ recording --------------------------- */

  get isRecording() {
    return Boolean(this.recorder?.isRecording);
  }

  async startRecording() {
    const yq = await import("yq-data");
    this.recorder = new yq.Recorder();
    this.instances.forEach((instance) => this.recordInstance(instance));
    this.recorder.start();
    this.notify();
  }

  // Adds an instance's outputs to a recording in progress; a source connected
  // mid-recording is picked up here too.
  recordInstance(instance) {
    if (!this.recorder || instance.kind === "replay") return;
    instance.recordSources().forEach((source) => this.recorder.addSource(source));
  }

  // Stops and downloads the zip. Rejects if nothing was captured.
  async stopRecording() {
    const recorder = this.recorder;
    this.recorder = null;
    this.notify();
    if (!recorder) return;
    recorder.stop();
    await recorder.download();
  }

  /* --------------------------- event markers -------------------------- */

  async markerInstance(visID) {
    const id = `event_markers_${visID}`;
    const existing = this.instances.get(id);
    if (existing) return existing;
    if (!this.pendingMarkers.has(id)) {
      this.pendingMarkers.set(
        id,
        (async () => {
          const yq = await import("yq-data");
          const receiver = new yq.MarkerReceiver({ deviceID: id });
          receiver.connect();
          const bridge = new StoreBridge({
            deviceName: "Event Markers",
            keyFor: () => id,
          });
          bridge.ensure(id, { type: "event marker" });
          const instance = {
            kind: "marker",
            id,
            receiver,
            bridge,
            subscriptions: [receiver.data.subscribe((p) => bridge.handle(p))],
            recordSources: () => [receiver.data],
          };
          this.instances.set(id, instance);
          this.recordInstance(instance);
          return instance;
        })().finally(() => this.pendingMarkers.delete(id)),
      );
    }
    return this.pendingMarkers.get(id);
  }

  // `marks` is a list of [label, value] pairs.
  async mark(visID, marks) {
    const { receiver } = await this.markerInstance(visID);
    const timestamp = Date.now();
    for (const [label, value] of marks) {
      receiver.mark(label, {
        timestamp,
        ...(Number.isFinite(value) ? { value } : {}),
      });
    }
  }

  async closeMarkers(visID) {
    const id = `event_markers_${visID}`;
    const instance = this.instances.get(id);
    if (!instance) return;
    this.instances.delete(id);
    instance.subscriptions.forEach((s) => s.unsubscribe());
    instance.receiver.disconnect();
    // Like a headset that dropped: the entry stays, marked as lost.
    instance.bridge.setMeta("connected", false);
  }
}

export const deviceRuntime = new DeviceRuntime();

// The camera's MediaStream while any camera input is connected, else null.
export function useCameraStream() {
  return useSyncExternalStore(deviceRuntime.subscribe, deviceRuntime.getCameraStream);
}

// One input's connection status, or undefined while it is disconnected.
export function useInputStatus(sourceId, inputId) {
  return useSyncExternalStore(
    deviceRuntime.subscribe,
    () => deviceRuntime.inputStatus[`${sourceId}/${inputId}`],
  );
}

export function useIsRecording() {
  return useSyncExternalStore(deviceRuntime.subscribe, () => deviceRuntime.isRecording);
}
