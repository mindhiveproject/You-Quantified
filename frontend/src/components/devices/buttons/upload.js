import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useOutsideAlerter } from "../../../utility/outsideClickDetection";
import { closestEdge } from "./generic";
import {
  preRecordedUpload,
  formUploadFile,
  dropZoneUpload,
} from "../../../utility/uploadUtils";
// Add a dropdown menu of sample files
// Let the user select various modalities
// Let the user download the data

window.recordings = {};

export function FileUploadButton({ setCurrentDevice }) {
  const [connText, setConnText] = useState({ text: "", type: "" });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const uploadModalRef = useRef(null);

  const deviceMeta = useSelector((state) => state.deviceMeta);
  const divRef = useRef(null);

  const uploadedStreams = Object.entries(deviceMeta).filter(([key, value]) =>
    value.hasOwnProperty("playing")
  );

  const handleMouseEnter = () => {
    setCurrentDevice({ device: "file", card_type: "upload" });
  };

  const handleMouseLeave = (mouse) => {
    const closeEdge = closestEdge(mouse, divRef.current);
    if (closeEdge === "left") return;
    setCurrentDevice({ device: "none", card_type: "none" });
  };

  useOutsideAlerter(uploadModalRef, setShowUploadModal);

  return (
    <div className="mb-3 d-flex flex-column">
      <div
        className="card rounded-0 black-hover border-dark"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={divRef}
      >
        <button
          className={`${
            connText.text === "Connecting" ? "btn-connect" : ""
          } card-body btn btn-link text-decoration-none text-start`}
          onClick={() => setShowUploadModal(true)}
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
      {uploadedStreams.length > 1 && (
        <div className="list-group list-group-flush">
          <ManageMultiple />
        </div>
      )}
      {uploadedStreams.length > 0 && (
        <ul className="list-group list-group-flush">
          {uploadedStreams.map((obj) => (
            <FileConnectionIndicator deviceID={obj[0]} myDeviceMeta={obj[1]} />
          ))}
        </ul>
      )}
      {showUploadModal && (
        <div className="blur-background-all">
          <DeviceUploadExpanded
            setShowUploadModal={setShowUploadModal}
            setConnText={setConnText}
            connText={connText}
            uploadModalRef={uploadModalRef}
          />
        </div>
      )}
    </div>
  );
}

function ManageMultiple() {
  // grab entire deviceMeta in one hook
  const deviceMeta = useSelector((state) => state.deviceMeta);
  const deviceIDs = Object.keys(window.recordings);
  const isAllPlaying = deviceIDs.every((id) => deviceMeta[id]?.playing);
  const isAllLooping = deviceIDs.every((id) => deviceMeta[id]?.looping);

  const toggleStreaming = () => {
    deviceIDs.forEach((id) => {
      const stream = window.recordings[id];
      isAllPlaying
        ? stream.pausePlayback()
        : !stream.playing && stream.startPlayback();
    });
  };

  const toggleLooping = () => {
    deviceIDs.forEach((id) => window.recordings[id].loopPlayback());
  };

  return (
    <li className="list-group-item border p-0 border-dark mt-n01">
      <div className="d-flex justify-content-between">
        <div className="d-flex align-items-center">
          {false && (
            <span className="material-symbols-outlined me-2 ps-3">
              arrow_right
            </span>
          )}
          <span className="ms-3 align-self-center fw-semibold">Global Controls</span>
        </div>
        <div>
          <button className="btn btn-link">
            <i className="bi bi-rewind" />
          </button>
          <button className="btn btn-link">
            <i
              className={`bi ${isAllPlaying ? "bi-pause" : "bi-play"}`}
              onClick={toggleStreaming}
            />
          </button>
          <button className="btn btn-link">
            <i
              className={`bi bi-arrow-repeat ${
                isAllLooping ? "text-primary" : ""
              }`}
              onClick={toggleLooping}
            />
          </button>
        </div>
      </div>
    </li>
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
        <span className="align-self-center ps-3 text-truncate">{deviceID}</span>
        <div className="d-flex">
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

function DeviceUploadExpanded({
  setShowUploadModal,
  setConnText,
  connText,
  uploadModalRef,
}) {
  const defaultSelection = "upload";

  const preRecordedFileOptions = [
    {
      name: "emotiv",
      display: "EMOTIV Sample File",
      filename: "emotiv-example.zip",
    },
  ];

  const [isDragging, setIsDragging] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(defaultSelection);
  const fileInputRef = useRef(null);

  async function handleButtonClick() {
    if (selectedUpload === "upload" && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (selectedUpload) {
      const fileName = preRecordedFileOptions.find(
        ({ name }) => name === selectedUpload
      )?.filename;
      if (!fileName) {
        return;
      }
      const fileURL = `/sample_data/${fileName}`;
      await preRecordedUpload(fileURL, setConnText);
      setShowUploadModal(false);
    }
  }

  return (
    <div
      className="edit-popup"
      ref={uploadModalRef}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDrop={async (e) => {
        e.preventDefault();
        setIsDragging(false);
        await dropZoneUpload(e, setConnText);
        setShowUploadModal(false);
      }}
      id="modal-upload"
    >
      {isDragging && (
        <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center top-0 start-0 blur-bg">
          Drop your file to upload
        </div>
      )}
      <div className="d-flex row">
        <button
          className="devices-close-btn h4 text-end"
          onClick={() => setShowUploadModal(false)}
        >
          <i className="bi bi-x"></i>
        </button>
        <div>
          <h3>Use a pre-recorded file</h3>
          <p>Use sample data, drag & drop, or browse for your file.</p>
        </div>
        <div className="d-flex justify-content-between">
          <select
            defaultValue={defaultSelection}
            onChange={(e) => setSelectedUpload(e.target.value)}
            className="form-select r-0"
          >
            <option value="upload">Upload your own file</option>
            {preRecordedFileOptions.map((option) => (
              <option value={option.name} key={option.name}>
                {option.display}
              </option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.7zip"
            style={{ display: "none" }}
            onChange={async (e) => {
              await formUploadFile(e, setConnText);
              setShowUploadModal(false);
            }}
            // disabled={connText.text === "Uploading"}
          />
          <button
            className="btn btn-secondary btn-outline-dark ms-n1px"
            onClick={handleButtonClick}
          >
            {selectedUpload === "upload" ? "Upload" : "Select"}
          </button>
        </div>
      </div>
    </div>
  );
}
