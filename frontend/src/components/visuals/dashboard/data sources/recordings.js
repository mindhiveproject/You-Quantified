import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { deviceRuntime } from "../../../../devices/runtime";
import { ModalHeader } from "../../../modal";
import { connectionText } from "./connection_text";

const SAMPLE_RECORDINGS = [
  { name: "emotiv", display: "EMOTIV Sample File", url: "/sample_data/emotiv-example.zip" },
];

function recordingName(fileName) {
  return fileName.replace(/\.zip$/i, "");
}

async function loadFiles(files) {
  for (const file of files) {
    if (!file.name.endsWith(".zip") && !file.type.includes("zip")) {
      throw new Error(`${file.name} isn't a .zip recording.`);
    }
    await deviceRuntime.loadRecording(file, recordingName(file.name));
  }
}

function loadSample(url) {
  return deviceRuntime.loadRecording(url, recordingName(url.split("/").pop()));
}

// The recordings being replayed, each with its playback controls. Replays
// stream into the visual like any connected source.
export function RecordingList() {
  const deviceMeta = useSelector((state) => state.deviceMeta);
  const ids = Object.keys(deviceMeta).filter((id) =>
    deviceMeta[id].hasOwnProperty("playing"),
  );

  if (ids.length === 0) return null;

  return (
    <div className="card rounded-0 border-dark mb-3">
      <div className="card-body">
        <small>Pre-recorded streams</small>
        <h5 className="card-title m-0">Recordings</h5>
      </div>
      <ul className="list-group list-group-flush border-top border-dark">
        {ids.length > 1 && <ManageMultiple ids={ids} />}
        {ids.map((id) => (
          <RecordingRow id={id} key={id} />
        ))}
      </ul>
    </div>
  );
}

function ManageMultiple({ ids }) {
  const deviceMeta = useSelector((state) => state.deviceMeta);
  const isAllPlaying = ids.every((id) => deviceMeta[id]?.playing);
  const isAllLooping = ids.every((id) => deviceMeta[id]?.looping);

  const toggleStreaming = () => {
    ids.forEach((id) => {
      const controls = deviceRuntime.replayControls(id);
      isAllPlaying
        ? controls.pause()
        : !deviceMeta[id]?.playing && controls.play();
    });
  };

  // Puts every recording in the same looping state, rather than flipping each.
  const toggleLooping = () => {
    ids.forEach((id) => {
      if (Boolean(deviceMeta[id]?.looping) === isAllLooping) {
        deviceRuntime.replayControls(id).toggleLoop();
      }
    });
  };

  return (
    <li className="list-group-item p-0">
      <div className="d-flex justify-content-between">
        <span className="ms-3 align-self-center fw-semibold">All recordings</span>
        <div>
          <button className="btn btn-link" onClick={toggleStreaming}>
            <i className={`bi ${isAllPlaying ? "bi-pause" : "bi-play"}`} />
          </button>
          <button className="btn btn-link" onClick={toggleLooping}>
            <i className={`bi bi-arrow-repeat ${isAllLooping ? "text-primary" : ""}`} />
          </button>
        </div>
      </div>
    </li>
  );
}

function RecordingRow({ id }) {
  const { playing, looping, legacy } = useSelector((state) => state.deviceMeta[id]);
  const controls = deviceRuntime.replayControls(id);

  return (
    <li className="list-group-item p-0">
      <div className="d-flex justify-content-between">
        <span
          className="align-self-center ps-3 text-truncate"
          title={legacy ? "Recorded before the yq-data update; converted on load" : undefined}
        >
          {id}
          {legacy && <small className="ms-2 opacity-50">legacy</small>}
        </span>
        <div className="d-flex">
          <button className="btn btn-link" title="Restart" onClick={controls.restart}>
            <i className="bi bi-rewind" />
          </button>
          <button
            className="btn btn-link"
            title={playing ? "Pause" : "Play"}
            onClick={playing ? controls.pause : controls.play}
          >
            <i className={`bi ${playing ? "bi-pause" : "bi-play"}`} />
          </button>
          <button className="btn btn-link" title="Loop" onClick={controls.toggleLoop}>
            <i className={`bi bi-arrow-repeat ${looping ? "text-primary" : ""}`} />
          </button>
          <button
            className="btn btn-link"
            title="Remove"
            onClick={() => deviceRuntime.closeRecording(id)}
          >
            <i className="bi bi-x" />
          </button>
        </div>
      </div>
    </li>
  );
}

// Loads a recording made with this app, from a sample, a file picker or a drop.
// Uploaded files never leave the computer.
export function ReplayModal({ onClose }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState("upload");
  const [status, setStatus] = useState(connectionText.disconnected);
  const fileInputRef = useRef(null);

  async function load(loader) {
    setStatus(connectionText.awaiting);
    try {
      await loader();
      onClose();
    } catch (error) {
      console.error(error);
      setStatus({ ...connectionText.failed, text: error.message });
    }
  }

  function handleButtonClick() {
    if (selected === "upload") {
      fileInputRef.current.click();
    } else {
      const sample = SAMPLE_RECORDINGS.find(({ name }) => name === selected);
      load(() => loadSample(sample.url));
    }
  }

  return (
    <div
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        load(() => loadFiles(e.dataTransfer.files));
      }}
    >
      {isDragging && (
        <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center top-0 start-0 blur-bg">
          Drop your file to upload
        </div>
      )}
      <ModalHeader title="Replay a recording" onClose={onClose} />
      <p>
        Use sample data, drag & drop, or browse for a .zip recording made with
        this app. Files stay on your computer.
      </p>
      <div className="d-flex justify-content-between">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="form-select r-0"
        >
          <option value="upload">Upload your own file</option>
          {SAMPLE_RECORDINGS.map((option) => (
            <option value={option.name} key={option.name}>
              {option.display}
            </option>
          ))}
        </select>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          style={{ display: "none" }}
          onChange={(e) => {
            const files = e.target.files;
            load(() => loadFiles(files));
          }}
        />
        <button
          className="btn btn-secondary btn-outline-dark ms-n1px"
          onClick={handleButtonClick}
          disabled={status === connectionText.awaiting}
        >
          {selected === "upload" ? "Upload" : "Select"}
        </button>
      </div>
      {status.text && <small className={`d-block mt-2 ${status.type}`}>{status.text}</small>}
    </div>
  );
}
