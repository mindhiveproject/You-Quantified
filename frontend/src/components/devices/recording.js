import React from "react";

import { subToStore, stopRecording } from "../../utility/recorder";

export function RecordComponent({ recording, setRecording, saveObject }) {
  // Save object might be changed to a hook?

  const buttonClassName =
    recording != false
      ? "btn-link text-danger rounded-0"
      : "btn-link rounded-0";
  const iconClassName =
    recording != false ? "bi bi-stop-circle" : "bi bi-record-circle";
  const recordingText = recording != false ? "Stop recording" : "Record data";

  const handleClick = () => {
    if (!recording) {
      setRecording(subToStore(saveObject));
    } else {
      stopRecording(recording, saveObject);
      setRecording(false);
    }
  };

  return (
    <button className={buttonClassName} onClick={handleClick}>
      <i className={iconClassName}>{recordingText}</i>
    </button>
  );
}
