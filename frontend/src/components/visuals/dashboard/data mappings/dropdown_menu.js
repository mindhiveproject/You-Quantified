import React, { useState, useMemo, useEffect, useRef, useId } from "react";
import { useSelector, shallowEqual } from "react-redux";

export function ParameterDropDown({ parameter, dataMappings, changeSource }) {
  const [showModal, setShowModal] = useState(false);
  const savedKeys = useRef({});
  const mapping = dataMappings[parameter.name];
  const isManual = mapping === "Manual";
  const display =
    isManual
      ? { Device: "Mapping", Metric: "Manual" }
      : { Device: mapping[0], Metric: mapping[1] };

  const popoverRef = useRef(null);
  const popoverId = useId();
  const anchorName = `--mapping-${popoverId.replace(/:/g, "")}`;
  const [currentKeys, setCurrentKeys] = useState({});

  const hasUserSelected = useSelector(
    (state) => state.params[parameter.name]?.hasUserSelected ?? false
  );

  const deviceKeys = useSelector(
    (state) => Object.keys(state.dataStream),
    shallowEqual,
  );

  const dataStream = useSelector((state) => state.dataStream);

  // React 18 doesn't wire onToggle for popovers, so listen directly. The
  // modal only mounts while open, which resets the search and autofocuses it.
  useEffect(() => {
    const popover = popoverRef.current;
    const onToggle = (e) => setShowModal(e.newState === "open");
    popover.addEventListener("toggle", onToggle);
    return () => popover.removeEventListener("toggle", onToggle);
  }, []);

  function selectNewSource(sourceName) {
    changeSource(sourceName, parameter.name, true);
    popoverRef.current.hidePopover();
  }

  // Cleanup: reset mapping to Manual on unmount / parameter change
  useEffect(() => {
    return () => {
      changeSource("Manual", parameter.name);
    };
  }, [parameter.name]);

  useEffect(() => {
    for (const dev of deviceKeys) {
      const currKeys = Object.keys(dataStream[dev] ?? {});
      const existing = savedKeys.current[dev] ?? [];
      const newVals = currKeys.filter((k) => !existing.includes(k));
      if (newVals.length > 0 || !savedKeys.current[dev]) {
        savedKeys.current[dev] = [...existing, ...newVals];
      }
    }

    const newKeys = Object.keys(savedKeys.current).map((option) => {
      const hasDefault = [];
      const notHasDefault = [];
      const currData = savedKeys.current[option];

      for (const data of currData) {
        if (data === "timestamp") continue;
        const isDefault = parameter?.suggested?.includes(data) || false;
        isDefault ? hasDefault.push(data) : notHasDefault.push(data);
      }

      return { device: option, data: currData, hasDefault, notHasDefault };
    });

    setCurrentKeys(newKeys);
    changeOnNewSource(newKeys);

  }, [dataStream, deviceKeys, parameter?.suggested]);

  function changeOnNewSource(newKeys) {
    if (hasUserSelected) return;

    for (const option of newKeys) {
      if (option.hasDefault.length > 0) {
        const source = [option.device, option.hasDefault[0]];
        changeSource(source, parameter.name);
        break;
      }
    }
  }

  // The menu is a native popover: it renders in the top layer, so the
  // panel's scroll container can't clip it, and the browser handles toggling
  // and light dismiss. CSS anchor positioning places it under the button.
  return (
    <div>
      <button
        type="button"
        className="mapping-btn"
        popovertarget={popoverId}
        style={{ anchorName }}
      >
        <small>{display.Device}</small>
        <span>{isManual ? "Not mapped" : display.Metric}</span>
      </button>
      <div
        id={popoverId}
        popover="auto"
        ref={popoverRef}
        className="mapping-popover"
        style={{ positionAnchor: anchorName }}
      >
        {showModal && (
          <MappingModal
            display={display}
            updatedClaves={currentKeys}
            selectNewSource={selectNewSource}
          />
        )}
      </div>
    </div>
  );
}

function MappingModal({ display, updatedClaves, selectNewSource }) {
  const [filter, setFilter] = useState("");
  const isManual = display.Device === "Mapping" && display.Metric === "Manual";
  const lowerFilter = filter.toLowerCase();

  const filteredClaves = useMemo(() => {
    if (!lowerFilter) return updatedClaves;
    return updatedClaves
      .filter((option) => !option.device.includes("event_markers"))
      .map((option) => ({
        ...option,
        hasDefault: option.hasDefault.filter(
          (d) =>
            d.toLowerCase().includes(lowerFilter) ||
            option.device.toLowerCase().includes(lowerFilter),
        ),
        notHasDefault: option.notHasDefault.filter(
          (d) =>
            d.toLowerCase().includes(lowerFilter) ||
            option.device.toLowerCase().includes(lowerFilter),
        ),
      }))
      .filter(
        (option) =>
          option.hasDefault.length > 0 || option.notHasDefault.length > 0,
      );
  }, [updatedClaves, lowerFilter]);

  return (
    <div className="d-flex flex-column p-2">
      <input
        type="text"
        className="form-control bg-black ai-ref-input"
        placeholder="Search streams"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        autoFocus
      />
      <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
        {!lowerFilter && (
          <button
            className={`btn btn-sm text-start mt-2 w-100 ${isManual ? "text-primary" : "text-white"}`}
            onClick={() => selectNewSource("Manual")}
          >
            Manual
          </button>
        )}
        {filteredClaves.map((option) => {
          if (!lowerFilter && option.device.includes("event_markers"))
            return null;
          const allMetrics = [...option.hasDefault, ...option.notHasDefault];
          if (allMetrics.length === 0) return null;

          return (
            <div key={option.device} className="mt-2">
              <div
                className="px-2 pb-1 mb-1"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}
              >
                <strong className="text-white">{option.device}</strong>
              </div>
              {option.hasDefault.length > 0 && (
                <small className="px-2 text-white-50 d-block mt-2">
                  Suggested
                </small>
              )}
              {option.hasDefault.map((data) => {
                const isActive =
                  display.Device === option.device && display.Metric === data;
                return (
                  <button
                    key={data}
                    className={`btn btn-sm text-start w-100 ${isActive ? "text-primary" : "text-white"}`}
                    onClick={() => selectNewSource([option.device, data])}
                  >
                    {data}
                  </button>
                );
              })}
              {option.hasDefault.length > 0 &&
                option.notHasDefault.length > 0 && (
                  <small className="px-2 text-white-50 d-block mt-2">
                    All Streams
                  </small>
                )}
              {option.notHasDefault.map((data) => {
                const isActive =
                  display.Device === option.device && display.Metric === data;
                return (
                  <button
                    key={data}
                    className={`btn btn-sm text-start w-100 ${isActive ? "text-primary" : "text-white"}`}
                    onClick={() => selectNewSource([option.device, data])}
                  >
                    {data}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
