// The devices YouQuantified offers, hardcoded. Each is a yq-data pipeline:
//
//   receiver  - which yq-data receiver feeds the graph (see receivers.js).
//   graph     - a yq-data Pipeline graph. Source nodes name the receiver "device".
//   graph.record.nodes
//             - the nodes a device exposes. What they emit is what visuals can
//               map to (via the Redux store bridge) and what gets recorded.
//   name/type/description/data
//             - copy for the Data panel. `data` describes groups of streams;
//               the real channel labels come from the packets themselves.
//
// MindHive keeps this same shape ({ inputs, outputs, graph }) in a database.
// When these move out of the client, this file is the only thing that changes.

// yq-data is browser-only and large, so it is never imported from here — these
// are the string values of its `Modality` and `AnalysisMethod` enums, which is
// also how a stored graph would spell them.
const Modality = { EEG: "eeg", PPG: "ppg" };
const AnalysisMethod = {
  WINDOWING: "windowing",
  BAND_POWER: "band_power",
  CHANNEL_SELECTION: "channel_selection",
  HEART_RATE: "heart_rate",
  RMS: "rms",
};

// The source node every graph starts from: everything the receiver produces.
const DEVICE = "device";

export const devices = [
  {
    id: "emotiv",
    name: "EMOTIV",
    type: "EEG",
    connections: "multiple",
    short_description:
      "A consumer-grade electroencephalography (EEG) headset for research, cognitive training, and brain-computer interfaces (BCIs). EMOTIV captures raw EEG signals, derives metrics, and tracks head motion.",
    description:
      "The EMOTIV headset is a consumer-grade EEG device designed for neuroscience research, cognitive training, and brain-computer interface (BCI) applications. Equipped with multiple sensors, it captures high-resolution brain activity data across various regions of the scalp. It needs the EMOTIV Launcher running on this computer.",
    receiver: "emotiv",
    graph: {
      nodes: [
        { id: "eeg", receiver: DEVICE, stream: "raw_eeg" },
        { id: "motion", receiver: DEVICE, stream: "motion_data" },
        {
          id: "window",
          method: AnalysisMethod.WINDOWING,
          parameters: { size: 2, hop: 0.1 },
        },
        { id: "bands", method: AnalysisMethod.BAND_POWER, label: "Band power" },
      ],
      edges: [
        { from: ["eeg"], to: ["window"] },
        { from: ["window"], to: ["bands"] },
      ],
      record: { nodes: ["eeg", "motion", "bands"] },
    },
    data: [
      {
        name: "Band power",
        description:
          "Delta, Theta, Alpha, Low beta, High beta and Gamma power, averaged across electrodes.",
        type: "EEG Metrics",
      },
      {
        name: "Raw EEG",
        description: "One channel per electrode (AF3, F7, F3, ...).",
        type: "Raw EEG channels",
      },
      {
        name: "Motion",
        description: "Gyroscope, accelerometer and magnetometer readings.",
        type: "Movement",
      },
    ],
  },
  {
    id: "muse",
    name: "Muse",
    type: "EEG & PPG",
    connections: "multiple",
    short_description:
      "A wearable electroencephalography (EEG) headset that tracks brain activity, offering real-time insights into focus and relaxation.",
    description:
      "The Muse is a popular device for meditation, stress management, and neurofeedback training. It captures and streams brain signals from the frontal and temporal lobes, while also providing heart rate data through its integrated photoplethysmography (PPG) sensors. Requires a browser with Web Bluetooth (Chrome, Edge).",
    receiver: "muse",
    requires: "bluetooth",
    graph: {
      nodes: [
        { id: "eeg", receiver: DEVICE, stream: Modality.EEG },
        { id: "ppg", receiver: DEVICE, stream: Modality.PPG },
        {
          id: "eeg_window",
          method: AnalysisMethod.WINDOWING,
          parameters: { size: 2, hop: 0.1 },
        },
        { id: "bands", method: AnalysisMethod.BAND_POWER, label: "Band power" },
        {
          id: "pulse",
          method: AnalysisMethod.CHANNEL_SELECTION,
          parameters: { labels: ["infrared"] },
        },
        {
          id: "ppg_window",
          method: AnalysisMethod.WINDOWING,
          parameters: { size: 10, hop: 1 },
        },
        {
          id: "heart_rate",
          method: AnalysisMethod.HEART_RATE,
          label: "Heart rate",
        },
      ],
      edges: [
        { from: ["eeg"], to: ["eeg_window"] },
        { from: ["eeg_window"], to: ["bands"] },
        { from: ["ppg"], to: ["pulse"] },
        { from: ["pulse"], to: ["ppg_window"] },
        { from: ["ppg_window"], to: ["heart_rate"] },
      ],
      record: { nodes: ["eeg", "ppg", "bands", "heart_rate"] },
    },
    data: [
      {
        name: "Band power",
        description:
          "Delta, Theta, Alpha, Low beta, High beta and Gamma power, averaged across electrodes.",
        type: "EEG Metrics",
      },
      {
        name: "Raw EEG",
        description: "TP9, AF7, AF8 and TP10 electrodes.",
        type: "Raw EEG channels",
      },
      {
        name: "PPG",
        description: "Photoplethysmography activity from the forehead.",
        type: "PPG",
      },
      {
        name: "Heart rate",
        description: "Heart rate derived from PPG.",
        type: "Heart rate",
      },
    ],
  },
  {
    id: "face_landmarker",
    name: "Face Landmarker",
    type: "Video",
    connections: "single",
    card_type: "video",
    short_description: "Streams face movements and expressions from a live video feed.",
    description:
      "This device uses machine learning models to analyze a live video feed and generate scores representing facial expressions and movements. To ensure proper functionality, keep the window active in the background during operation.",
    receiver: "face_landmark",
    graph: {
      nodes: [{ id: "face", receiver: DEVICE }],
      edges: [],
      record: { nodes: ["face"] },
    },
    data: [
      {
        name: "Facial Movements",
        description: "52 expression scores (jawOpen, mouthSmileLeft, ...), from 0 to 1.",
        type: "Face Landmarks",
      },
      {
        name: "Head pose",
        description: "Yaw, pitch and roll of the head in degrees.",
        type: "Face Landmarks",
      },
    ],
  },
  {
    id: "pose",
    name: "Pose Detection",
    type: "Video",
    connections: "single",
    card_type: "video",
    short_description:
      "This device allows you to use your webcam to track the movements of your body.",
    description:
      "This device allows you to use your webcam to track the movements of your body.",
    receiver: "pose",
    graph: {
      nodes: [{ id: "pose", receiver: DEVICE }],
      edges: [],
      record: { nodes: ["pose"] },
    },
    data: [
      {
        name: "Body Movements",
        description: "The x, y and z position of 33 body landmarks.",
        type: "Pose Landmarks",
      },
    ],
  },
  {
    id: "face_synchrony",
    name: "Face Synchrony",
    type: "Video",
    connections: "single",
    card_type: "video",
    short_description: "Measure synchrony in facial expressions during live video tracking.",
    description:
      "This device tracks the faces of two people in the same camera view and measures the synchrony between their facial expressions. Values closer to one indicate greater similarity between the two faces, while lower values reflect reduced synchrony.",
    receiver: "face_landmark_pair",
    graph: {
      nodes: [
        { id: "first", receiver: DEVICE, stream: "blendshapes_face_1" },
        { id: "second", receiver: DEVICE, stream: "blendshapes_face_2" },
        {
          id: "synchrony",
          method: "difference",
          parameters: { mode: "similarity" },
          label: "Face synchrony",
        },
      ],
      edges: [
        { from: ["first"], to: ["synchrony", "a"] },
        { from: ["second"], to: ["synchrony", "b"] },
      ],
      record: { nodes: ["synchrony"] },
    },
    data: [
      {
        name: "Face Synchrony",
        description: "Similarity (0 to 1) of each expression between the two faces.",
        type: "Synchrony & Face Landmarks",
      },
    ],
  },
  {
    id: "video_heart_rate",
    name: "Video Heart Rate",
    type: "Video",
    connections: "single",
    card_type: "video",
    short_description:
      "This demo runs a simple variant of rPPG directly in your browser to measure your heart rate based on subtle changes in skin color.",
    description:
      "This demo runs a simple variant of rPPG directly in your browser to measure your heart rate based on subtle changes in skin color captured by your webcam. For best results, try in a constantly well lit space with minimal device and subject motion. The first reading takes about ten seconds.",
    receiver: "rppg",
    graph: {
      nodes: [
        { id: "rgb", receiver: DEVICE },
        {
          id: "green",
          method: AnalysisMethod.CHANNEL_SELECTION,
          parameters: { indices: [1] },
        },
        {
          id: "window",
          method: AnalysisMethod.WINDOWING,
          parameters: { size: 10, hop: 1 },
        },
        {
          id: "heart_rate",
          method: AnalysisMethod.HEART_RATE,
          parameters: { strategy: "spectral" },
          label: "Heart rate",
        },
      ],
      edges: [
        { from: ["rgb"], to: ["green"] },
        { from: ["green"], to: ["window"] },
        { from: ["window"], to: ["heart_rate"] },
      ],
      record: { nodes: ["heart_rate"] },
    },
    data: [
      {
        name: "Heart rate",
        description: "Heart rate estimated from changes in the color of your face",
        type: "Heart rate",
      },
    ],
  },
  {
    id: "audio_volume",
    name: "Audio Volume",
    type: "Audio",
    connections: "single",
    short_description: "Measure your microphone’s audio volume with a single metric.",
    description:
      "This tool calculates microphone audio volume using the Root Mean Square (RMS) method. Levels are expressed in decibels relative to full scale (dBFS), with values represented as negative numbers relative to the maximum peak (0 dBFS).",
    receiver: "microphone",
    graph: {
      nodes: [
        { id: "audio", receiver: DEVICE },
        {
          id: "volume",
          method: AnalysisMethod.RMS,
          parameters: { decibels: true },
          label: "Volume",
        },
      ],
      edges: [{ from: ["audio"], to: ["volume"] }],
      record: { nodes: ["volume"] },
    },
    data: [
      {
        name: "Volume",
        description: "The Root Mean Square of the values of the signal, in dBFS",
        type: "Audio Feature",
      },
    ],
  },
  {
    id: "voice_emotion",
    name: "Voice Emotion",
    type: "Audio",
    connections: "single",
    short_description: "Analyze the valence and arousal of emotions in your voice.",
    description:
      "This tool listens to your voice and scores each phrase as neutral (N), angry (A), sad (S) or happy (H), and estimates valence (positivity or negativity) and arousal (energy level). Values arrive once per phrase, so nothing is sent while nobody is speaking.",
    receiver: "voice_emotion",
    graph: {
      nodes: [{ id: "voice", receiver: DEVICE }],
      edges: [],
      record: { nodes: ["voice"] },
    },
    data: [
      {
        name: "Emotion",
        description: "Probability of Neutral (N), Angry (A), Sad (S) and Happy (H) speech.",
        type: "Audio Feature",
      },
      {
        name: "Affect",
        description: "The valence and arousal of emotion in your voice",
        type: "Audio Feature",
      },
    ],
  },
  {
    id: "video_emotion",
    name: "Video Emotion",
    type: "Video",
    connections: "single",
    card_type: "video",
    short_description:
      "Calculate the probability of different emotions from a live video feed.",
    description:
      "This device uses a pre-trained deep learning model to estimate the probability of different emotions (e.g., happy, sad, angry) from a live video feed. The model processes facial expressions to predict emotional states.",
    receiver: "face_emotion",
    graph: {
      nodes: [{ id: "expressions", receiver: DEVICE, stream: "expressions" }],
      edges: [],
      record: { nodes: ["expressions"] },
    },
    data: [
      {
        name: "Emotions",
        description:
          "Probability of neutral, happy, sad, angry, fearful, disgusted and surprised.",
        type: "Emotion Feature",
      },
    ],
  },
];

// Lab Streaming Layer isn't a device with fixed streams: a relay carries
// whatever the lab is running, and each stream becomes its own entry in the
// mapping dropdown (`perStream`).
export const lslDevice = {
  id: "lsl",
  name: "LSL",
  type: "Any",
  connections: "multiple",
  receiver: "lsl",
  perStream: true,
  options: { url: "ws://localhost:8333" },
  graph: {
    nodes: [{ id: "lsl", receiver: DEVICE }],
    edges: [],
    record: { nodes: ["lsl"] },
  },
};

export const allDevices = [...devices, lslDevice];

export function findDevice(id) {
  return allDevices.find((device) => device.id === id);
}

export function findDeviceByName(name) {
  return allDevices.find((device) => device.name === name);
}

export { DEVICE as DEVICE_SOURCE_KEY };
