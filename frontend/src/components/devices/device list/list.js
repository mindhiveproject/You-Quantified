

import React from "react";
import { GenericDeviceButton, FileDeviceButton } from "../buttons/buttons";

export default function DeviceList({ data, name, handleShow, uploaded }) {
  
  let key = data.heading;
  if (key.includes("LSL")) {
    key = "LSL";
  }

  if (uploaded) {
    key = "Upload";
  }

  const buttonComponent =
    key === "Upload" ? (
      <FileDeviceButton data={data} name={name} handleShow={handleShow} />
    ) : (
      <GenericDeviceButton data={data} name={name} handleShow={handleShow} />
    );

  return (
    <div key={name} className="button-list">
      {buttonComponent}
    </div>
  );
}
