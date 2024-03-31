import React, { useState, useEffect, useRef } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { useOutsideAlerter } from "../../../utility/outsideClickDetection";
import { useSelector, useDispatch } from "react-redux";
import { DataManualSlider, DataAutoSlider } from "./sliders";
import { ParameterDropDown } from "./dropdown_menu";
import { selectDataMappings, getDataStreamKeys } from "../selectors";

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
  setVisInfo,
  visInfo,
  claves,
}) {
  // Represents an individual parameter
  const [expanded, setExpanded] = useState(false); // Used for styling, checks to see if accordion is collapsed or not

  const dispatch = useDispatch();

  function changeSource(sourceName, paramName, noMap) {
    dispatch({
      type: "params/updateMappings",
      payload: {
        name: paramName,
        mapping: sourceName,
      },
    });

    if (custom && !noMap) {
      const newMeta = JSON.parse(JSON.stringify(visInfo));
      const paramIndx = newMeta.parameters.findIndex(
        ({ name }) => name == paramName
      );

      newMeta.parameters[paramIndx] = {
        name: paramName,
        suggested: [sourceName],
      };
      setVisInfo[newMeta.parameters];
    }
  }

  return (
    <div className="list-group-item" key={visParameter.name}>
      <div
        className="d-flex align-items-center pt-1 pb-1"
        key={visParameter.name}
      >
        {custom && (
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
          data-bs-target={"#" + visParameter.name.replace(" ", "_")}
          aria-expanded="false"
          aria-controls="collapseTwo"
          onClick={() => setExpanded(!expanded)}
        >
          <i className="bi bi-three-dots-vertical"></i>
        </button>
      </div>
      <div id={visParameter.name.replace(" ", "_")} className="collapse">
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
  console.log("Data Mappings");
  console.log(dataMappings);
  const claves = useSelector(getDataStreamKeys);
  console.log("Claves");
  console.log(claves);

  const dataCards = visInfo?.parameters?.map((parameter) => (
    <DataCard
      visParameter={parameter}
      key={parameter.name}
      dataMappings={dataMappings}
      deleteParameter={deleteParameter}
      setVisInfo={setVisInfo}
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
    const newText = newParamName;
    //const utf8Data = newText.replace(/[^\x20-\x7E]+/g, '');
    const utf8Data = newText;

    const currentProperties = visInfo.parameters.map(({ name }) => name);
    if (currentProperties.includes(utf8Data)) {
      setValid(false);
      return;
    }

    if (utf8Data == "") {
      setValid(false);
      return;
    }

    dispatch({
      type: "params/create",
      payload: {
        name: utf8Data,
      },
    });

    setVisInfo([...visInfo.parameters, { name: utf8Data, suggested: [] }]);
    setShow(false);
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
                setValid(true);
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
          <button className="btn btn-primary" onClick={newParameter}>
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
