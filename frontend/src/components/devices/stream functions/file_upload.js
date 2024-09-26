import React, { useState, useRef } from "react";
import Papa from "papaparse";
import devicesRaw from "../../../metadata/devices";
import { useDispatch, useSelector } from "react-redux";

import JSZip from "jszip";
import store from "../../../store/store";
import { createSelector } from "reselect";


window.recordings = {};

Papa.parsePromise = function (file, config) {
  return new Promise(function (complete, error) {
    Papa.parse(file, { ...config, complete, error });
  });
};

export function FileUploader() {


  const [successText, setSuccessText] = useState("");


  async function uploadFile(e) {
    const form = e.currentTarget;
    const [file] = await form.files;

    console.log(file);

    var zip = new JSZip();
    const zipUpload = await zip.loadAsync(file);

    let dataFilesList = Object.keys(zipUpload.files);
    console.log(dataFilesList);

    if (
      !dataFilesList.includes("metadata.csv") ||
      !dataFilesList.includes("README.txt")
    ) {
      setSuccessText(
        "There was an error with the folder you uploaded, the files might have been modified"
      );
      return;
    }

    dataFilesList = dataFilesList.filter(
      (e) => e !== ("metadata.csv" || "README.txt")
    );

    const metaDataFile = await zipUpload.files?.["metadata.csv"].async("blob");

    const metadataRaw = await Papa.parsePromise(metaDataFile, {
      header: true,
      error: (error) => {
        setSuccessText(
          "There was an error with the file you uploaded, please try again."
        );
        console.log(error);
      },
    });

    const devicesMetadata = metadataRaw.data.reduce((acc, obj) => {
      acc[obj["file name"]] = { ...obj };
      return acc
    }, {});


    for (const fileName of dataFilesList) {
      if (fileName.split(".").pop() === "csv") {
        const fileContent = await zipUpload.files[fileName].async("blob");
        Papa.parse(fileContent, {
          header: true,
          complete: (results) => {
            const currentDeviceMeta = devicesMetadata[fileName];
            console.log(currentDeviceMeta);
            // results.data - contains the uploaded file output
            let id = currentDeviceMeta["recording id"];
            window.recordings[id] = new UploadedFile(
              results.data,
              currentDeviceMeta["device name"],
              id,
              currentDeviceMeta["sampling rate"],
            );
            setSuccessText("Uploaded!");
          },
          error: (error) => {
            setSuccessText(
              "There was an error with the file you uploaded, please try again."
            );
            console.log(error);
          },
        });
      }
    }
  }

  const successTextStyle =
    successText !== "Uploaded!" ? "text-warning" : "text-success";

  return (
    <div className="w-50">
      <h2>Multi-File Upload</h2>
      <div>
        Upload the recorded zip file from your computer.
        <div className="row mt-3">
          <div className="input-group col">
            <input
              type="file"
              className="form-control"
              id="inputUpload"
              accept=".zip,.rar,.7zip"
              onChange={uploadFile}
            />
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-between">
        <p className={successTextStyle}>{successText}</p>
      </div>
    </div>
  );
}

class UploadedFile {
  buffer_num = 0;
  looping = false;
  playing = false;

  constructor(file, device, id, sampling_rate) {
    this.file = file;
    this.device = device;
    this.id = id;
    this.sampling_rate =
      devicesRaw.find(({ heading }) => heading === device)?.sampling_rate ||
      sampling_rate;

    store.dispatch({
      type: "devices/create",
      payload: {
        id: id,
        metadata: {
          device: this.device,
          "sampling rate": this.sampling_rate,
          playing: false,
          looping: false,
        },
      },
    });
  }

  startPlayback() {
    this.playing = true;
    store.dispatch({
      type: "devices/updateMetadata",
      payload: {
        id: this.id,
        field: "playing",
        data: this.playing,
      },
    });

    this.streamRecorder = setInterval(() => {
      store.dispatch({
        type: "devices/streamUpdate",
        payload: {
          id: this.id,
          data: this.file[this.buffer_num],
        },
      });

      this.buffer_num++;

      if (this.buffer_num > this.file.length - 1) {
        if (!this.looping) {
          this.pausePlayback();
        }
        this.buffer_num = 0;
      }
    }, 1000 / this.sampling_rate);
  }

  pausePlayback() {
    if (this.playing) {
      clearInterval(this.streamRecorder);
      this.playing = false;
      store.dispatch({
        type: "devices/updateMetadata",
        payload: {
          id: this.id,
          field: "playing",
          data: this.playing,
        },
      });
    }
  }

  loopPlayback() {
    this.looping = !this.looping;
    store.dispatch({
      type: "devices/updateMetadata",
      payload: {
        id: this.id,
        field: "looping",
        data: this.looping,
      },
    });
  }

  restartPlayback() {
    this.buffer_num = 0;
    if (this.playing) {
      this.pausePlayback();
    }
  }
}
