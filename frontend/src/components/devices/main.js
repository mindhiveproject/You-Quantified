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
  const [currentScreen, setCurrentScreen] = useState("main");
  const [currentDevice, setCurrentDevice] = useState();

  return (
    <div className="h-100 overflow-scroll disable-scrollbar devices-overlay">
      <button
        className="devices-close-btn h4"
        onClick={() => setShowDevices(false)}
      >
        <i className="bi bi-x"></i>
      </button>
      <div className="d-flex justify-content-end align-items-end text-end me-3">
        {currentScreen === "main" && (
          <MainWindow
            setCurrentScreen={setCurrentScreen}
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

function MainWindow({ setCurrentScreen, saveObject, recording, setRecording }) {
  const areDevices = useSelector(areThereDevices);

  return (
    <div className="w-50">
      <h2 className="mt-5 mb-2 fw-bold ms-5">Data sources</h2>
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
        <RenderDevices />
      </div>
    </div>
  );
}

function NewDevicesWindow({ setCurrentScreen, setCurrentDevice }) {
  function changeDevice(input) {
    setCurrentDevice(input);
    setCurrentScreen("device");
  }

  return (
    <div>
      <div className="ms-5 mt-5">
        <button
          className="btn btn-link text-decoration-none fw-medium mb-0"
          onClick={() => setCurrentScreen("main")}
        >
          <i className="bi bi-arrow-left-short"></i>Data sources
        </button>
        <h2 className="mb-2 fw-bold">Add a new source</h2>
      </div>
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

function DeviceScreen({ setCurrentDevice, currentDevice, setCurrentScreen }) {
  if (currentDevice === "Upload") {
    return <FileUploader setCurrentScreen={setCurrentScreen} />;
  }

  return (
    <DeviceConnection
      deviceName={currentDevice}
      setCurrentScreen={setCurrentScreen}
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

/*
export function DeviceSelectionWindow() {
  const [modalDevice, setModalDevice] = useState(<></>);
  const [show, setShow] = useState(false);

  const handleClose = () => {
    setShow(false);
    setModalDevice(<></>);
  };

  function handleShow(device) {
    const deviceModals = (name) =>
      name === "Upload" ? (
        <FileUploader show={show} handleClose={handleClose} />
      ) : (
        <DeviceConnection
          show={show}
          handleClose={handleClose}
          deviceName={name}
        />
      );
    setModalDevice(deviceModals(device));
  }

  useEffect(() => {
    setShow(!show);
  }, [modalDevice]);

  // Check if you have more than two EPOC or EPOC+ headsets. If you do, the connectivity option becomes available
  const emotivIDs = useSelector(getDataIDs);
  let showConn = false;
  if (emotivIDs.length > 1) {
    showConn = true;
  }

  const [pressingAlt, setPressingAlt] = useState(false);

  window.addEventListener("keydown", (e) => {
    if (e.altKey) {
      setPressingAlt(true);
    }
  });
  window.addEventListener("keyup", (e) => {
    if (!e.altKey) {
      setPressingAlt(false);
    }
  });

  return (
    <div className="center-margin text-center align-items-center">
      <h4 className="mt-5 mb-2">Data Sources</h4>
      <p className="center-margin" style={{ overflowWrap: "nowrap" }}>
        Here you can connect to different devices, manage them, and upload files
        from previous recordings.
      </p>
      <div className="ms-5 me-5">
        <RenderDevices />
        <div className="d-flex justify-content-center">
          <div className="dropdown-center">
            <a
              className="btn btn-link"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bi bi-plus-circle h5"></i>
            </a>
          </div>
          {modalDevice}
        </div>
      </div>
    </div>
  );
}

*/
