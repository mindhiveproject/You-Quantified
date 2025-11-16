import store from "../store/store";
import Papa from "papaparse";
import JSZip from "jszip";
import devicesRaw from "../metadata/devices.json";
import { Observable } from "rxjs";
import { filter, tap } from "rxjs/operators";

const buffers = new Map();


function storeToObservable(store) {
  return new Observable((subscriber) => {
    subscriber.next(store.getState());
    const unsubscribe = store.subscribe(() =>
      subscriber.next(store.getState())
    );
    return unsubscribe;
  });
}

function getOrInitialize(map, key, init = () => []) {
  if (!map.has(key)) map.set(key, init());
  return map.get(key);
}

let lastMarker;

export function subToStore() {
  return storeToObservable(store)
    .pipe(
      filter((s) => s?.update?.type === "stream"),
      tap((state) => {
        const key = `${state.update.device} : ${state.update.modality}`;
        const chunk = state.dataStream?.[state.update.device];
        if (chunk !== undefined) getOrInitialize(buffers, key).push(chunk);
      })
    )
    .subscribe();
}

export function beginStream(saveObject) {
  const currentStream = store.getState().dataStream;
  for (const device in currentStream) {
    const currentDeviceData = currentStream[device];
    saveObject[device] = [currentDeviceData];
  }
}

function autoCSVDownload(saveObject, allDevicesMeta) {
  // CallBackFunction to download a CSV
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";

  const currentDate = new Date();
  const dateString = currentDate.fileName();

  var zip = new JSZip();

  var fileText = txtContent;

  fileText += "This folder contains the following files: ";
  const metadataJSON = [];

  // Load each file into the zip
  for (const [key, value] of saveObject) {
    const json = JSON.stringify(value);

    const blob = new Blob([Papa.unparse(json)], { type: "text/csv" });
    const thisFileName = key.toLowerCase().replace(" : ", "_").replace(/ /g, "_") + ".csv";

    const [device, modality] = key.split(" : ");
    const deviceMeta = allDevicesMeta[device];
    // Create basic metadata object
    const currentDeviceMeta = {
      "recording id": key,
      "file name": thisFileName,
      "device id": device,
      "device name": deviceMeta?.device,
    };

    // Find matching device from our devices list
    const deviceFromList = devicesRaw.find(
      (entry) => entry.device === deviceMeta?.device
    );

    // Determine device type
    if (modality === "device") {
      // For device modality, use deviceMeta type or fall back to deviceFromList
      currentDeviceMeta["type"] = deviceMeta?.type || deviceFromList?.type;
    } else {
      // For other modalities, use the modality value directly
      currentDeviceMeta["type"] = modality;
    }

    // Determine sampling rate using clearer precedence order
    let samplingRate = null;

    // First check if deviceMeta has a modality-specific sampling rate
    if (deviceMeta?.sampling_rate?.[modality]) {
      samplingRate = deviceMeta.sampling_rate[modality];
    }
    // Then check if deviceMeta has a numeric sampling rate
    else if (typeof deviceMeta?.sampling_rate === "number") {
      samplingRate = deviceMeta.sampling_rate;
    }
    // Then check if deviceFromList has a modality-specific sampling rate
    else if (deviceFromList?.sampling_rate?.[modality]) {
      samplingRate = deviceFromList.sampling_rate[modality];
    }
    // Finally fall back to deviceFromList general sampling rate
    else {
      samplingRate = deviceFromList?.sampling_rate;
    }

    currentDeviceMeta["sampling_rate"] = samplingRate;

    metadataJSON.push(currentDeviceMeta);
    zip.file(thisFileName, blob);
    fileText += thisFileName + ", ";
  }

  const blob = new Blob([Papa.unparse(metadataJSON)], { type: "text/csv" });
  zip.file("metadata.csv", blob);

  fileText += "metadata.csv";
  zip.file("README.txt", fileText);

  // Download the zip
  zip.generateAsync({ type: "blob" }).then(function (content) {
    const url = window.URL.createObjectURL(content);
    a.href = url;
    a.download = "yq_rec_" + dateString + ".zip";

    // Creates a hidden <a> object and clicks it
    a.click();
    window.URL.revokeObjectURL(url);
  });
}

export function stopRecording(unsub, deviceMeta) {
  unsub.unsubscribe();
  autoCSVDownload(buffers, deviceMeta);
  console.log(buffers);
}

const txtContent = `
Hi! I'm a small file meant to describe the contents of your folder. 

You: Quantified saves the data recorded from each of your devices as separate "csv" files. There is an additional file with the metadata for each device.

The data gathered from the web browser can have unreliable time synchrony or sampling rates, so be aware of its usage for research purposes. 

If you have questions or suggestions, please visit the repository at https://github.com/esromerog/You-Quantified.

`;

Date.prototype.fileName = function () {
  // YYYYMMDDThhmm - standard format for dates and times
  var month = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();
  var hh = this.getHours();
  var mm = this.getMinutes();

  return [
    this.getFullYear(),
    (month > 9 ? "" : "0") + month,
    (dd > 9 ? "" : "0") + dd,
    "T",
    (hh > 9 ? "" : "0") + hh,
    (mm > 9 ? "" : "0") + mm,
  ].join("");
};
