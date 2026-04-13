import { useState } from "react";
import { motion } from "framer-motion";
import { WaveFormIcon } from "./WaveFormIcon";
import { useSelector, shallowEqual } from "react-redux";
import clsx from "clsx";
export function MappingsManager({ parameter, changeSource, currentMapping, updateParameter }) {
  // Contains the search, pinned parameters, and connected devices for mapping

  const deviceKeys = useSelector(
    (state) => Object.keys(state.dataStream),
    shallowEqual,
  );

  const dataStream = useSelector((state) => state.dataStream);

  const [searchInput, setSearchInput] = useState("");

  function selectNewSource(device, stream) {
    if (device === "Manual") {
      changeSource("Manual");
    } else {
      changeSource({ device, stream });
    }
  }

  function pinDefault(newSuggested) {
    updateParameter(parameter, { suggested: [...(parameter?.suggested || []), newSuggested] });
  }

  function unpinDefault(oldSuggested) {
    const newSuggested = parameter?.suggested?.filter((x) => x !== oldSuggested) || [];
    updateParameter(parameter, { suggested: newSuggested });
  }

  const isMapped = currentMapping !== undefined;

  const deviceEntries = Object.entries(dataStream)
    .filter(([key, value]) => {
      if (!searchInput) return true;
      const q = searchInput.toLowerCase();
      if (key.toLowerCase().includes(q)) return true;
      return Object.keys(value).some((s) => s.toLowerCase().includes(q));
    })
    .map(([key, value]) => {
      const filteredStreams = searchInput
        ? Object.fromEntries(
            Object.entries(value).filter(
              ([s]) =>
                key.toLowerCase().includes(searchInput.toLowerCase()) ||
                s.toLowerCase().includes(searchInput.toLowerCase()),
            ),
          )
        : value;
      return (
        <ConnectedDeviceAccordion
          key={key}
          device={key}
          streams={filteredStreams}
          selectNewSource={selectNewSource}
          currentMapping={currentMapping}
          parameter={parameter}
          pinDefault={pinDefault}
          unpinDefault={unpinDefault}
        />
      );
    });

  return (
    <div className="d-flex flex-column h-100">
      <div className="p-3 flex-shrink-0">
        <div>
          <h6 className="text-body-tertiary mb-1">Search</h6>
          <input
            className="form-control pt-2 pb-2"
            placeholder="Type to look for a device or parameter"
            aria-label="search"
            autoComplete="off"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          ></input>
        </div>
      </div>
      <div className="flex-grow-1 overflow-y-auto p-3 pt-0">
        <h6 className="text-body-tertiary mb-1">Connected Devices</h6>
        {deviceEntries}
      </div>
    </div>
  );
}

function ConnectedDeviceAccordion({
  parameter,
  currentMapping,
  device,
  streams,
  selectNewSource,
  pinDefault,
  unpinDefault,
}) {
  const parameterCards = Object.keys(streams).map((key) => {

    const isPinned = parameter?.suggested?.some(
      (s) => s.device === device && s.stream === key,
    );

    return (
      <ParameterDataCard
        key={key}
        currentMapping={currentMapping}
        stream={key}
        isPinned={isPinned}
        selectNewSource={selectNewSource}
        device={device}
        pinDefault={pinDefault}
        unpinDefault={unpinDefault}
      />
    );
  });

  return (
    <div>
      <div className="d-flex justify-content-between border border-dark p-2 ps-3">
        <div className="d-flex align-items-center">
          <div>
            <h6 className="m-0 p-0 mb-1 mt-1">{device}</h6>
            {/*<p className="m-0 p-0 text-body-tertiary">EMOTIV HQ-22</p>*/}
          </div>
        </div>
        <span className="material-symbols-outlined"></span>
      </div>
      {parameterCards}
    </div>
  );
}

function ParameterDataCard({
  currentMapping,
  stream,
  device,
  selectNewSource,
  isPinned,
  pinDefault,
  unpinDefault,
}) {
  const [isHovering, setIsHovering] = useState(false);

  function onLink() {
    if (!isMappedParam) {
      selectNewSource(device, stream);
    } else {
      selectNewSource("Manual");
    }
  }

  function checkIfMapped() {
    return (
      currentMapping?.device === device && currentMapping?.stream === stream
    );
  }

  const isMappedParam = checkIfMapped();

  return (
    <div
      className={clsx(
        "d-flex align-items-stretch p-0 justify-content-between m-0",
        isMappedParam && "bg-primary",
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="p-2 border border-tertiary w-100">
        <p className={clsx("m-0 p-0", isMappedParam && "text-white")}>
          {stream}
        </p>
      </div>
      <div className="d-flex">
        <motion.div
          className="overflow-hidden"
          initial={false}
          animate={{ width: isHovering ? "auto" : 0 }}
          transition={{ duration: 0.1, delay: 0.05, ease: "easeInOut" }}
        >
          <button
            className="btn btn-outline-dark p-2 h-100 align-items-center d-flex"
            onClick={() =>
              isPinned
                ? unpinDefault({ device, stream })
                : pinDefault({ device, stream })
            }
          >
            <span className="material-symbols-outlined m-0 p-0">
              {isPinned ? "keep_off" : "keep"}
            </span>
          </button>
        </motion.div>
        <motion.div
          className="overflow-hidden"
          initial={false}
          animate={{ width: isHovering ? "auto" : 0 }}
          transition={{ duration: 0.1, ease: "easeInOut" }}
        >
          <button
            className="btn btn-outline-primary p-2 h-100 align-items-center d-flex"
            onClick={onLink}
          >
            <span className="material-symbols-outlined m-0 p-0">
              {isMappedParam ? "link_off" : "link"}
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export function MappedParameterTag({ isMapped, currentMapping, onRemove }) {

  return (
    <div
      className={clsx(
        "d-flex justify-content-between align-items-center px-3 py-2",
        isMapped && "bg-primary",
        !isMapped && "border border-white"
      )}
    >
      <div className="d-flex align-items-center">
        <div className="d-flex me-2 p-0 m-0 align-items-center text-white">
          <WaveFormIcon active={isMapped} />
        </div>
        <span className="fw-semibold">
          {currentMapping?.stream || "None"}{" "}
          <span className="fw-normal opacity-75">
            ({currentMapping?.device || "Manual"})
          </span>
        </span>
      </div>
      {isMapped && (
        <button
          className="btn btn-link p-0 ms-2 text-white"
          aria-label="Unmap parameter"
          onClick={onRemove}
        >
          <i className="bi bi-x fs-5"></i>
        </button>
      )}
    </div>
  );
}
