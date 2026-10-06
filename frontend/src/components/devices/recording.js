import React from "react";

import { deviceRuntime } from "../../devices/runtime";
import { useSelector } from "react-redux";

export function RecordComponent({ recording, setRecording }) {
  const buttonClassName =
    recording == false
      ? "btn btn-outline-dark fw-medium mb-2"
      : "btn btn-danger btn-outline-dark fw-medium mb-2";
  const iconClassName =
    recording != false ? "bi bi-stop-circle" : "bi bi-record-circle";
  const recordingText = recording != false ? "Stop recording" : "Record data";

  const deviceMeta = useSelector((state) => state.deviceMeta);

  const handleClick = async () => {
    if (!recording) {
      await deviceRuntime.startRecording();
      setRecording(true);
    } else {
      setRecording(false);
      try {
        await deviceRuntime.stopRecording();
      } catch (error) {
        // yq-data refuses to write an empty archive.
        console.warn(error);
        window.alert(error.message);
      }
    }
  };

  if (Object.keys(deviceMeta).length === 0) {
    return;
  }

  return (
    <button className={buttonClassName} onClick={handleClick}>
      <i className={iconClassName}> </i>{recordingText}
    </button>
  );
}
