import { useState } from "react";
import clsx from "clsx";
import { DataManualSlider, DataAutoSlider } from "./RangeManager";
import { MappingsManager, MappedParameterTag } from "./MappingsManager";
import { checkNameValidity } from "../utils";

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
  const isMapped = currentMapping !== undefined;

  return (
    <div className="d-flex flex-column h-100">
      {/* Header */}
      <div className="m-3 flex-shrink-0 d-flex justify-content-between align-items-start">
        <div className="d-flex align-items-center">
          <EditableTitle
            parameter={parameter}
            visInfo={visInfo}
            updateParameter={updateParameter}
            deleteParameter={deleteParameter}
          />
        </div>
        <button
          className="btn btn-link p-0"
          aria-label="Close modal"
          onClick={onClose}
        >
          <i className="bi bi-x fs-5"></i>
        </button>
      </div>
      {/* Currently Mapped — always visible, no accordion toggle */}
      <div className="p-3 bg-dark text-light flex-shrink-0">
        <h6>Currently Mapped</h6>
        <MappedParameterTag
          isMapped={isMapped}
          currentMapping={currentMapping}
          onRemove={() => changeSource?.("Manual")}
        />
      </div>

      {/* Accordion for the remaining sections */}
      <div className="accordion rounded-0 flex-grow-1 overflow-hidden d-flex flex-column" id="mappingAccordion">
        <AccordionSection
          id="collapseMapStream"
          title="Map Stream"
          parentId="mappingAccordion"
          bodyClassName="p-0"
        >
          <MappingsManager
            parameter={parameter}
            changeSource={changeSource}
            currentMapping={currentMapping}
          />
        </AccordionSection>

        <AccordionSection
          id="collapseValueControl"
          title="Manage"
          parentId="mappingAccordion"
        >
          {parameter &&
            dataMappings &&
            (isMapped ? (
              <DataAutoSlider
                parameter={parameter.name}
                dataMappings={dataMappings}
              />
            ) : (
              <DataManualSlider parameter={parameter.name} />
            ))}
        </AccordionSection>
      </div>
    </div>
  );
}

function AccordionSection({ id, title, parentId, bodyClassName, children }) {
  return (
    <div className="accordion-item d-flex flex-column overflow-hidden" style={{ minHeight: "40px" }}>
      <button
        className="accordion-button collapsed w-100 rounded-0 bg-body-tertiary h-40 flex-shrink-0"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target={`#${id}`}
        aria-expanded="false"
        aria-controls={id}
        style={{"minHeight": "40px"}}
      >
        {title}
      </button>
      <div
        id={id}
        className="accordion-collapse collapse overflow-y-auto"
        data-bs-parent={`#${parentId}`}
      >
        <div className={clsx("accordion-body", bodyClassName)}>{children}</div>
      </div>
    </div>
  );
}

function EditableTitle({ parameter, visInfo, updateParameter, deleteParameter }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(parameter?.name || "");
  const [error, setError] = useState("");

  const isDeletable = visInfo?.parameters?.length > 1;

  function handleEdit() {
    setNewName(parameter?.name || "");
    setError("");
    setIsEditing(true);
  }

  function handleSave() {
    if (error || !newName.trim()) return;
    if (newName !== parameter.name) {
      updateParameter(parameter, { name: newName });
    }
    setIsEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  }

  function handleChange(e) {
    const val = e.target.value;
    const isValid = checkNameValidity(visInfo, val);
    setNewName(val);
    setError(isValid ? "" : "Invalid name");
  }

  if (!parameter) return null;

  if (isEditing) {
    return (
      <div>
        <div className="d-flex align-items-center">
          <input
            className={clsx("form-control form-control-sm", error && "is-invalid")}
            type="text"
            autoComplete="off"
            value={newName}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
          />
        </div>
        <p className="m-0 p-0 mt-1">Map the parameter to a stream</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center">
        <h5 className="m-0 p-0">{parameter.name}</h5>
        <button
          className="btn btn-link p-0 ms-2"
          aria-label="Edit parameter name"
          onClick={handleEdit}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            edit
          </span>
        </button>
        {isDeletable && (
          <button
            className="btn btn-link p-0 ms-1 text-danger"
            aria-label="Delete parameter"
            onClick={() => deleteParameter(parameter.name)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              delete
            </span>
          </button>
        )}
      </div>
      <p className="m-0 p-0">Map the parameter to a stream</p>
    </div>
  );
}
