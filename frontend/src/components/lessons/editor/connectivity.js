import React, { useEffect, useState } from "react";
import { DeviceConnection } from "../../devices/stream functions/connection_modal";
import { GenericDeviceButton } from "../../devices/buttons/buttons";
import { useSelector } from "react-redux";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import devicesRaw from "../../../metadata/devices.json";

const DeviceExtension = Node.create({
  name: "Device Connectivity",
  group: "block",
  tag: "device-connection",
  atom: true,
  addAttributes() {
    return {
      device: {
        default: "select",
        parseHTML: (element) => element.getAttribute("device"),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(RenderDeviceButton);
  },
  renderHTML({ HTMLAttributes }) {
    return ["device-connection", mergeAttributes(HTMLAttributes)];
  },
  parseHTML() {
    return [
      {
        tag: "device-connection",
      },
    ];
  },
});

export default DeviceExtension;

function RenderDeviceButton(props) {
  const deviceName = props.node.attrs.device;
  let data = devicesRaw.find(({ heading }) => deviceName === heading);

  const deviceMeta = useSelector((state) => state.deviceMeta);
  const [deviceID, setDeviceID] = useState();

  useEffect(() => {
    const myID = Object.keys(deviceMeta)?.find(
      (key) => deviceMeta[key]?.device === deviceName
    );
    console.log(myID);
    setDeviceID(myID);
  }, [deviceMeta]);

  const [show, setShow] = useState(false);
  const handleShow = (data) => setShow(true);
  const handleClose = () => setShow(false);

  return (
    <NodeViewWrapper>
      {deviceID ? (
        <GenericDeviceButton
          data={data}
          name={deviceID}
          handleShow={handleShow}
        />
      ) : (
        <NonConnectedDevice data={data} handleShow={handleShow} />
      )}
      <DeviceConnection
        show={show}
        handleClose={handleClose}
        deviceName={deviceName}
      />
    </NodeViewWrapper>
  );
}

function NonConnectedDevice({ data, handleShow }) {
  return (
    <div className="card rounded-0 mb-2 mt-1">
      <button
        className="card-body btn btn-link text-decoration-none text-start"
        onClick={handleShow}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="card-title g-0 m-0">{data.heading}</h5>
            <small className="g-0 m-0">{data.type}</small>
          </div>
          <p className={`g-0 m-0 h-100`}>Click to connect</p>
        </div>
      </button>
    </div>
  );
}
