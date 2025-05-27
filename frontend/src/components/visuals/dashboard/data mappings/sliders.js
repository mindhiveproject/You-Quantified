import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { selectParamValues } from "../../utility/selectors";

// Change the z-index of the dropdown
// Change the name of the "Manual"/"Range" Slider


function normalizeValue(value, min, max) {
  return (value - min) / (max - min);
}

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

  const sliderToolTip = (
    <Popover id="popover-basic" className="rounded-0 w-25">
      <Popover.Header as="h5" className="rounded-0">
        Value
      </Popover.Header>
      <Popover.Body>
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
      </Popover.Body>
    </Popover>
  );
  return (
    <div className="d-flex">
      <div className="input-group me-1">
        <form className="form-floating" autoComplete="off">
          <input
            type="text"
            className="form-control w-75px"
            id="valorManualInput"
            value={Math.round(valor * 1000) / 1000 || 0}
            onChange={handleFormChange}
          />
          <label htmlFor="valorManualInput">Value</label>
        </form>
      </div>
      <div className="align-self-center">
        <OverlayTrigger
          trigger="click"
          placement="left"
          rootClose={true}
          overlay={sliderToolTip}
        >
          <button className={"btn btn-outline-dark pt-3 pb-3"}>Slider</button>
        </OverlayTrigger>
      </div>
    </div>
  );
}

export function DataAutoSlider({ dataMappings, parameter }) {
  // This function is the list item when it is connected to a data stream.
  // It contains the logic to handle changing into manual mode, setting auto-range, and setting the value of the parameter, to the stream value.

  const stream = useSelector((state) => state.dataStream);
  const select = dataMappings[parameter];

  const lastValidSource = useRef(undefined);

  const currentSource = stream?.[select[0]]?.[select[1]];
  
  useEffect(() => {
    if (currentSource !== undefined) {
      lastValidSource.current = currentSource;
    }
  }, [currentSource]);
  
  const source = currentSource !== undefined ? currentSource : lastValidSource.current ?? 0;

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
  const AUTO_SET_DELAY = 3000; // Delay for autoset in milliseconds

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
    <Popover id="popover-basic" className="rounded-0">
      <Popover.Header as="h5" className="rounded-0">
        Range
      </Popover.Header>
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
    <div className="d-flex">
      <div className="input-group me-1">
        <form className="form-floating" autoComplete="off">
          <input
            type="text"
            className="form-control w-75px"
            id="valueAutoInput"
            value={Math.round(source * 1000) / 1000}
            disabled
          ></input>
          <label htmlFor="valueAutoInput">Value</label>
        </form>
      </div>
      <div className="align-self-center">
        <OverlayTrigger
          trigger="click"
          placement="right"
          rootClose={true}
          overlay={rangeToolTip}
        >
          <button className={"btn btn-outline-dark pt-3 pb-3"}>Range</button>
        </OverlayTrigger>
      </div>
    </div>
  );
}
