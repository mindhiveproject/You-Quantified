import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";

function NestedDropDown({
  option,
  dataStream,
  parameter,
  display,
  selectNewSource,
}) {
  let { visID } = useParams();

  function checkDefault(data) {
    return parameter?.suggested?.includes(data) || false;
  }

  const { hasDefault, notHasDefault } = dataStream.reduce(
    (acc, element) => {
      const isDefault = checkDefault(element);
      acc[isDefault ? "hasDefault" : "notHasDefault"].push(element);
      return acc;
    },
    { hasDefault: [], notHasDefault: [] }
  );

  return (
    <ul className="submenu dropdown-menu" id="nested-dropdown">
      {hasDefault.length > 0 && (
        <small className="dropdown-item disabled">Suggested Mappings</small>
      )}
      {hasDefault.map((data) => (
        <li key={data}>
          <button
            className={`dropdown-item ${data === display && "text-primary"}`}
            onClick={() => selectNewSource([option.device, data])}
          >
            {data}
          </button>
        </li>
      ))}
      {hasDefault.length > 0 && (
        <small className="dropdown-item disabled">All Streams</small>
      )}
      {notHasDefault.map((data) => (
        <li key={data}>
          <button
            className={`dropdown-item ${data === display && "text-primary"}`}
            onClick={() => selectNewSource([option.device, data])}
          >
            {data}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ParameterDropDown({ claves, parameter, dataMappings }) {

  const [show, setShow] = useState(true);

  // Display text on the card. Upon creation, it checks the status
  const [display, setDisplay] = useState(() => {
    let disp = dataMappings[parameter.name];
    if (disp === "Manual") disp = "Manual";
    else disp = disp[1];
    return disp;
  });

  const dispatch = useDispatch();

  // Changes the data source
  function selectNewSource(sourceName) {
    dispatch({
      type: "params/updateMappings",
      payload: {
        name: parameter.name,
        mapping: sourceName,
      },
    });

    // Changes the display text when the data source/dataMappings change
    let disp = sourceName;

    if (sourceName === "Manual") setDisplay("Manual");
    else setDisplay(disp[1]);
    setShow(false);
  }

  // Changes the color of the button as dataMappings changes
  const dispColor = useMemo(
    () =>
      display.includes("Manual")
        ? "btn btn-mapping ms-2 rounded-0"
        : "btn btn-mapping ms-2 rounded-0",
    [dataMappings]
  );

  return (
    <div>
      <button
        type="button"
        className={dispColor}
        data-bs-toggle="dropdown"
        data-bs-auto-close="true"
        aria-expanded="false"
        onMouseEnter={() => setShow(true)}
      >
        Mapping - {display}
      </button>
      <ul className={`dropdown-menu ${show ? "visible" : "hidden"}`}>
        <li>
          <button
            className={`dropdown-item ${
              display === "Manual" && "text-primary"
            }`}
            onClick={() => selectNewSource("Manual")}
          >
            Manual
          </button>
        </li>
        {claves.map((option) => {
          return (
            <li key={option.device}>
              <button
                type="button"
                className="dropdown-item"
                data-bs-toggle="dropdown-submenu"
                data-bs-target="#nested-dropdown"
                aria-expanded="false"
              >
                {option.device}
              </button>
              <NestedDropDown
                option={option}
                dataStream={option.data}
                parameter={parameter}
                display={display}
                selectNewSource={selectNewSource}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
