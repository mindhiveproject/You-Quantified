import React, { useEffect, useState, useRef } from "react";

import Overlay from "react-bootstrap/Overlay";
import Tooltip from "react-bootstrap/Tooltip";
import { useSelector } from "react-redux";
import devicesRaw from "../../../metadata/devices.json";
import { selectDevices } from "../main";

function PopupItem({ item }) {
  const [show, setShow] = useState(false);
  const target = useRef(null);

  return (
    <div
      className="col border border-primary-subtle mt-2 me-n0-1"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      key={item.name}
    >
      <div
        className="d-flex m-2 justify-content-between align-items-start"
        key={item.name}
      >
        <div ref={target}>{item.name} </div>
        <Overlay
          className="custom-tooltip"
          target={target.current}
          show={`${show}`}
          placement="bottom"
        >
          {(props) => (
            <Tooltip
              id="overlay-example"
              className="custom-tooltip"
              onMouseEnter={() => setShow(true)}
              onMouseLeave={() => setShow(!show)}
              {...props}
            >
              <p>{item.description}</p>
              <small>Source: {item.source}</small>
              <br />
              <small>Type: {item.type}</small>
            </Tooltip>
          )}
        </Overlay>
      </div>
    </div>
  );
}

function DataCards({ source, groupData }) {
  const dataArray = [];

  const datatoAppend = devicesRaw
    .find((x) => x.device === source)
    .data.map((obj) => {
      obj["source"] = source;
      return obj;
    });

  dataArray.push(...datatoAppend);

  // Group data by type if it's defined
  if (groupData) {
    const groupedData = dataArray.reduce((acc, curr) => {
      (acc[curr["type"]] = acc[curr["type"]] || []).push(curr);
      return acc;
    }, {});

    const groupDataCards = Object.keys(groupedData).map((group) => {
      return (
        <div key={group}>
          <h6 className="g-0 mb-2">{group}</h6>
          <div className="row row-cols-auto mb-3 ms-1">
            {groupedData[group].map((item) => {
              return <PopupItem item={item} key={item.name} />;
            })}
          </div>
        </div>
      );
    });
    return <div>{groupDataCards}</div>;
  } else {
    return (
      <div>
        <div className="row row-cols-auto mb-3 justify-content-start">
          {dataArray.length !== 0 ? (
            dataArray.map((item) => {
              return <PopupItem item={item} key={item.name} />;
            })
          ) : (
            <small>No available data from devices</small>
          )}
        </div>
      </div>
    );
  }
}

export default function AvailableDataInformation() {
  const dataStream = useSelector(selectDevices); // Gets active devices

  const source = devicesRaw.reduce((acc, data) => {
    const foundItems = dataStream.filter((value) =>
      data.heading.includes(value)
    );
    if (foundItems.length > 0) {
      acc.push(data.heading);
    }
    return acc; // Always return the accumulator
  }, []);

  // Generate updatable DataCards as new devices become active
  const [dataCard, updateDataCard] = useState(<DataCards source={source} />);
  useEffect(() => updateDataCard(<DataCards source={source} />), [source]);

  return <div>{dataCard}</div>;
}

export function ModalDataInformation({ source, groupData }) {
  // Generate static DataCards when the component mounts
  const dataCard = <DataCards source={source} groupData={groupData} />;

  return <div>{dataCard}</div>;
}
