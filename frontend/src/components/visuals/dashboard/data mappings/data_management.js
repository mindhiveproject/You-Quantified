import React, { useState, useEffect, useRef } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { useOutsideAlerter } from "../../../../utility/outsideClickDetection";
import { useSelector, useDispatch } from "react-redux";
import { DataManualSlider, DataAutoSlider } from "./sliders";
import { ParameterDropDown } from "./dropdown_menu";
import { selectDataMappings, getDataStreamKeys } from "../../utility/selectors";
import { validateCommaSeparatedList } from "../../menu/new";

// Fix the problem where data doesn't get auto mapped when you enter
// Change the buffer length in the auto slider

function ParameterManager({ parameter, dataMappings }) {
  // Manages if parameters are managed manually or automatically
  const manual = dataMappings[parameter.name] === "Manual";

  return (
    <div key={parameter.name}>
      {manual ? (
        <DataManualSlider parameter={parameter.name} />
      ) : (
        <DataAutoSlider
          parameter={parameter.name}
          dataMappings={dataMappings}
        />
      )}
    </div>
  );
}

const STATUS_TEXT = {
  streaming: "Streaming",
  disconnected: "Not connected",
  unmapped: "Not mapped",
};

function DataCard({
  visParameter,
  dataMappings,
  custom,
  deleteParameter,
  visInfo,
  updateParameter,
}) {
  // Represents an individual parameter

  const dispatch = useDispatch();

  const [showEditOverlay, setShowEditOverlay] = useState(false);

  const mapping = dataMappings[visParameter.name];
  const isMapped = mapping !== "Manual";
  // A device that dropped keeps its last values in the stream, so its
  // connection has to be checked too.
  const isStreaming = useSelector(
    (state) =>
      isMapped &&
      state.deviceMeta[mapping[0]]?.connected &&
      state.dataStream?.[mapping[0]]?.[mapping[1]] !== undefined,
  );
  const status = !isMapped ? "unmapped" : isStreaming ? "streaming" : "disconnected";

  function changeSource(sourceName, paramName, userSelected = false) {
    dispatch({
      type: "params/updateMappings",
      payload: {
        name: paramName,
        mapping: sourceName,
        userSelected,
      },
    });
  }

  const editToolTip = (
    <Popover id="popover-basic" className="rounded-0 custom-popover-width w-25">
      <Popover.Header as="h5" className="rounded-0">
        Edit parameter
      </Popover.Header>
      <Popover.Body>
        <EditParameterModal
          oldInfo={visParameter}
          visInfo={visInfo}
          updateParameter={updateParameter}
          deleteParameter={deleteParameter}
          setShowEditOverlay={setShowEditOverlay}
        />
      </Popover.Body>
    </Popover>
  );

  return (
    <div className={`mapping-card ${status}`}>
      <div className="d-flex align-items-center gap-2 text-truncate">
        {isStreaming ? (
          <span className="material-symbols-outlined">graphic_eq</span>
        ) : (
          <span className="svg-icon icon-eq-inactive" />
        )}
        <div className="text-truncate">
          <small>{STATUS_TEXT[status]}</small>
          {custom ? (
            <OverlayTrigger
              trigger="click"
              placement="right"
              rootClose={true}
              overlay={editToolTip}
              show={showEditOverlay}
              onToggle={(nextShow) => setShowEditOverlay(nextShow)}
            >
              <button className="name" title="Edit parameter">
                {visParameter.name}
              </button>
            </OverlayTrigger>
          ) : (
            <span className="name">{visParameter.name}</span>
          )}
        </div>
      </div>
      <div className="d-flex flex-shrink-0">
        <ParameterDropDown
          changeSource={changeSource}
          parameter={visParameter}
          dataMappings={dataMappings}
        />
        <ParameterManager parameter={visParameter} dataMappings={dataMappings} />
      </div>
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
  const [newSuggested, setNewSuggested] = useState((oldInfo?.suggested || [] ).join(","));
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
    updateParameter(oldInfo, { name: newName, suggested: newSuggested.split(/,\s*|,/) });
    setShowEditOverlay(false);
  }


  return (
    <div>
      <form onSubmit={submitChanges}>
        <div className="mb-3">
          <label htmlFor="name">Name</label>
          <input
            className={`form-control ${newNameError ? "is-invalid" : ""}`}
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
            className={`form-control ${newSuggestedError ? "is-invalid" : ""}`}
            type="text"
            autoComplete="off"
            placeholder="i.e. Alpha, Beta, eye_blink_left, ..."
            id="suggested"
            defaultValue={(oldInfo?.suggested || [] ).join(",")}
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

export default function DataManagement({ changeParameters, visInfo, custom }) {
  // Contains every parameter's card, based on the current visInfo

  const dataMappings = useSelector(selectDataMappings);

  function deleteParameter(paramName) {
    // Retrieve data from local storage and assign it to a new object

    const newMeta = JSON.parse(JSON.stringify(visInfo));
    newMeta.parameters = newMeta.parameters.filter(
      ({ name }) => name != paramName
    );

    changeParameters(newMeta.parameters);
  }

  function updateParameter(oldInfo, newInfo) {
    const newMeta = JSON.parse(JSON.stringify(visInfo));
    const oldParam = newMeta.parameters.find(
      ({ name }) => name === oldInfo.name
    );
    const updatedParam = { ...oldParam, ...newInfo };
    newMeta.parameters = newMeta.parameters.map((param) =>
      param.name === oldInfo.name ? updatedParam : param
    );
    changeParameters(newMeta.parameters);
  }

  if (Object.keys(dataMappings).length === 0) return <div>Loading...</div>;

  return (
    <div className="d-flex flex-column gap-2 mb-5">
      {visInfo?.parameters?.map((parameter) => (
        <DataCard
          visParameter={parameter}
          key={parameter.name}
          dataMappings={dataMappings}
          deleteParameter={deleteParameter}
          visInfo={visInfo}
          custom={custom}
          updateParameter={updateParameter}
        />
      ))}
    </div>
  );
}

export function NewParameterButton({ visInfo, changeParameters }) {
  const [newParamName, setNewParamName] = useState("");
  const [valid, setValid] = useState(true);
  const [show, setShow] = useState(false);

  const overlayRef = useRef(null);

  function newParameter() {
    const isParamValid = checkNameValidity(visInfo, newParamName);

    setValid(isParamValid);
    if (!isParamValid) return;

    changeParameters([
      ...visInfo.parameters,
      { name: newParamName, suggested: [] },
    ]);
    setShow(false);
  }

  useOutsideAlerter(overlayRef, setShow);

  const newParamToolTip = (
    <Popover id="popover-basic" className="rounded-0">
      <Popover.Header as="h5" className="rounded-0">
        Create a new parameter
      </Popover.Header>
      <Popover.Body>
        <div className="input-group" ref={overlayRef}>
          <form className="form-floating" autoComplete="off">
            <input
              type="text"
              className={`form-control ${valid ? "" : "is-invalid"}`}
              autoComplete="off"
              id="max"
              value={newParamName}
              onChange={(e) => {
                e.preventDefault();
                setNewParamName(e.target.value);
                setValid(checkNameValidity(visInfo, e.target.value));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  newParameter();
                }
              }}
            />
            <label htmlFor="max">Name</label>
          </form>
          <button
            className="btn btn-primary"
            onClick={newParameter}
            disabled={!valid}
          >
            Create
          </button>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom"
      rootClose
      overlay={newParamToolTip}
      show={show}
    >
      <button
        className="btn btn-outline-dark btn-48"
        type="button"
        onClick={() => setShow(!show)}
      >
        <span className="material-symbols-outlined">add</span>
        Add a new parameter
      </button>
    </OverlayTrigger>
  );
}

function checkNameValidity(visInfo, newParamName) {
  const blacklistedCharacters = ["-", "#", "/", "(", ")", "="];
  const currentProperties = visInfo.parameters.map(({ name }) => name);

  if (currentProperties.includes(newParamName)) {
    return false;
  } else if (newParamName == "") {
    return false;
  } else if (
    blacklistedCharacters.some((char) => newParamName.includes(char))
  ) {
    return false;
  } else if (newParamName.length > 20) {
    return false;
  } else {
    return true;
  }
}
