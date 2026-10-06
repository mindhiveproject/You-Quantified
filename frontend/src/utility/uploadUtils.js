import { connectionText } from "../components/devices/buttons/connectionText";
import { deviceRuntime } from "../devices/runtime";

function isZipFile(file) {
  return file.name.endsWith(".zip") || file.type.includes("zip");
}

function recordingName(fileName) {
  return fileName.replace(/\.zip$/i, "");
}

async function load(source, name, setConnText) {
  try {
    await deviceRuntime.loadRecording(source, name);
    setConnText(connectionText["connected"]);
  } catch (error) {
    console.error(error);
    setConnText(connectionText["failed"]);
  }
}

export async function preRecordedUpload(fileURL, setConnText) {
  setConnText(connectionText["awaiting"]);
  await load(fileURL, recordingName(fileURL.split("/").pop()), setConnText);
}

export async function formUploadFile(e, setConnText) {
  setConnText(connectionText["awaiting"]);
  const files = await e.currentTarget?.files;
  if (!files) {
    setConnText(connectionText["failed"]);
    return;
  }
  for (const file of files) {
    await load(file, recordingName(file.name), setConnText);
  }
}

export async function dropZoneUpload(e, setConnText) {
  e.preventDefault();
  e.stopPropagation();
  setConnText(connectionText["awaiting"]);
  const files = await e?.dataTransfer?.files;
  if (!files || files.length !== 1) {
    setConnText(connectionText["failed"]);
    return;
  }
  for (const file of files) {
    if (!isZipFile(file)) {
      setConnText(connectionText["failed"]);
      return;
    }
    await load(file, recordingName(file.name), setConnText);
  }
}
