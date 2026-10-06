import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";

import { connectionText } from "./connectionText";
import { closestEdge, DeviceConnectionIndicator } from "./generic";
import { lslDevice } from "../../../devices/definitions";
import { deviceRuntime } from "../../../devices/runtime";

export function LSLDeviceButton({ setCurrentDevice }) {
  const deviceMeta = useSelector((state) => state.deviceMeta);
  const divRef = useRef(null);
  const [connText, setConnInfo] = useState({ text: "", type: "" });
  const [error, setError] = useState("");

  const deviceStreams = Object.entries(deviceMeta).filter(
    ([key, value]) => value.device === lslDevice.name,
  );

  const handleMouseEnter = () => {
    setCurrentDevice({ device: "any", card_type: "LSL" });
  };

  const handleMouseLeave = (mouse) => {
    const closeEdge = closestEdge(mouse, divRef.current);
    if (closeEdge === "left") return;
    setCurrentDevice({ device: "none", card_type: "none" });
  };

  async function connect() {
    setError("");
    setConnInfo(connectionText["awaiting"]);
    try {
      await deviceRuntime.connect(lslDevice.id);
      setConnInfo(connectionText["connected"]);
    } catch (e) {
      console.error("Could not connect to the LSL relay", e);
      setError(e?.message || "Could not connect to the LSL relay");
      setConnInfo(connectionText["failed"]);
    }
  }

  const connecting = connText.text === "Connecting";

  return (
    <div className="mb-3 d-flex flex-column">
      <div
        className={`card rounded-0 black-hover ${
          connecting ? "border-primary" : "border-dark"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={divRef}
      >
        <button
          className={`${
            connecting ? "btn-connect" : ""
          } card-body btn btn-link text-decoration-none text-start`}
          onClick={connect}
          disabled={connecting || deviceStreams.length > 0}
        >
          <div className="d-flex text-start justify-content-between">
            <div>
              <small className="g-0 m-0">Any</small>
              <h5 className="card-title g-0 m-0">LSL Stream Connection</h5>
            </div>
            <div className="align-self-center">
              {connText.text !== "Connected" && <span>{connText.text}</span>}
            </div>
          </div>
        </button>
      </div>
      {error && <small className="text-danger mt-1">{error}</small>}
      {deviceStreams.length > 0 && (
        <ul className="list-group list-group-flush">
          {deviceStreams.map((obj) => (
            <DeviceConnectionIndicator myDeviceMeta={obj[1]} key={obj[1]?.id} />
          ))}
        </ul>
      )}
    </div>
  );
}
