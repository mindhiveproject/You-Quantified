import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";

import { useDispatch, useSelector } from "react-redux";
import { ModalDataInformation } from "../available_data";
import devicesRaw from "../../../metadata/devices.json";
import { connectMuse } from "./muse";
import { connectEmotiv } from "./emotiv";
import { connectFace } from "./face";
import { connectVHeartRate } from "./vheartrate";
import { connectAudioRMS } from "./rms";
import { connectLSL } from "./lsl";

const connectionText = {
  disconnected: { text: "", type: "" },
  awaiting: { text: "Attempting connection ...", type: "text-warning" },
  connected: { text: " ", type: "text-success" },
  failed: { text: "Unable to connect", type: "text-danger" },
  lost: { text: "Connection lost", type: "text-danger" },
};

const disabledStatus = {
  disconnected: false,
  awaiting: true,
  connected: true,
  failed: false,
  lost: false,
};

const deviceConnectionFunctions = {
  Muse: connectMuse,
  LSL: connectLSL,
  EMOTIV: connectEmotiv,
  Face: connectFace,
  VideoHeartRate: connectVHeartRate,
  AudioVolume: connectAudioRMS
};

export function DeviceConnection({ show, handleClose, deviceName, deviceID }) {

  if (deviceName === "" || deviceName === undefined) return;


  const onButtonConnect = deviceConnectionFunctions[deviceName];
  const deviceMeta = useSelector((state) => state.deviceMeta);
  const device = devicesRaw.find(({ heading }) => heading === deviceName);

  const [connText, setConnInfo] = useState({ text: "", type: "" });
  const [disabled, setDisabled] = useState(false);

  function changeConnectionStatus(status) {
    setConnInfo(connectionText[status]);
    setDisabled(disabledStatus[status]);
  }

  useEffect(() => {
    if (deviceID) {
      const connStatus = deviceMeta?.[deviceID]?.connected;
      if (connStatus) {
        changeConnectionStatus("connected");
      } else {
        changeConnectionStatus("lost");
      }
    }
  }, [deviceMeta]);

  const source = [deviceName];

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      {deviceName === "LSL" ? (
        <LSLModalHeader />
      ) : (
        <>
          <Modal.Header closeButton>
            <Modal.Title>{device.heading}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {device.description}
            <div className="mt-3">
              <h5>Available data streams</h5>
              <p>
                This device can stream the following data to a visualization.
                Hover to learn more.
              </p>
              <ModalDataInformation
                source={source}
                popupInfo={[device]}
                groupData={true}
              />
            </div>
          </Modal.Body>
        </>
      )}
      <Modal.Footer className="d-flex justify-content-between">
        {deviceName === "Muse" && typeof navigator.bluetooth === "undefined" ? (
          <p>Your browser does not support this device</p>
        ) : (
          <>
            <p className={connText.type}>{connText.text}</p>
            {!(connText.text === " ") ? (
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={() => onButtonConnect(changeConnectionStatus)}
                disabled={disabled}
              >
                <i className="bi bi-bluetooth me-2"></i>Connect
              </button>
            ) : (
              <div className="text-success mt-1 mb-1">Connected</div>
            )}
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}

function LSLModalHeader() {
  return (
    <div>
      <Modal.Header closeButton>
        <Modal.Title>Connect your LSL device</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        This is a custom LSL stream. LSL devices can different properties
        depending on the device that you connect. To learn more about LSL, view
        their
        <a
          className="link-underline link-underline-opacity-0"
          href="https://github.com/sccn/labstreaminglayer"
          target="_blank"
        >
          {" "}
          repository.
        </a>
      </Modal.Body>
    </div>
  );
}
