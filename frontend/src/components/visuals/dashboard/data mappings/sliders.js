import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { selectParamValues } from "../../utility/selectors";
import { normalizeValue } from "../../../../store/utility_functions";

export function DataManualSlider({ parameter }) {
  // This function is the list item when it is connected not connected to a datastream
  // It contains the logic to handle changing into manual mode, setting auto-range, and setting the value of the parameter, to the stream value.

  const params = useSelector(selectParamValues);
  const valor = params?.[parameter] ?? 0;
  const dispatch = useDispatch();

  // Defines min and max of slider
  const min = 0;
  const max = 1;

  // Handles updating the values of the slider
  // This is what must be replaced with the action
  const handleInputChange = (e) => {
    dispatch({
      type: "params/update",
      payload: {
        name: parameter,
        value: e.target.value,
      },
    });
  };

  // Handles changing the values of the input
  const handleFormChange = (e) => {
    e.preventDefault();
    let formValue = e.target.value;
    if (formValue > max) {
      formValue = max;
    } else if (formValue < min) {
      formValue = min;
    }
    dispatch({
      type: "params/update",
      payload: {
        name: parameter,
        value: formValue,
      },
    });
    e.target.value = formValue;
  };

  return (
    <div className="row justify-content-start">
      <div className="col-xxl-5 col-xl-4 col-lg-5">
        <div className="input-group">
          <form className="form-floating" autoComplete="off">
            <input
              type="text"
              className="form-control"
              id="valorManualInput"
              value={Math.round(valor * 1000) / 1000 || 0}
              onChange={handleFormChange}
            />
            <label htmlFor="valorManualInput">Value</label>
          </form>
        </div>
      </div>
      <div className="col-xxl-7 col-xl-8 col-lg-7 align-self-center">
        <input
          type="range"
          className="form-range align-self-center"
          onChange={handleInputChange}
          id="customRange1"
          autoComplete="off"
          value={valor || 0}
          step={0.01}
          min={min}
          max={max}
        />
      </div>
    </div>
  );
}

export function DataAutoSlider({ dataMappings, parameter }) {
  // This function is the list item when it is connected to a data stream.
  // It contains the logic to handle changing into manual mode, setting auto-range, and setting the value of the parameter, to the stream value.

  const stream = useSelector((state) => state.dataStream);
  // Defines which dataSource is selected
  const select = dataMappings[parameter];

  // Logic that fetches the data from the device stream based on your selection in the dropdown
  const source = stream?.[select[0]]?.[select[1]] ?? 0;

  const range = useSelector((state) => state.params[parameter].range);
  const dispatch = useDispatch();

  // Min & Max values.
  const [min, setMin] = useState(range[0]); // Actual values used by the mapping
  const [max, setMax] = useState(range[1]);
  const [formMin, setFormMin] = useState(range[0]); // Values to be shown when the user edits the form
  const [formMax, setFormMax] = useState(range[1]);

  // This function is one of the most imoprtant functions since it updates the parameters
  useEffect(() => {
    dispatch({
      type: "params/update",
      payload: {
        name: parameter,
        value: normalizeValue(source, min, max),
      },
    });
  }, [source]);

  function updateRange(
    value,
    setFormValue,
    limit,
    comparator,
    setLimit,
    dispatch
  ) {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue === limit) {
      setFormValue(limit + (comparator === "min" ? 1 : -1));
    } else {
      setLimit(parsedValue);
      dispatch({
        type: "params/updateRange",
        payload: {
          name: parameter,
          range: [min, max],
        },
      });
    }
  }

  function looseFocusMin() {
    updateRange(formMin, setFormMin, max, "min", setMin, dispatch);
  }

  function looseFocusMax() {
    updateRange(formMax, setFormMax, min, "max", setMax, dispatch);
  }

  const [disabled, setDisabled] = useState(false); // Defines if items are disabled (ex, when autoranging)
  const [buffer, _setBuffer] = useState([false]); // Data buffer for autorange
  const AUTO_SET_DELAY = 2000; // Delay for autoset in milliseconds

  const bufferRef = useRef(buffer);
  function setBuffer(val) {
    bufferRef.current = val;
    _setBuffer(val);
  }
  
  // Gets called once autorange starts
  async function handleAutoSet() {
    setBuffer([]);
    setDisabled(true);

    setTimeout(() => {
      const bufferMin = Math.min(...bufferRef.current);
      setMin(bufferMin);
      setFormMin(bufferMin);

      const bufferMax = Math.max(...bufferRef.current);
      setMax(bufferMax);
      setFormMax(bufferMax);

      setBuffer([false]);
      setDisabled(false);

      dispatch({
        type: "params/updateRange",
        payload: {
          name: parameter,
          range: [bufferMin, bufferMax],
        },
      });
    }, AUTO_SET_DELAY);
  }

  useEffect(() => {
    // Function that fills the buffer once you start the autorange
    if (typeof buffer[0] !== "boolean") {
      setBuffer([...buffer, source]);
    }
  }, [source]);

  /// Functions to change the form value whenever a user modifies the field
  const formMinChange = useCallback((e) => {
    e.preventDefault();
    setFormMin(e.target.value);
  }, []);
  const formMaxChange = useCallback((e) => {
    e.preventDefault();
    setFormMax(e.target.value);
  }, []);

  const rangeToolTip = (
    <Popover id="popover-basic">
      <Popover.Header as="h5">Range</Popover.Header>
      <Popover.Body>
        <div className="input-group">
          <div className="form-floating">
            <input
              type="text"
              className="form-control"
              autoComplete="off"
              inputMode="decimal"
              id="max"
              value={formMin}
              onBlur={looseFocusMin}
              readOnly={disabled}
              disabled={disabled}
              onChange={formMinChange}
            />
            <label htmlFor="max">Min</label>
          </div>
          <div className="form-floating">
            <input
              type="text"
              autoComplete="off"
              className="form-control"
              id="max"
              value={formMax}
              onBlur={looseFocusMax}
              readOnly={disabled}
              disabled={disabled}
              onChange={formMaxChange}
            />
            <label htmlFor="max">Max</label>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleAutoSet}
            disabled={disabled}
          >
            Auto
          </button>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <div className="row justify-content-start">
      <div className="col-4">
        <div className="input-group">
          <form className="form-floating" autoComplete="off">
            <input
              type="text"
              className="form-control"
              id="valueAutoInput"
              value={Math.round(source * 1000) / 1000}
              disabled
            ></input>
            <label htmlFor="valueAutoInput">Value</label>
          </form>
        </div>
      </div>
      <div className="col-6 align-self-center">
        <OverlayTrigger
          trigger="click"
          placement="right"
          rootClose={true}
          overlay={rangeToolTip}
        >
          <button className={"btn btn-sm btn-primary"}>Range</button>
        </OverlayTrigger>
      </div>
    </div>
  );
}
