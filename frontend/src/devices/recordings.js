// Recordings come in two shapes, and yq-data's FileReplayReceiver only fully
// understands the newer one:
//
//   current - written by yq-data's Recorder. metadata.csv has a `stream_id`
//             column plus the real sampling rate and modality of each stream.
//   legacy  - written by this app before the yq-data migration. metadata.csv
//             has only "recording id", "file name", "device name" (and, in some
//             versions, "type" / "sampling_rate"), and the sampling rate lived
//             in devices.json rather than in the file.
//
// `prepareRecording` detects which it was handed and, for legacy files, fills in
// what the old app would have looked up so playback runs at the right speed.

// What the old devices.json said about each device's data.
const LEGACY_DEVICES = {
  EMOTIV: { type: "eeg", rate: 128 },
  Muse: {
    byModality: {
      EEG: { type: "eeg", rate: 256 },
      PPG: { type: "ppg", rate: 64 },
      "Band Powers": { type: "eeg", rate: 10 },
      HR: { type: "ppg", rate: 1 },
    },
    fallback: { type: "eeg", rate: 256 },
  },
  "Face Landmarker": { type: "video", rate: 15 },
  "Pose Detection": { type: "video", rate: 15 },
  Pose: { type: "video", rate: 15 },
  "Face Synchrony": { type: "video", rate: 15 },
  FaceSync: { type: "video", rate: 15 },
  "Video Heart Rate": { type: "video", rate: 15 },
  "Video Emotion": { type: "video", rate: 24 },
  "Audio Volume": { type: "audio", rate: 15 },
  "Voice Emotion": { type: "audio", rate: 15 },
};

function legacyInfo(deviceName, recordingId) {
  const entry = LEGACY_DEVICES[deviceName];
  if (!entry) return undefined;
  if (!entry.byModality) return entry;
  // Old recording ids were "<device id> : <modality>".
  const modality = recordingId?.split(" : ")[1];
  return entry.byModality[modality] ?? entry.fallback;
}

async function readBlob(source) {
  if (typeof source !== "string") return source;
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Could not load ${source}`);
  return response.blob();
}

// Resolves to `{ blob, legacy }`, with `blob` ready for FileReplayReceiver.
export async function prepareRecording(source) {
  const blob = await readBlob(source);
  const [{ default: JSZip }, papaModule] = await Promise.all([
    import("jszip"),
    import("papaparse"),
  ]);
  const Papa = papaModule.default ?? papaModule;

  const zip = await JSZip.loadAsync(blob);
  // macOS adds a __MACOSX shadow folder that carries its own "._metadata.csv".
  const metadataPath = Object.keys(zip.files).find(
    (path) => !path.startsWith("__MACOSX/") && path.endsWith("metadata.csv"),
  );
  if (!metadataPath) {
    throw new Error("This zip has no metadata.csv, so it is not a recording.");
  }

  const metadata = Papa.parse(await zip.files[metadataPath].async("string"), {
    header: true,
    skipEmptyLines: true,
  });
  if (metadata.meta.fields?.includes("stream_id")) {
    return { blob, legacy: false };
  }

  const prefix = metadataPath.slice(0, -"metadata.csv".length);
  const converted = new JSZip();
  const rows = [];

  for (const row of metadata.data) {
    const fileName = row["file name"];
    const entry = zip.files[prefix + fileName];
    if (!fileName || !entry) continue;

    const info = legacyInfo(row["device name"], row["recording id"]);
    const rate = Number(row.sampling_rate) || info?.rate;

    converted.file(fileName, await entry.async("string"));
    rows.push({
      ...row,
      "device id": row["device id"] || row["recording id"]?.split(" : ")[0],
      type: info?.type ?? row.type,
      sampling_rate: rate ?? "",
    });
  }

  if (rows.length === 0) {
    throw new Error("This recording lists files that are not in the zip.");
  }

  converted.file("metadata.csv", Papa.unparse(rows));
  return { blob: await converted.generateAsync({ type: "blob" }), legacy: true };
}
