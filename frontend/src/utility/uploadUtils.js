import JSZip from "jszip";
import Papa from "papaparse";
import { connectionText } from "../components/devices/buttons/connectionText";
import { UploadedFile } from "./file_upload";

// Setup Papa.parsePromise as a helper
Papa.parsePromise = function (file, config) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, { ...config, complete: resolve, error: reject });
  });
};

function isZipFile(file) {
  return file.name.endsWith(".zip") || file.type.includes("zip");
}

export async function uploadFile(file, setConnText) {
  console.log(file);
  const zip = new JSZip();
  const zipUpload = await zip.loadAsync(file);
  let dataFilesList = Object.keys(zipUpload.files);
  const dataInSubFolder =
    dataFilesList[0].endsWith("/") &&
    dataFilesList.includes(dataFilesList[0] + "metadata.csv");

  if (!dataFilesList.includes("metadata.csv") && !dataInSubFolder) {
    console.error("Error, data files incomplete");
    setConnText(connectionText["failed"]);
    return;
  }

  const metadataFileDirectory = dataInSubFolder
    ? dataFilesList[0] + "metadata.csv"
    : "metadata.csv";

  const metaDataFile = await zipUpload.files[metadataFileDirectory].async(
    "blob"
  );
  const metadataRaw = await Papa.parsePromise(metaDataFile, {
    header: true,
    error: (error) => {
      setConnText(connectionText["failed"]);
      console.error(error);
    },
  });

  const devicesMetadata = metadataRaw.data.reduce((acc, obj) => {
    acc[obj["file name"]] = { ...obj };
    return acc;
  }, {});

  if (dataInSubFolder) {
    dataFilesList = dataFilesList.filter(
      (dataFile) => dataFile.replace(/[^\/]/g, "").length === 1
    );
  }
  dataFilesList = dataFilesList.filter((dataFile) =>
    metadataRaw.data.some((val) => dataFile.includes(val["file name"]))
  );

  for (const fileName of dataFilesList) {
    if (fileName.split(".").pop() === "csv") {
      const fileContent = await zipUpload.files[fileName].async("blob");
      Papa.parse(fileContent, {
        header: true,
        complete: (results) => {
          const fileDirectory = dataInSubFolder
            ? fileName.split("/")[1]
            : fileName;
          const currentDeviceMeta = devicesMetadata[fileDirectory];
          if (!currentDeviceMeta) return;
          const id = currentDeviceMeta["recording id"] + " Recording";
          window.recordings[id] = new UploadedFile(
            results.data,
            currentDeviceMeta["device name"],
            id,
            currentDeviceMeta["sampling_rate"]
          );
          setConnText(connectionText["connected"]);
        },
        error: (error) => {
          setConnText(connectionText["failed"]);
          console.error(error);
        },
      });
    }
  }
}

export async function preRecordedUpload(fileURL, setConnText) {
  setConnText(connectionText["awaiting"]);
  const response = await fetch(fileURL);
  const blob = await response.blob();
  const file = new File([blob], "recording.zip", { type: blob.type });
  await uploadFile(file, setConnText);
}

export async function formUploadFile(e, setConnText) {
  setConnText(connectionText["awaiting"]);
  const files = await e.currentTarget?.files;
  if (!files) {
    setConnText(connectionText["failed"]);
    return;
  }
  for (const file of files) {
    await uploadFile(file, setConnText);
  }
}

export async function dropZoneUpload(e, setConnText) {
  console.log("uploading file...");
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
    await uploadFile(file, setConnText);
  }
}
