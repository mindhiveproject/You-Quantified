import { useEffect, useRef, useState } from "react";
import {
  deviceRuntime,
  useCameraStream,
  useInputStatus,
} from "../../../../devices/runtime";
import { needsCamera } from "../../../../devices/receivers";
import { channelKey } from "../../../../devices/outputs";
import { connectionText } from "./connection_text";

// One linked data source: what it needs, a row per device input to connect,
// and the outputs it streams. Connections live in the device runtime, so the
// card can unmount without dropping them.
export function SourceCard({ source, onRemove }) {
  const { block } = source;

  return (
    <div className="card rounded-0 border-dark mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <small>{block.requirementLabel}</small>
            <h5 className="card-title m-0">{source.label || block.title}</h5>
          </div>
          <button
            className="btn btn-link text-decoration-none p-0"
            title="Unlink"
            onClick={onRemove}
          >
            <span className="material-symbols-outlined">link_off</span>
          </button>
        </div>
        {block.description && <p className="mt-2 mb-0">{block.description}</p>}
      </div>
      <ul className="list-group list-group-flush border-top border-dark">
        {block.inputs.map((input) => (
          <InputRow key={input.id} source={source} input={input} />
        ))}
      </ul>
      <div className="card-body border-top border-dark">
        <h6>Outputs</h6>
        <OutputChips block={block} />
      </div>
    </div>
  );
}

function InputRow({ source, input }) {
  const status = useInputStatus(source.id, input.id);
  const state = status?.state ?? "disconnected";
  // A lost device is still held until it's disconnected; some come back.
  const held = state === "connected" || state === "lost";
  const text = connectionText[state];

  function toggle() {
    if (held) deviceRuntime.disconnect(source.id, input.id);
    else deviceRuntime.connect(source, input.id);
  }

  return (
    <li className="list-group-item">
      <div className="d-flex justify-content-between align-items-center">
        <div className="text-truncate">
          <span className="d-block">{input.label}</span>
          {(status?.error || status?.device) && (
            <small className="text-body-tertiary">
              {status.error || status.device}
            </small>
          )}
        </div>
        <div className="d-flex align-items-center flex-shrink-0">
          <span className={`me-3 ${text.type}`}>{text.text}</span>
          <button
            className="btn btn-outline-dark btn-sm"
            onClick={toggle}
            disabled={state === "awaiting"}
          >
            {held ? "Disconnect" : "Connect"}
          </button>
        </div>
      </div>
      {held && needsCamera(input.receiver) && (
        <CameraPreview sourceId={source.id} inputId={input.id} />
      )}
    </li>
  );
}

// The shared camera, with the input's face geometry drawn over it. The canvas
// covers the video exactly: yq-data maps its normalized coordinates onto it
// using the video's size and object-fit.
function CameraPreview({ sourceId, inputId }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stream = useCameraStream();

  useEffect(() => {
    videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    let closed = false;
    let detach = () => {};
    deviceRuntime
      .attachOverlay(sourceId, inputId, canvasRef.current, videoRef.current)
      .then((stop) => (closed ? stop() : (detach = stop)));
    return () => {
      closed = true;
      detach();
    };
  }, [sourceId, inputId]);

  return (
    <div className="position-relative border border-dark mt-2">
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        className="w-100 d-block"
        style={{ objectFit: "cover" }}
      />
      <canvas
        ref={canvasRef}
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}

// A face landmarker alone streams 52 blendshapes; past this many the list
// stops being a summary.
const OUTPUTS_SHOWN = 20;

// Every channel a block streams, which is what parameters can be mapped to.
export function OutputChips({ block }) {
  const [showAll, setShowAll] = useState(false);
  const channels = block.outputs.flatMap((output) =>
    output.channels.map((channel) => ({
      key: channelKey(output, channel.index),
      label: channel.label,
    })),
  );
  const shown = showAll ? channels : channels.slice(0, OUTPUTS_SHOWN);

  return (
    <div className="d-flex flex-wrap gap-1">
      {shown.map(({ key, label }) => (
        <span key={key} className="border border-primary-subtle px-2 py-1 small">
          {label}
        </span>
      ))}
      {channels.length > OUTPUTS_SHOWN && (
        <button
          className="btn btn-link btn-sm text-decoration-none"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Show less" : `${channels.length - OUTPUTS_SHOWN} more`}
        </button>
      )}
    </div>
  );
}
