import React from "react";

import { subToStore, stopRecording, beginStream } from "../../utility/recorder";
import { useSelector } from "react-redux";

export function RecordComponent({ recording, setRecording, saveObject }) {
  // Save object might be changed to a hook?

  const buttonClassName =
    recording == false
      ? "btn btn-outline-dark fw-medium mb-2"
      : "btn btn-danger btn-outline-dark fw-medium mb-2";
  const iconClassName =
    recording != false ? "bi bi-stop-circle" : "bi bi-record-circle";
  const recordingText = recording != false ? "Stop recording" : "Record data";

  const deviceMeta = useSelector((state) => state.deviceMeta);
  
  const handleClick = () => {
    if (!recording) {
      // beginStream(saveObject);
      setRecording(subToStore());
    } else {
      stopRecording(recording, deviceMeta);
      setRecording(false);
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

function getMemoryUsage() {
  if (performance && performance.memory) {
    return performance.memory.usedJSHeapSize;
  }
  return null;
}
