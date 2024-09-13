import React, { useState } from "react";

import devicesRaw from "../../../metadata/devices";
import { useSelector } from "react-redux";

// import { DeviceConnection } from "../stream functions/connection_modal";

import { DeviceConnection } from "../stream functions/main";

import DeviceList from "./list";

export default function RenderDevices({ setCurrentScreen, setCurrentDevice }) {
  const deviceMeta = useSelector((state) => state.deviceMeta);

  function handleShow(data) {
    setCurrentScreen("device");
    setCurrentDevice({ name: deviceMeta?.[data]?.device, id: data });
  }

  const deviceButtonList = Object.keys(deviceMeta)?.map((id) => {
    const currDev = deviceMeta[id];
    let data = devicesRaw.find(({ heading }) => currDev.device === heading) || {
      heading: currDev?.["device"],
      type: currDev?.["device"],
      sampling_rate: currDev?.["sampling rate"],
    };
    // Here I could add another option to get data from the store in case it doesn't find it

    if (data.type == undefined) {
      data = {
        heading:
          currDev?.info?.name != undefined
            ? "LSL - " + currDev?.info?.name
            : "LSL",
        description:
          "This is a custom LSL stream. LSL devices can have very different properties",
        type: currDev?.info?.type || "custom",
        sampling_rate: currDev?.info?.nominal_srate,
      };
    }

    const uploaded = "playing" in deviceMeta[id];

    return (
      <DeviceList
        data={data}
        name={id}
        handleShow={handleShow}
        key={id}
        uploaded={uploaded}
      />
    );
  });

  return <div>{deviceButtonList}</div>;
}
