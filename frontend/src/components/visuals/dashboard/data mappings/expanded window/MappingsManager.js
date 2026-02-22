import { useState } from "react";
import { motion } from "framer-motion";
import { WaveFormIcon } from "./WaveFormIcon";

export function MappingsManager({ parameter, changeSource, currentMapping }) {
  // Contains the search, pinned parameters, and connected devices for mapping
  return (
    <div className="p-3">
      <div>
        <h6 className="text-body-tertiary mb-1">Search</h6>
        <input
          className="form-control pt-2 pb-2"
          placeholder="Type to look for a device or parameter"
          aria-label="search"
          autoComplete="off"
        ></input>
      </div>
      <div className="mt-3">
        <h6 className="text-body-tertiary mb-1">Pinned</h6>
        <ParameterDataCard />
        <ParameterDataCard />
      </div>
      <div className="mt-3">
        <h6 className="text-body-tertiary mb-1">Connected Devices</h6>
        <ConnectedDeviceAccordion />
      </div>
    </div>
  );
}

function ConnectedDeviceAccordion({
  parameter,
  changeSource,
  currentMapping,
  isPinned,
}) {
  return (
    <div className="d-flex justify-content-between border border-dark p-2 ps-3">
      <div className="d-flex align-items-center">
        <div>
          <h6 className="m-0 p-0">EMOTIV</h6>
          <p className="m-0 p-0 text-body-tertiary">EMOTIV HQ-22</p>
        </div>
      </div>
      <span className="material-symbols-outlined"></span>
    </div>
  );
}

function ParameterDataCard({
  parameter,
  changeSource,
  currentMapping,
  isPinned,
}) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="d-flex align-items-stretch p-0 justify-content-between"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="p-2 border border-tertiary w-100">
        <p className="m-0 p-0">Alpha</p>
      </div>
      <div className="d-flex">
        <motion.div
          className="overflow-hidden"
          initial={false}
          animate={{ width: isHovering ? "auto" : 0 }}
          transition={{ duration: 0.1, ease: "easeInOut" }}
        >
          <button className="btn btn-outline-primary p-2 h-100 align-items-center d-flex">
            <span className="material-symbols-outlined m-0 p-0">link</span>
          </button>
        </motion.div>
        <motion.div
          className="overflow-hidden"
          initial={false}
          animate={{ width: isHovering ? "auto" : 0 }}
          transition={{ duration: 0.1, delay: 0.05, ease: "easeInOut" }}
        >
          <button className="btn btn-outline-dark p-2 h-100 align-items-center d-flex">
            <span className="material-symbols-outlined m-0 p-0">keep</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export function MappedParameterTag({ currentMapping, onRemove }) {
  return (
    <div className="d-flex justify-content-between bg-primary align-items-center px-3 py-2">
      <div className="d-flex align-items-center">
        <div className="d-flex me-2 p-0 m-0 align-items-center text-white">
          <WaveFormIcon active={true} />
        </div>
        <span className="fw-semibold text-white ms-1">
          {currentMapping?.stream || "None"}
        </span>
      </div>
      {onRemove && (
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

