import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import devicesRaw from "../../../metadata/devices.json";

import { deviceConnectionFunctions } from "../stream functions/main";
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
  const deviceCards = devicesRaw.map((jsonMeta) => {
    return (
      <GenericDeviceButton
        jsonMeta={jsonMeta}
        setCurrentDevice={setCurrentDevice}
        key={jsonMeta.device}
      />
    );
  });

  return <div>{deviceCards}</div>;
}

function GenericDeviceButton({ jsonMeta, setCurrentDevice }) {
  const deviceMeta = useSelector((state) => state.deviceMeta);
  const divRef = useRef(null);

  const deviceStreams = Object.entries(deviceMeta).filter(
    ([key, value]) => value.device === jsonMeta.device
  );

  const handleMouseEnter = () => {
    setCurrentDevice({ device: jsonMeta.device, card_type: "generic" });
  };

  const handleMouseLeave = (mouse) => {
    const closeEdge = closestEdge(mouse, divRef.current);
    if (closeEdge === "left") return;
    setCurrentDevice({ device: "none", card_type: "none" });
  };

  const onButtonConnect = deviceConnectionFunctions[jsonMeta.device];

  const [connText, setConnInfo] = useState({ text: "", type: "" });
  const [disabled, setDisabled] = useState(false);

  function changeConnectionStatus(status) {
    setConnInfo(connectionText[status]);
  }

  useEffect(() => {
    if (typeof navigator.bluetooth === "undefined" && jsonMeta.device === "Muse") {
      setDisabled(true);
    }
    if (jsonMeta.connections !== "multiple" && deviceStreams.length > 0) {
      setDisabled(true);
    }
  }, [connText]);

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
              <small className="g-0 m-0">{jsonMeta.type}</small>
              <h5 className="card-title g-0 m-0">{jsonMeta.device}</h5>
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
            <DeviceConnectionIndicator myDeviceMeta={obj[1]} key={obj[1]?.id}/>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeviceConnectionIndicator({ myDeviceMeta }) {
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
