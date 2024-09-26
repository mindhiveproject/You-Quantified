import React, { useState, useRef } from "react";
import JSZip from "jszip";
import Papa from "papaparse";
import devicesRaw from "../../../metadata/devices.json";
import store from "../../../store/store";
import { useSelector } from "react-redux";

const connectionText = {
  awaiting: { text: "Uploading", type: "text-success" },
  connected: { text: "Uploaded", type: "text-success" },
  failed: { text: "Failed", type: "text-danger" },
};

window.recordings = {};

Papa.parsePromise = function (file, config) {
  return new Promise(function (complete, error) {
    Papa.parse(file, { ...config, complete, error });
  });
};

async function uploadFile(e, setConnText) {
  setConnText("");
  const form = e.currentTarget;
  const [file] = await form.files;

  var zip = new JSZip();
  const zipUpload = await zip.loadAsync(file);

  let dataFilesList = Object.keys(zipUpload.files);

  if (
    !dataFilesList.includes("metadata.csv") ||
    !dataFilesList.includes("README.txt")
  ) {
    setConnText(connectionText["failed"]);
    return;
  }

  dataFilesList = dataFilesList.filter(
    (e) => e !== ("metadata.csv" || "README.txt")
  );

  const metaDataFile = await zipUpload.files?.["metadata.csv"].async("blob");

  const metadataRaw = await Papa.parsePromise(metaDataFile, {
    header: true,
    error: (error) => {
      setConnText(connectionText["failed"]);
      console.log(error);
    },
  });

  const devicesMetadata = metadataRaw.data.reduce((acc, obj) => {
    acc[obj["file name"]] = { ...obj };
    return acc;
  }, {});

  for (const fileName of dataFilesList) {
    if (fileName.split(".").pop() === "csv") {
      const fileContent = await zipUpload.files[fileName].async("blob");
      Papa.parse(fileContent, {
        header: true,
        complete: (results) => {
          const currentDeviceMeta = devicesMetadata[fileName];

          // results.data - contains the uploaded file output
          let id = currentDeviceMeta["recording id"] + " Recording";
          window.recordings[id] = new UploadedFile(
            results.data,
            currentDeviceMeta["device name"],
            id,
            currentDeviceMeta["sampling rate"]
          );
          setConnText(connectionText["connected"]);
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
        id: this.id,
        metadata: {
          device: this.device,
          id: this.id,
          "sampling rate": this.sampling_rate,
          connected: true,
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

export function FileUploadButton() {
  const [connText, setConnText] = useState({ text: "", type: "" });
  const deviceMeta = useSelector((state) => state.deviceMeta);
  const fileInputRef = useRef(null);

  const uploadedStreams = Object.entries(deviceMeta).filter(([key, value]) =>
    value.hasOwnProperty("playing")
  );

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mb-3 d-flex flex-column">
      <div className="card rounded-0 black-hover border-dark">
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.rar,.7zip"
          style={{ display: "none" }}
          onChange={(e) => uploadFile(e, setConnText)}
          disabled={connText.text === "Uploading"}
        />
        <button
          className={`${
            connText.text === "Connecting" ? "btn-connect" : ""
          } card-body btn btn-link text-decoration-none text-start`}
          type="file"
          accept=".zip,.rar,.7zip"
          onClick={handleClick}
          disabled={connText.text === "Uploading"}
        >
          <div className="d-flex text-start justify-content-between">
            <div>
              <small className="g-0 m-0">Pre-recorded stream</small>
              <h5 className="card-title g-0 m-0">Upload a file</h5>
            </div>
            <div className="align-self-center">
              {connText.text !== "Connected" && <span>{connText.text}</span>}
            </div>
          </div>
        </button>
      </div>
      {uploadedStreams.length > 0 && (
        <ul className="list-group list-group-flush">
          {uploadedStreams.map((obj) => (
            <FileConnectionIndicator deviceID={obj[0]} myDeviceMeta={obj[1]} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FileConnectionIndicator({ myDeviceMeta, deviceID }) {

  const streamObject = window.recordings[deviceID];

  const playing = useSelector((state) => state?.deviceMeta[deviceID]?.playing);
  const looping = useSelector((state) => state?.deviceMeta[deviceID]?.looping);

  function startStreaming() {
    streamObject.startPlayback();
  }

  function pauseStreaming() {
    streamObject.pausePlayback();
  }

  function loopStreaming() {
    streamObject.loopPlayback();
  }

  function restartStreaming() {
    streamObject.restartPlayback();
  }

  return (
    <li className="list-group-item border p-0 border-dark mt-n01">
      <div className="d-flex justify-content-between">
        <span className="align-self-center ps-3">{deviceID}</span>
        <div>
          <button className="btn btn-link" onClick={restartStreaming}>
            <i className="bi bi-rewind" />
          </button>
          {playing ? (
            <button className="btn btn-link">
              <i className="bi bi-pause" onClick={pauseStreaming} />
            </button>
          ) : (
            <button className="btn btn-link">
              <i className="bi bi-play" onClick={startStreaming} />
            </button>
          )}
          <button className="btn btn-link">
            <i
              className={`bi bi-arrow-repeat ${looping ? "text-primary" : ""}`}
              onClick={loopStreaming}
            />
          </button>
        </div>
      </div>
    </li>
  );
}
