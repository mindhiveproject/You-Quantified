import store from "../store/store";
import Papa from "papaparse";
import JSZip from "jszip";
import devicesRaw from "../metadata/devices.json";
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

const buffers = new Map();

/* ------------------------------------------------------------------ */
/* 1️⃣  Turn a Redux store into a cold, well-behaved RxJS Observable   */
/* ------------------------------------------------------------------ */
function storeToObservable(store) {
  return new Observable(subscriber => {
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


export function subToStore() {
  return storeToObservable(store)
    .pipe(
      filter(s => s?.update?.type === 'stream'),
      map(({ update, dataStream }) => ({
        key:   `${update.device} ${update.modality}`,
        chunk: dataStream?.[update.device],
      })),
      tap(({ key, chunk }) => {
        if (chunk !== undefined) getOrInitialize(buffers, key).push(chunk);
      }),
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

function autoCSVDownload(saveObject, deviceMeta) {
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
    const thisFileName = key.toLowerCase().replace(/ /g, "_") + ".csv";

    const currentDeviceMeta = {
      "recording id": key,
      "file name": thisFileName,
      "device name": deviceMeta[key]?.device,
    };

    const deviceFromList = devicesRaw.find(
      ({ heading }) => heading === deviceMeta[key]?.device
    );

    // Check the JSON device list
    if (deviceFromList) {
      currentDeviceMeta["type"] = deviceFromList["type"];
      currentDeviceMeta["sampling rate"] = deviceFromList["sampling_rate"];
    }

    // Check device meta to assign additional properties
    if (deviceMeta[key]?.["sampling rate"]) {
      currentDeviceMeta["sampling rate"] = deviceMeta[key]?.["sampling rate"];
    }
    if (deviceMeta[key]?.["type"]) {
      currentDeviceMeta["type"] = deviceMeta[key]?.["type"];
    }

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

export function stopRecording(unsub) {
  unsub.unsubscribe();
  autoCSVDownload(buffers, devicesRaw)
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
