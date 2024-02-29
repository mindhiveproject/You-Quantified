import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const connText = {
  disconnected: { text: "", type: "" },
  awaiting: { text: "Attempting connection ...", type: "text-warning" },
  connected: { text: "Connected", type: "text-success" },
  failed: { text: "Unable to connect", type: "text-danger" },
  lost: { text: "Connection lost", type: "text-danger" },
};

export function GenericDeviceButton({ data, name, handleShow }) {
  const deviceMeta = useSelector((state) => state.deviceMeta);

  const [connectionText, setConnectionText] = useState(
    connText["disconnected"]
  );

  function changeConnectionStatus(status) {
    setConnectionText(connText[status]);
  }

  useEffect(() => {
    if (!deviceMeta?.[name]) return;
    const connStatus = deviceMeta?.[name]?.connected;
    if (!connStatus) {
      changeConnectionStatus("lost");
    } else {
      changeConnectionStatus("connected");
    }
  }, [deviceMeta]);

  return (
    <div className="card rounded-0 mb-2 mt-1">
      <button
        className="card-body btn btn-link text-decoration-none text-start"
        onClick={() => handleShow(name)}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="card-title g-0 m-0">{name}</h5>
            <small className="g-0 m-0">{data.heading}</small>
          </div>
          <p className={`g-0 m-0 h-100 ${connectionText.type}`}>
            {connectionText.text}
          </p>
        </div>
      </button>
    </div>
  );
}

export function FileDeviceButton({ data, name, handleShow }) {
  const streamObject = window.recordings[name];

  const playing = useSelector((state) => state.deviceMeta[name].playing);
  const looping = useSelector((state) => state.deviceMeta[name].looping);

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
    <div>
      <div className="row card-margin">
        <div className="card rounded-0 mb-2 mt-1 col-8">
          <button
            className="card-body btn btn-link text-decoration-none text-start"
            onClick={() => handleShow(name)}
          >
            <h5 className="card-title g-0 m-0">{name}</h5>
            <small className="g-0 m-0">{data.heading}</small>
          </button>
        </div>
        <div className="card rounded-0 mb-2 mt-1 col-4">
          <div className="card-body d-flex align-items-center justify-content-center">
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
                className={`bi bi-arrow-repeat ${
                  looping ? "text-primary" : ""
                }`}
                onClick={loopStreaming}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
