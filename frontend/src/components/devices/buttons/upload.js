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

export function FileUploadButton({ setCurrentDevice }) {
  const [connText, setConnText] = useState({ text: "", type: "" });
  const deviceMeta = useSelector((state) => state.deviceMeta);
  const divRef = useRef(null);
  const fileInputRef = useRef(null);

  const uploadedStreams = Object.entries(deviceMeta).filter(([key, value]) =>
    value.hasOwnProperty("playing")
  );

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleMouseEnter = () => {
    setCurrentDevice({ device: "file", card_type: "upload" });
  };

  const handleMouseLeave = (mouse) => {
    const closeEdge = closestEdge(mouse, divRef.current);
    if (closeEdge === "left") return;
    setCurrentDevice({ device: "none", card_type: "none" });
  };

  return (
    <div className="mb-3 d-flex flex-column">
      <div
        className="card rounded-0 black-hover border-dark"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={divRef}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.7zip"
          style={{ display: "none" }}
          onChange={(e) => uploadFile(e, setConnText)}
          disabled={connText.text === "Uploading"}
        />
        <button
          className={`${
            connText.text === "Connecting" ? "btn-connect" : ""
          } card-body btn btn-link text-decoration-none text-start`}
          onClick={handleClick}
          disabled={connText.text === "Uploading"}
          key="UploadKey"
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

function closestEdge(mouse, elem) {
  var elemBounding = elem.getBoundingClientRect();

  var elementLeftEdge = elemBounding.left;
  var elementTopEdge = elemBounding.top;
  var elementRightEdge = elemBounding.right;
  var elementBottomEdge = elemBounding.bottom;

  var mouseX = mouse.pageX;
  var mouseY = mouse.pageY;

  var topEdgeDist = Math.abs(elementTopEdge - mouseY);
  var bottomEdgeDist = Math.abs(elementBottomEdge - mouseY);
  var leftEdgeDist = Math.abs(elementLeftEdge - mouseX);
  var rightEdgeDist = Math.abs(elementRightEdge - mouseX);

  var min = Math.min(topEdgeDist, bottomEdgeDist, leftEdgeDist, rightEdgeDist);

  switch (min) {
    case leftEdgeDist:
      return "left";
    case rightEdgeDist:
      return "right";
    case topEdgeDist:
      return "top";
    case bottomEdgeDist:
      return "bottom";
  }
}

Papa.parsePromise = function (file, config) {
  return new Promise(function (complete, error) {
    Papa.parse(file, { ...config, complete, error });
  });
};

async function uploadFile(e, setConnText) {
  setConnText("");
  const form = e.currentTarget;
  const [file] = await form.files;

  console.log(file);

  var zip = new JSZip();
  const zipUpload = await zip.loadAsync(file);

  let dataFilesList = Object.keys(zipUpload.files);

  const dataInSubFolder =
    dataFilesList[0].endsWith("/") &&
    dataFilesList.includes(dataFilesList[0] + "metadata.csv");

  if (!dataFilesList.includes("metadata.csv") && !dataInSubFolder) {
    console.log("error, data files incomplete");
    setConnText(connectionText["failed"]);
    return;
  }

  const metadataFileDirectory = dataInSubFolder ? dataFilesList[0] + "metadata.csv" : "metadata.csv";

  const metaDataFile = await zipUpload.files?.[metadataFileDirectory].async(
    "blob"
  );

  const metadataRaw = await Papa.parsePromise(metaDataFile, {
    header: true,
    error: (error) => {
      setConnText(connectionText["failed"]);
      console.log(error);
    },
  });

  console.log(metadataRaw);

  const devicesMetadata = metadataRaw.data.reduce((acc, obj) => {
    acc[obj["file name"]] = { ...obj };
    return acc;
  }, {});

  console.log(devicesMetadata);

  if (dataInSubFolder) {
    dataFilesList = dataFilesList.filter(
      (dataFile) => dataFile.replace(/[^\/]/g, "").length === 1
    );
  }

  dataFilesList = dataFilesList.filter((dataFile) => {
    return metadataRaw.data.some((val) => dataFile.includes(val["file name"]));
  });

  console.log(dataFilesList);

  for (const fileName of dataFilesList) {
    if (fileName.split(".").pop() === "csv") {
      const fileContent = await zipUpload.files[fileName].async("blob");
      Papa.parse(fileContent, {
        header: true,
        complete: (results) => {
          const fileDirectory = dataInSubFolder ? fileName.split('/')[1] : fileName;
          const currentDeviceMeta = devicesMetadata[fileDirectory];
          console.log(fileDirectory);
          console.log(currentDeviceMeta);

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
          setConnText(connectionText["failed"]);
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
