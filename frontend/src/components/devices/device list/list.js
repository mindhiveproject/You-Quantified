import React from "react";
import {
  GenericDeviceButton,
  FileDeviceButton,
  EventMarkerButton,
} from "../buttons/buttons";

export default function DeviceList({ data, name, handleShow, uploaded }) {
  let key = data.heading;

  if (uploaded) {
    key = "Upload";
  }

  const buttonTypes = {
    Upload: (
      <FileDeviceButton data={data} name={name} handleShow={handleShow} />
    ),
    "Event Markers": <EventMarkerButton data={data} name={name} />,
  };

  if (buttonTypes[key]) {
    return buttonTypes[key];
  }

  return (
    <div key={name} className="button-list">
      <GenericDeviceButton data={data} name={name} handleShow={handleShow} />
    </div>
  );
}
