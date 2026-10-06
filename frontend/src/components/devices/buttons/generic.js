import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { devices } from "../../../devices/definitions";
import { deviceRuntime } from "../../../devices/runtime";
import { connectionText } from "./connectionText";

export function closestEdge(mouse, elem) {
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

export function GenericDeviceButtonsList({ setCurrentDevice }) {
  return (
    <div>
      {devices.map((definition) => (
        <GenericDeviceButton
          definition={definition}
          setCurrentDevice={setCurrentDevice}
          key={definition.id}
        />
      ))}
    </div>
  );
}

function GenericDeviceButton({ definition, setCurrentDevice }) {
  const deviceMeta = useSelector((state) => state.deviceMeta);
  const divRef = useRef(null);
  const [connText, setConnInfo] = useState({ text: "", type: "" });
  const [error, setError] = useState("");

  const deviceStreams = Object.entries(deviceMeta).filter(
    ([key, value]) => value.device === definition.name,
  );

  const handleMouseEnter = () => {
    setCurrentDevice({
      device: definition.name,
      card_type: definition.card_type || "generic",
    });
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
      await deviceRuntime.connect(definition.id);
      setConnInfo(connectionText["connected"]);
    } catch (e) {
      console.error(`Could not connect ${definition.name}`, e);
      setError(e?.message || "Could not connect");
      setConnInfo(connectionText["failed"]);
    }
  }

  const unsupported =
    definition.requires === "bluetooth" &&
    typeof navigator.bluetooth === "undefined";
  const inUse = definition.connections !== "multiple" && deviceStreams.length > 0;
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
          disabled={connecting || unsupported || inUse}
        >
          <div className="d-flex text-start justify-content-between">
            <div>
              <small className="g-0 m-0">{definition.type}</small>
              <h5 className="card-title g-0 m-0">{definition.name}</h5>
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

// One row per connected device, with a way to disconnect it. Shared with the
// LSL button, whose streams are listed the same way.
export function DeviceConnectionIndicator({ myDeviceMeta }) {
  const connected = useSelector(
    (state) => state.deviceMeta?.[myDeviceMeta?.id]?.connected,
  );
  const status = connectionText[connected ? "connected" : "lost"];

  return (
    <li className="list-group-item border border-dark mt-n01">
      <div className="d-flex justify-content-between align-items-center">
        <span className="text-truncate">{myDeviceMeta?.id}</span>
        <span className="d-flex align-items-center">
          <span className={`${status.type}`}>{status.text}</span>
          <button
            className="btn btn-link p-0 ms-2 text-decoration-none"
            title="Disconnect"
            onClick={() => deviceRuntime.disconnect(myDeviceMeta?.id)}
          >
            <i className="bi bi-x" />
          </button>
        </span>
      </div>
    </li>
  );
}
