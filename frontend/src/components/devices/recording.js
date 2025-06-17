import React, { useState, useEffect } from "react";

import { recordingManager } from "../../utility/recorder";
import { useSelector } from "react-redux";

export function RecordComponent({isRecording, setIsRecording}) {
  
  const deviceMeta = useSelector((state) => state.deviceMeta);
  
  // Sync component state with singleton on mount and unmount
  useEffect(() => {
    setIsRecording(recordingManager.getRecordingStatus());
    
    // If component unmounts while recording, stop recording
    return () => {
      if (isRecording) {
        recordingManager.stopRecording();
      }
    };
  }, []);
  
  const handleClick = () => {
    if (!isRecording) {
      recordingManager.startRecording();
      setIsRecording(true);
    } else {
      recordingManager.stopRecording();
      setIsRecording(false);
    }
  };

  const buttonClassName = isRecording
    ? "btn btn-danger btn-outline-dark fw-medium mb-2"
    : "btn btn-outline-dark fw-medium mb-2";
  
  const iconClassName = isRecording 
    ? "bi bi-stop-circle" 
    : "bi bi-record-circle";
  
  const recordingText = isRecording 
    ? "Stop recording" 
    : "Record data";

  if (Object.keys(deviceMeta).length === 0) {
    return null;
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
