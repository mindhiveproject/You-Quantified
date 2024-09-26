import React, { useEffect, useState } from "react";

import { connectMuse } from "./muse";
import { connectEmotiv } from "./emotiv";
import { connectFace } from "./face";
import { connectPose } from "./pose";
import { connectVHeartRate } from "./vheartrate";
import { connectAudioRMS } from "./rms";
import { connectLSL } from "./lsl";
import { connectFaceSync } from "./face_sync";

const connectionText = {
  disconnected: { text: "", type: "" },
  awaiting: { text: "", type: "text-warning" },
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

export const deviceConnectionFunctions = {
  "Muse": connectMuse,
  "LSL": connectLSL,
  "EMOTIV": connectEmotiv,
  "Face": connectFace,
  "Video Heart Rate": connectVHeartRate,
  "AudioVolume": connectAudioRMS,
  "Face Synchronicity": connectFaceSync,
  "Pose Detection": connectPose,
};

export function DeviceConnection({ device }) {
  const onButtonConnect = deviceConnectionFunctions[device];

  const [connText, setConnInfo] = useState({ text: "", type: "" });
  const [disabled, setDisabled] = useState(false);

  function changeConnectionStatus(status) {
    setConnInfo(connectionText[status]);
  }

  useEffect(() => {
    if (typeof navigator.bluetooth === "undefined" && device === "Muse") {
      setDisabled(true);
    }
  }, []);

  if (device === undefined) return;

  return (
    <button
      type="button"
      className={`btn btn-secondary btn-outline-dark fw-medium btn-connect ${
        connText == connectionText.awaiting && "connection-loading"
      }`}
      onClick={() => onButtonConnect(changeConnectionStatus)}
      disabled={disabled}
    >
      {connText == connectionText.awaiting ? (
        <span>Connecting</span>
      ) : (
        <span>Connect</span>
      )}
    </button>
  );
}

function LSLModalHeader() {
  return (
    <div>
      <h2 className="mt-5 mb-2 fw-bold ms-5">Connect an LSL device</h2>
      <div>
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
      </div>
    </div>
  );
}
