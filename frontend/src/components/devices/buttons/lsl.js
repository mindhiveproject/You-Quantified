import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";

import { connectionText } from "./connectionText";
import { closestEdge } from "./generic";
import { connectLSL } from "../stream functions/lsl";

export function LSLDeviceButton({ setCurrentDevice }) {
  const deviceMeta = useSelector((state) => state.deviceMeta);
  const divRef = useRef(null);

  const deviceStreams = Object.entries(deviceMeta).filter(
    ([key, value]) => value.device === "LSL"
  );

  const handleMouseEnter = () => {
    setCurrentDevice({ device: "any", card_type: "LSL" });
  };

  const handleMouseLeave = (mouse) => {
    const closeEdge = closestEdge(mouse, divRef.current);
    if (closeEdge === "left") return;
    setCurrentDevice({ device: "none", card_type: "none" });
  };

  const onButtonConnect = connectLSL;

  const [connText, setConnInfo] = useState({ text: "", type: "" });
  const [disabled, setDisabled] = useState(false);

  function changeConnectionStatus(status) {
    setConnInfo(connectionText[status]);
  }

  return (
    <div className="mb-3 d-flex flex-column">
      <div
        className={`card rounded-0 black-hover ${
          connText.text === "Connecting" ? "border-primary" : "border-dark"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={divRef}
      >
        <button
          className={`${
            connText.text === "Connecting" ? "btn-connect" : ""
          } card-body btn btn-link text-decoration-none text-start`}
          onClick={() => onButtonConnect(changeConnectionStatus)}
          disabled={(connText.text === "Connecting") | disabled}
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
      {deviceStreams.length > 0 && (
        <ul className="list-group list-group-flush">
          {deviceStreams.map((obj) => (
            <LSLConnectionIndicator myDeviceMeta={obj[1]} />
          ))}
        </ul>
      )}
    </div>
  );
}

function LSLConnectionIndicator({myDeviceMeta}) {
  const deviceMeta = useSelector((state) => state.deviceMeta);

  const [connText, setConnText] = useState(connectionText["disconnected"]);

  function changeConnectionStatus(status) {
    setConnText(connectionText[status]);
  }

  useEffect(() => {
    const connStatus = deviceMeta?.[myDeviceMeta?.id]?.connected;
    if (!connStatus) {
      changeConnectionStatus("lost");
    } else {
      changeConnectionStatus("connected");
    }
  }, [deviceMeta]);

  return (
    <li className="list-group-item border border-dark mt-n01">
      <div className="d-flex justify-content-between">
        <span>{myDeviceMeta?.id}</span>
        <span className={`${connText.type}`}>{connText.text}</span>
      </div>
    </li>
  );
}
