import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import RenderDevices from "./device list/render";

import { FileUploader } from "./stream functions/file_upload";
import { createSelector } from "reselect";
import { DeviceConnection } from "./stream functions/main";
import devicesRaw from "../../metadata/devices.json";
import { RecordComponent } from "./recording";

const selectData = (state) => state.dataStream;
const selectDeviceMeta = (state) => state.deviceMeta;

const getDataIDs = createSelector([selectDeviceMeta], (deviceMeta) => {
  return Object.keys(deviceMeta).filter((name) =>
    deviceMeta[name]?.id?.includes("EPOC")
  );
});

export const selectDevices = createSelector(
  [selectData, selectDeviceMeta],
  (dataStream, deviceMeta) => {
    const ids = Object.keys(dataStream);
    const devices = ids.map((id) => deviceMeta[id]?.device);
    return devices.filter(Boolean);
  }
);

export function DevicesManager({
  setShowDevices,
  saveObject,
  recording,
  setRecording,
}) {
  const [previousScreen, setPreviousScreen] = useState();
  const [currentScreen, _setCurrentScreen] = useState("main");
  const [currentDevice, setCurrentDevice] = useState();

  function setCurrentScreen(val) {
    if (val === "new") {
      setPreviousScreen("main");
    } else if (val === "main") {
      setPreviousScreen();
    } else {
      setPreviousScreen(currentScreen);
    }
    _setCurrentScreen(val);
  }

  const previousScreenName = {
    main: "Data sources",
    new: "New devices",
  };

  return (
    <div className="h-100 overflow-scroll disable-scrollbar devices-overlay">
      <div className="d-flex justify-content-end">
        {previousScreen && (
          <button
            className="btn btn-link text-decoration-none fw-medium"
            onClick={() => setCurrentScreen(previousScreen)}
          >
            <i className="bi bi-arrow-left me-1"></i>
            {previousScreenName[previousScreen]}
          </button>
        )}
        <button
          className="btn btn-link text-decoration-none"
          onClick={() => setShowDevices(false)}
        >
          <i className="bi bi-x h4"></i>
        </button>
      </div>
      <div className="d-flex justify-content-end align-items-end text-end me-3">
        {currentScreen === "main" && (
          <MainWindow
            setCurrentScreen={setCurrentScreen}
            setCurrentDevice={setCurrentDevice}
            saveObject={saveObject}
            recording={recording}
            setRecording={setRecording}
          />
        )}
        {currentScreen === "new" && (
          <NewDevicesWindow
            setCurrentScreen={setCurrentScreen}
            setCurrentDevice={setCurrentDevice}
          />
        )}
        {currentScreen === "device" && (
          <DeviceScreen
            setCurrentScreen={setCurrentScreen}
            setCurrentDevice={setCurrentDevice}
            currentDevice={currentDevice}
          />
        )}
      </div>
    </div>
  );
}

const areThereDevices = createSelector(
  [(state) => state.deviceMeta],
  (deviceMeta) => {
    return Object.keys(deviceMeta).length > 0;
  }
);

function MainWindow({
  setCurrentScreen,
  setCurrentDevice,
  saveObject,
  recording,
  setRecording,
}) {
  const areDevices = useSelector(areThereDevices);

  return (
    <div className="w-50">
      <h2 className="mb-2 fw-bold ms-5">Data sources</h2>
      <div className="d-flex p-0 m-0 justify-content-end">
        {true && (
          <RecordComponent
            saveObject={saveObject}
            recording={recording}
            setRecording={setRecording}
          />
        )}

        <button
          className="btn btn-secondary btn-outline-dark fw-medium mb-2 ms-2"
          onClick={() => setCurrentScreen("new")}
        >
          <i className="bi bi-plus m-0 p-0 me-1"></i>New source
        </button>
      </div>
      <div>
        <RenderDevices
          setCurrentScreen={setCurrentScreen}
          setCurrentDevice={setCurrentDevice}
        />
      </div>
    </div>
  );
}

function NewDevicesWindow({ setCurrentScreen, setCurrentDevice }) {
  function changeDevice(input) {
    setCurrentDevice({ name: input });
    setCurrentScreen("device");
  }

  return (
    <div>
      <h2 className="mb-2 fw-bold">Add a new source</h2>

      <div className="button-list mt-3">
        <div
          className="btn btn-link text-decoration-none rounded-0 card text-start p-0 mb-2"
          onClick={() => changeDevice("Upload")}
        >
          <div className="card-body">
            <p className="m-0 text-body-tertiary">Any</p>
            <h5 className="card-title">Upload a file</h5>
            <p className="card-text">
              Upload a file from a stream that was recorded using this app
            </p>
          </div>
        </div>
        {devicesRaw.map((device) => (
          <NewDeviceButton setCurrentDevice={changeDevice} device={device} />
        ))}
      </div>
    </div>
  );
}

function DeviceScreen({ currentDevice, setCurrentScreen }) {
  if (currentDevice?.name === "Upload") {
    return <FileUploader setCurrentScreen={setCurrentScreen} />;
  }
  console.log("Current device");
  console.log(currentDevice);
  return (
    <DeviceConnection
      deviceName={currentDevice?.name}
      deviceID={currentDevice?.id}
    />
  );
}

function NewDeviceButton({ setCurrentDevice, device }) {
  return (
    <div
      className="btn btn-link text-decoration-none rounded-0 card text-start p-0 mb-2"
      onClick={() => setCurrentDevice(device.heading)}
    >
      <div className="card-body">
        <p className="mb-1 text-body-tertiary">{device?.type}</p>
        <h5 className="card-title">{device?.heading}</h5>
        {device?.short_description && (
          <p className="card-text">{device.short_description}</p>
        )}
      </div>
    </div>
  );
}

/* Device Rendering With Images 

      <div className="row g-0 align-items-center">
        // Left column
        <div className="col-md-4 d-flex justify-content-center">
          <img
            src={device?.image || '/placeholder.jpg'}
            alt={device?.heading}
            className="img-fluid rounded-start"
            style={{ maxHeight: '100px', objectFit: 'contain' }} // Ensures the image fits nicely
          />
        </div>
        // Right column
        <div className="col-md-8">
          <div className="card-body">
            <p className="mb-1 text-body-tertiary">{device?.type}</p>
            <h5 className="card-title">{device?.heading}</h5>
            {device?.short_description && (
              <p className="card-text">{device.short_description}</p>
            )}
          </div>
        </div>
      </div>

*/
