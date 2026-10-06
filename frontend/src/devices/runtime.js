import { useSyncExternalStore } from "react";
import { findDevice, DEVICE_SOURCE_KEY } from "./definitions";
import { createReceiver, connectReceiver, needsCamera } from "./receivers";
import { StoreBridge } from "./bridge";
import { prepareRecording } from "./recordings";

// Owns every live device for the lifetime of the page.
//
// This is a singleton rather than a hook (contrast MindHive's useSourceRuntime)
// because devices must outlive the UI that connected them: the Data overlay
// mounts and unmounts as it is opened and closed, and a visual on another route
// keeps reading the stream. React only ever sees the Redux store, which the
// StoreBridge feeds, plus the camera preview stream below.
//
// Three kinds of instance live here, keyed by the id they use in the store:
//   device - a yq-data receiver feeding a Pipeline (see definitions.js)
//   replay - a FileReplayReceiver playing back an uploaded recording
//   marker - a MarkerReceiver a running visual sends its events to
class DeviceRuntime {
  constructor() {
    this.instances = new Map();
    this.pendingMarkers = new Map();
    this.camera = null;
    this.cameraOpening = null;
    this.cameraUsers = 0;
    this.recorder = null;
    this.listeners = new Set();
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

  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  notify() {
    this.listeners.forEach((listener) => listener());
  }

  getCameraStream = () => this.camera?.receiver.videoStream ?? null;

  /* ------------------------------ devices ----------------------------- */

  uniqueId(wanted) {
    let id = wanted;
    for (let n = 2; this.instances.has(id); n += 1) id = `${wanted} ${n}`;
    return id;
  }

  // Connects one of the devices in definitions.js. Rejects if it can't.
  async connect(definitionId) {
    const definition = findDevice(definitionId);
    if (!definition) throw new Error(`Unknown device "${definitionId}"`);

    const yq = await import("yq-data");
    let usesCamera = false;
    let receiver;
    let pipeline;
    const subscriptions = [];

    try {
      const videoElement = needsCamera(definition.receiver)
        ? await this.acquireCamera()
        : undefined;
      usesCamera = videoElement !== undefined;

      receiver = await createReceiver(definition.receiver, { videoElement });
      await connectReceiver(definition.receiver, receiver, definition);

      // Headsets name themselves ("Muse-1A2B") and may be worn in pairs; the
      // rest are one per page and use the name on their card.
      const id = this.uniqueId(
        definition.connections === "multiple" && receiver.deviceID
          ? String(receiver.deviceID)
          : definition.name,
      );

      const bridge = new StoreBridge({
        deviceName: definition.name,
        keyFor: definition.perStream
          ? (packet) => packet.streamID.split(":")[0]
          : () => id,
      });
      // A relay's own entry carries no data (its streams get theirs), but
      // gives the UI something to show and disconnect before any arrive.
      bridge.ensure(id);

      pipeline = new yq.Pipeline(definition.graph, {
        onError: (error, nodeId) =>
          console.error(`${definition.name}: "${nodeId}" failed`, error),
      });
      pipeline.attachReceiver(DEVICE_SOURCE_KEY, receiver);
      pipeline.start();
      pipeline
        .issues()
        .filter((issue) => issue.severity === "error")
        .forEach((issue) => console.warn(`${definition.name}:`, issue.reason));

      for (const output of pipeline.recordTargets().values()) {
        subscriptions.push(output.subscribe((packet) => bridge.handle(packet)));
      }
      subscriptions.push(
        receiver.isConnected$.subscribe((connected) =>
          bridge.setMeta("connected", connected),
        ),
      );

      const instance = {
        kind: "device",
        id,
        definition,
        receiver,
        pipeline,
        bridge,
        subscriptions,
        usesCamera,
        recordSources: () => [...pipeline.recordTargets().values()],
      };
      this.instances.set(id, instance);
      this.recordInstance(instance);
      return id;
    } catch (error) {
      subscriptions.forEach((s) => s.unsubscribe());
      pipeline?.destroy();
      try {
        await receiver?.disconnect();
      } catch {
        // Never got as far as connecting.
      }
      if (usesCamera) await this.releaseCamera();
      throw error;
    }
  }

  // Tears down an instance and removes it from the store. `id` may also be one
  // of the store entries an instance owns (an LSL relay has one per stream).
  async disconnect(id) {
    const instance =
      this.instances.get(id) ??
      [...this.instances.values()].find((i) => i.bridge.keys.includes(id));
    if (!instance) return;
    this.instances.delete(instance.id);

    instance.subscriptions.forEach((s) => s.unsubscribe());
    instance.pipeline?.destroy();
    instance.bridge.remove();
    try {
      await instance.receiver.stopStream?.();
      await instance.receiver.disconnect();
    } catch (error) {
      console.warn(`Error while disconnecting ${id}`, error);
    }
    if (instance.usesCamera) await this.releaseCamera();
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

  /* ------------------------------ recording --------------------------- */

  get isRecording() {
    return Boolean(this.recorder?.isRecording);
  }

  async startRecording() {
    const yq = await import("yq-data");
    this.recorder = new yq.Recorder();
    this.instances.forEach((instance) => this.recordInstance(instance));
    this.recorder.start();
  }

  // Adds an instance's outputs to a recording in progress; a device connected
  // mid-recording is picked up here too.
  recordInstance(instance) {
    if (!this.recorder || instance.kind === "replay") return;
    instance.recordSources().forEach((source) => this.recorder.addSource(source));
  }

  // Stops and downloads the zip. Rejects if nothing was captured.
  async stopRecording() {
    const recorder = this.recorder;
    this.recorder = null;
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

// The camera's MediaStream while any camera device is connected, else null.
export function useCameraStream() {
  return useSyncExternalStore(deviceRuntime.subscribe, deviceRuntime.getCameraStream);
}
