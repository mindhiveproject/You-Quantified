import { useState, useRef } from "react";
import { OverlayTrigger } from "react-bootstrap";
import { Popover } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useSelector, useDispatch } from "react-redux";
import { DataManualSlider, DataAutoSlider } from "./RangeManager";
import { MappingsManager, MappedParameterTag } from "./MappingsManager";
import { checkNameValidity, validateCommaSeparatedList } from "../utils";

export function MappingWindow({
  parameter,
  changeSource,
  currentMapping,
  visInfo,
  updateParameter,
  deleteParameter,
  dataMappings,
  onClose,
}) {
  const [showEditOverlay, setShowEditOverlay] = useState(false);
  const isMapped = currentMapping?.device !== "None" && currentMapping?.device !== undefined;

  return (
    <div>
      {/* Header */}
      <div className="m-3 d-flex justify-content-between align-items-start">
        <div>
          <h5 className="m-0 p-0">{parameter?.name}</h5>
          <p className="m-0 p-0">Map the parameter to a stream</p>
        </div>
        <button className="btn btn-link p-0" aria-label="Close modal" onClick={onClose}>
          <i className="bi bi-x fs-5"></i>
        </button>
      </div>

      {/* Currently Mapped */}
      <div className="bg-dark text-light">
        <div className="p-3">
          <h6>Currently Mapped</h6>
          <MappedParameterTag
            currentMapping={currentMapping}
            onRemove={() => changeSource?.("Manual")}
          />
        </div>
      </div>

      {/* Sliders / Range Editor */}
      <div className="p-3">
        <h6 className="text-body-tertiary mb-2">Value Control</h6>
        {parameter && dataMappings && (
          isMapped ? (
            <DataAutoSlider
              parameter={parameter.name}
              dataMappings={dataMappings}
            />
          ) : (
            <DataManualSlider parameter={parameter.name} />
          )
        )}
      </div>

      {/* Edit Parameter */}
      <div className="p-3">
        <h6 className="text-body-tertiary mb-2">Edit Parameter</h6>
        {parameter && visInfo && (
          <EditParameterModal
            oldInfo={parameter}
            visInfo={visInfo}
            updateParameter={updateParameter}
            deleteParameter={deleteParameter}
            setShowEditOverlay={setShowEditOverlay}
          />
        )}
      </div>

      {/* Mappings Manager (search, pinned, connected devices) */}
      <MappingsManager
        parameter={parameter}
        changeSource={changeSource}
        currentMapping={currentMapping}
      />
    </div>
  );
}

function EditParameterModal({
  oldInfo,
  visInfo,
  updateParameter,
  deleteParameter,
  setShowEditOverlay,
}) {
  const [newName, setNewName] = useState(oldInfo.name);
  const [newNameError, setNewNameError] = useState(false);
  const [newSuggested, setNewSuggested] = useState(
    (oldInfo?.suggested || []).join(","),
  );
  const [newSuggestedError, setNewSuggestedError] = useState(false);

  const isDeletable = visInfo.parameters.length > 1;

  function validateNewName(e) {
    const val = e.target.value;
    const isValid = checkNameValidity(visInfo, val);
    if (isValid) {
      setNewName(e.target.value);
      setNewNameError("");
    } else {
      setNewNameError("Invalid length!");
    }
  }

  function validateSuggested(e) {
    const isValid = validateCommaSeparatedList(e.target.value);
    // Make suggested a list instead of just a string
    if (isValid) {
      setNewSuggested(e.target.value);
      setNewSuggestedError("");
    } else {
      setNewSuggestedError("Invalid list!");
    }
  }

  function submitChanges(e) {
    e.preventDefault();
    if (newNameError || newSuggestedError) return;
    updateParameter(oldInfo, {
      name: newName,
      suggested: newSuggested.split(/,\s*|,/),
    });
    setShowEditOverlay(false);
  }

  return (
    <div>
      <form onSubmit={submitChanges}>
        <div className="mb-3">
          <label htmlFor="name">Name</label>
          <input
            className={clsx("form-control", newNameError && "is-invalid")}
            type="text"
            autoComplete="off"
            placeholder="Name"
            id="name"
            defaultValue={oldInfo.name}
            onChange={validateNewName}
          ></input>
        </div>
        <div className="mb-4">
          <label htmlFor="suggested">Suggested mappings</label>
          <input
            className={clsx("form-control", newSuggestedError && "is-invalid")}
            type="text"
            autoComplete="off"
            placeholder="i.e. Alpha, Beta, eye_blink_left, ..."
            id="suggested"
            defaultValue={(oldInfo?.suggested || []).join(",")}
            onChange={validateSuggested}
          ></input>
        </div>
        <div className="d-flex justify-content-between">
          <button
            className="btn btn-outline-danger"
            disabled={!isDeletable}
            onClick={() => deleteParameter(oldInfo.name)}
            type="button"
          >
            Delete
          </button>
          <button className="btn btn-primary" type="submit">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

