import React, { useState, useEffect, useRef } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { useOutsideAlerter } from "../../../../utility/outsideClickDetection";
import { useSelector, useDispatch } from "react-redux";
import { DataManualSlider, DataAutoSlider } from "./sliders";
import { ParameterDropDown } from "./dropdown_menu";
import { selectDataMappings, getDataStreamKeys } from "../../utility/selectors";

// Fix the problem where data doesn't get auto mapped when you enter
// Change the buffer length in the auto slider

function ParameterManager({ parameter, dataMappings }) {
  // Manages if parameters are managed manually or automatically
  const manual = dataMappings[parameter.name] === "Manual";

  return (
    <li className="list-group-item mb-2 container" key={parameter.name}>
      {manual ? (
        <DataManualSlider parameter={parameter.name} />
      ) : (
        <DataAutoSlider
          parameter={parameter.name}
          dataMappings={dataMappings}
        />
      )}
    </li>
  );
}

function DataCard({
  visParameter,
  dataMappings,
  custom,
  deleteParameter,
  visInfo,
  indx,
  claves,
}) {
  // Represents an individual parameter
  const [expanded, setExpanded] = useState(false); // Used for styling, checks to see if accordion is collapsed or not

  const dispatch = useDispatch();

  function changeSource(sourceName, paramName) {
    dispatch({
      type: "params/updateMappings",
      payload: {
        name: paramName,
        mapping: sourceName,
      },
    });
  }

  // Rewrite the delte parameter logic to avoid deletion when only one is left

  return (
    <div className="list-group-item" key={visParameter.name}>
      <div
        className="d-flex align-items-center pt-1 pb-1"
        key={visParameter.name}
      >
        {custom && visInfo?.parameters?.length > 1 && (
          <button
            className="btn btn-link text-center p-0 me-2 ms-n1 delete-btn"
            onClick={() => {
              deleteParameter(visParameter.name);
            }}
          >
            <i className="h5 p-0 bi bi-dash text-danger"></i>
          </button>
        )}
        <div>{visParameter.name}</div>
        <div className="btn-map-transition closed col align-items-right">
          <div className="d-flex justify-content-end align-items-center text-center flex-wrap">
            <div className="mt-1 mb-1">
              <ParameterDropDown
                claves={claves}
                changeSource={changeSource}
                parameter={visParameter}
                dataMappings={dataMappings}
              />
            </div>
          </div>
        </div>
        <button
          className={
            expanded
              ? "btn btn-link fa-arrow-down open"
              : "btn btn-link fa-arrow-down close"
          }
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={"#" + indx}
          aria-expanded="false"
          aria-controls="collapseTwo"
          onClick={() => setExpanded(!expanded)}
        >
          <i className="bi bi-three-dots-vertical"></i>
        </button>
      </div>
      <div id={indx} className="collapse">
        <div>
          <ul className="list-group list-group-flush">
            <ParameterManager
              claves={claves}
              parameter={visParameter}
              dataMappings={dataMappings}
            />
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function DataManagement({ setVisInfo, visInfo, custom }) {
  // Contains the entire accordion with all vis properties based on the current visInfo

  const [newParamName, setNewParamName] = useState("");
  const [valid, setValid] = useState(true);
  const [show, setShow] = useState(false);

  const overlayRef = useRef(null);

  const dataMappings = useSelector(selectDataMappings);
  const claves = useSelector(getDataStreamKeys);

  const dataCards = visInfo?.parameters?.map((parameter, indx) => (
    <DataCard
      visParameter={parameter}
      key={parameter.name}
      dataMappings={dataMappings}
      deleteParameter={deleteParameter}
      indx={indx}
      visInfo={visInfo}
      custom={custom}
      claves={claves}
    />
  ));

  const dispatch = useDispatch();

  function deleteParameter(paramName) {
    // Retrieve data from local storage and assign it to a new object

    const newMeta = JSON.parse(JSON.stringify(visInfo));
    newMeta.parameters = newMeta.parameters.filter(
      ({ name }) => name != paramName
    );

    setVisInfo(newMeta.parameters);
  }

  function newParameter() {
    if (!checkValidity()) return;

    dispatch({
      type: "params/create",
      payload: {
        name: newParamName,
      },
    });

    setVisInfo([...visInfo.parameters, { name: newParamName, suggested: [] }]);
    setShow(false);
  }

  function checkValidity() {
    const blacklistedCharacters = ["-", "#", "/", "(", ")", "="];
    const currentProperties = visInfo.parameters.map(({ name }) => name);

    if (currentProperties.includes(newParamName)) {
      setValid(false);
      return false;
    } else if (newParamName == "") {
      setValid(false);
      return false;
    } else if (
      blacklistedCharacters.some((char) => newParamName.includes(char))
    ) {
      setValid(false);
      return false;
    } else if (newParamName.length > 20) {
      setValid(false);
      return false;
    } else {
      setValid(true);
      return true;
    }
  }

  useOutsideAlerter(overlayRef, setShow);

  if (Object.keys(dataMappings).length === 0) return <div>Loading...</div>;

  const newParamToolTip = (
    <Popover id="popover-basic">
      <Popover.Header as="h5">Create a new parameter</Popover.Header>
      <Popover.Body>
        <div className="input-group" ref={overlayRef}>
          <form className="form-floating" autoComplete={false}>
            <input
              type="text"
              className={`form-control ${valid ? "" : "is-invalid"}`}
              autoComplete={false}
              id="max"
              value={newParamName}
              onChange={(e) => {
                e.preventDefault();
                setNewParamName(e.target.value);
                checkValidity(e.target.value);
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
    <div className="mb-5">
      <div className="list-group rounded-0">{dataCards}</div>
      {custom ? (
        <div className="d-flex justify-content-center text-center">
          <OverlayTrigger
            trigger="click"
            placement="top"
            rootClose
            overlay={newParamToolTip}
            show={show}
          >
            <button
              className="btn btn-link"
              type="button"
              aria-expanded="false"
              onClick={() => setShow(!show)}
            >
              <i className="bi bi-plus-circle h5"></i>
            </button>
          </OverlayTrigger>
        </div>
      ) : null}
    </div>
  );
}
