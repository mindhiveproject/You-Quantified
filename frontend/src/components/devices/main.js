import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { createSelector } from "reselect";
import { RecordComponent } from "./recording";
import { LeftInfoPane } from "./info panel/main";
import { GenericDeviceButtonsList } from "./buttons/generic";
import { FileUploadButton } from "./buttons/upload";
import { LSLDeviceButton } from "./buttons/lsl";


const selectData = (state) => state.dataStream;
const selectDeviceMeta = (state) => state.deviceMeta;

export const selectDevices = createSelector(
  [selectData, selectDeviceMeta],
  (dataStream, deviceMeta) => {
    const ids = Object.keys(dataStream);
    const devices = ids.map((id) => deviceMeta[id]?.device);
    return devices.filter(Boolean);
  }
);

// Add an outside click alerter
// In the top bar add a recording indicator that has a hover action (to indicate which devices you are using)

export function DevicesManager({
  setShowDevices,
  saveObject,
  recording,
  setRecording,
}) {
  const [currentDevice, setCurrentDevice] = useState();
  const rightPanelRef = useRef(null);
  const leftPaneInfoRef = useRef(null);
  const recordButtonRef = useRef(null);

  function handleMouseLeave() {
    setCurrentDevice({ device: "none", card_type: "none" });
  }

  useMultiOutsideAlerter(
    [rightPanelRef, leftPaneInfoRef, recordButtonRef],
    setShowDevices
  );

  return (
    <div className="h-100 overflow-scroll disable-scrollbar devices-overlay">
      <div className="record-button" ref={recordButtonRef}>
        <RecordComponent
          saveObject={saveObject}
          recording={recording}
          setRecording={setRecording}
        />
      </div>
      <div className="sources-top">
        <div className="d-flex justify-content-end mb-n2">
          <button
            className="btn btn-link text-decoration-none"
            onClick={() => setShowDevices(false)}
          >
            <i className="bi bi-x h4"></i>
          </button>
        </div>
        <div className="text-end me-3 ms-3 p-0">
          <h2 className="mb-2  ms-5">Data Sources</h2>
          <p>Connect and manage devices seamlessly within this dashboard.</p>
        </div>
      </div>
      <div className="d-flex p-0 m-0 justify-content-end">
        <div
          className="sources-pane-left disable-scrollbar w-100"
          onMouseLeave={handleMouseLeave}
        >
          <div className="h-100">
            <LeftInfoPane
              currentDevice={currentDevice}
              leftPaneInfoRef={leftPaneInfoRef}
            />
          </div>
        </div>
        <div
          className="sources-pane-right disable-scrollbar me-3"
          ref={rightPanelRef}
        >
          <RightPane setCurrentDevice={setCurrentDevice} />
        </div>
      </div>
    </div>
  );
}

function RightPane({ setCurrentDevice }) {
  return (
    <div>
      <FileUploadButton setCurrentDevice={setCurrentDevice} />
      <GenericDeviceButtonsList setCurrentDevice={setCurrentDevice} />
      <LSLDeviceButton setCurrentDevice={setCurrentDevice} />
    </div>
  );
}

export function useMultiOutsideAlerter(refs, setShow) {
  useEffect(() => {
    function handleClickOutside(event) {
      const clickedInsideAny = refs.some(
        (ref) => ref.current && ref.current.contains(event.target)
      );
      if (!clickedInsideAny) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [refs, setShow]);
}

// Event Marker Indicators
function EventMarkerCard() {
  const deviceMeta = useSelector((state) => state.deviceMeta);

  const eventMarkerStreams = Object.entries(deviceMeta).filter(
    ([key, value]) => value.type === "event marker"
  );

  const eventMarkerIndicators = eventMarkerStreams?.map((obj) => {
    return <EventMarkerIndicator name={obj.name} deviceMeta={deviceMeta} />;
  });

  return (
    <div className="card rounded-0 mb-2 mt-1">
      <button className="card-body btn btn-link text-decoration-none text-start">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="card-title g-0 m-0">Event Markers</h5>
          </div>
        </div>
      </button>
      <ul className="list-group list-group-flush">{eventMarkerIndicators}</ul>
    </div>
  );
}

function EventMarkerIndicator({ name, deviceMeta }) {
  const [connectionText, setConnectionText] = useState(
    connText["disconnected"]
  );

  function changeConnectionStatus(status) {
    setConnectionText(connText[status]);
  }

  useEffect(() => {
    if (!deviceMeta?.[name]) return;
    const connStatus = deviceMeta?.[name]?.connected;
    if (!connStatus) {
      changeConnectionStatus("lost");
    } else {
      changeConnectionStatus("connected");
    }
  }, [deviceMeta]);

  const segments = name.split("_");
  const visName = segments[segments.length - 1];

  return (
    <li className="list-group-item">
      <div className="d-flex justify-content-between">
        <span>{visName}</span>
        <span className={`${connectionText.type}`}>{connectionText.text}</span>
      </div>
    </li>
  );
}
