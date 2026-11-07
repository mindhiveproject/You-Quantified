// Maps a data source block input's `receiver` key to a live yq-data receiver.
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

// What yq-data's FaceOverlay draws over the camera preview for each receiver.
// The geometry it reads is only emitted because createReceiver asks for it.
const OVERLAY_LAYERS = {
  face_landmark: { box: false, landmarks: false, connections: "mesh" },
  face_landmark_pair: { box: false, landmarks: false, connections: "contours" },
  face_emotion: { box: true, label: true, landmarks: false, connections: "contours" },
  pose: { box: false, label: false, landmarks: true, connections: "contours" },
};

export function overlayLayers(receiverType) {
  return OVERLAY_LAYERS[receiverType];
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
      if (!navigator.bluetooth) {
        throw new Error("This browser can't use Bluetooth. Try Chrome or Edge.");
      }
      return new yq.MuseReceiver();
    case "emotiv":
      return new yq.EMOTIVReceiver(emotivCredentials());
    case "microphone":
      return new yq.MicrophoneReceiver();
    case "voice_emotion":
      return new yq.VoiceEmotionReceiver({ emitAffect: true });
    // The geometry options feed the preview overlay. The runtime only passes on
    // the streams a block declares, so they are never mapped or recorded.
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
    default:
      throw new Error(`No receiver is registered for "${receiverType}".`);
  }
}

// Receivers disagree about what `connect` takes: EMOTIV must be told which
// Cortex streams to subscribe to (raw EEG and motion; band power is derived by
// the graph, as for Muse), the rest take nothing.
export async function connectReceiver(receiverType, receiver) {
  if (receiverType === "emotiv") {
    await receiver.connect(["eeg", "mot"]);
  } else {
    await receiver.connect();
  }
  await receiver.startStream?.();
}
