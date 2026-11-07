// Maps a device definition's `receiver` key to a live yq-data receiver.
// yq-data touches Web Bluetooth, AudioWorklet and getUserMedia, so it is only
// ever imported dynamically from here.

// Receivers that read pixels off a shared <video> element instead of owning a
// connection. The runtime opens one camera (VideoReceiver) for all of them.
const CAMERA_RECEIVERS = new Set([
  "face_landmark",
  "face_landmark_pair",
  "face_emotion",
  "pose",
  "rppg",
]);

export function needsCamera(receiverType) {
  return CAMERA_RECEIVERS.has(receiverType);
}

// Cortex client credentials identify this app to EMOTIV, not the wearer.
function emotivCredentials() {
  const clientId = process.env.REACT_APP_CORTEX_CLIENT_ID;
  const clientSecret = process.env.REACT_APP_CORTEX_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "EMOTIV is not configured: set REACT_APP_CORTEX_CLIENT_ID and REACT_APP_CORTEX_CLIENT_SECRET.",
    );
  }
  return {
    clientId,
    clientSecret,
    license: process.env.REACT_APP_CORTEX_LICENSE,
    debit: 100,
  };
}

export async function createReceiver(receiverType, { videoElement } = {}) {
  const yq = await import("yq-data");
  switch (receiverType) {
    case "muse":
      return new yq.MuseReceiver();
    case "emotiv":
      return new yq.EMOTIVReceiver(emotivCredentials());
    case "microphone":
      return new yq.MicrophoneReceiver();
    case "voice_emotion":
      return new yq.VoiceEmotionReceiver({ emitAffect: true });
    case "lsl":
      return new yq.LSLReceiver();
    // The geometry options feed the preview overlay (see runtime.attachOverlay).
    // They add streams a device's graph must not record, which is why those
    // graphs name their streams instead of taking everything.
    case "face_landmark":
      return new yq.FaceLandmarkReceiver(videoElement, {
        maxFps: 15,
        emitLandmarks: true,
        emitFaceBox: true,
      });
    case "face_landmark_pair":
      return new yq.FaceLandmarkReceiver(videoElement, {
        maxFps: 15,
        numFaces: 2,
        emitLandmarks: true,
        emitFaceBox: true,
      });
    case "face_emotion":
      return new yq.FaceEmotionReceiver(videoElement, {
        maxFps: 15,
        emitFaceBox: true,
        emitLandmarks: true,
      });
    case "pose":
      return new yq.PoseReceiver(videoElement, { maxFps: 15 });
    case "rppg":
      return new yq.RPPGReceiver(videoElement);
    case "marker":
      return new yq.MarkerReceiver();
    default:
      throw new Error(`No receiver is registered for "${receiverType}".`);
  }
}

// Receivers disagree about what `connect` takes, so that lives here too.
export async function connectReceiver(receiverType, receiver, definition) {
  switch (receiverType) {
    case "emotiv":
      // Raw EEG and motion; band power is derived by the graph, as for Muse.
      await receiver.connect(["eeg", "mot"]);
      break;
    case "lsl":
      await receiver.connect(definition.options.url);
      break;
    default:
      await receiver.connect();
  }
  await receiver.startStream?.();
}
