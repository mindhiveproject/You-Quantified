import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import {
  deviceRuntime,
  useCameraStream,
  useInputStatus,
} from "../../../../devices/runtime";
import { needsCamera } from "../../../../devices/receivers";
import { channelKey } from "../../../../devices/outputs";
import { connectionText } from "./connection_text";

// One linked data source: whether it's streaming, a row per device input to
// connect, and the outputs it streams. Connections live in the device runtime,
// so the card can unmount without dropping them. Unlinking is in the link modal.
export function SourceCard({ source }) {
  const { block } = source;
  const isStreaming = useSyncExternalStore(deviceRuntime.subscribe, () =>
    block.inputs.every(
      ({ id }) => deviceRuntime.inputStatus[`${source.id}/${id}`]?.state === "connected",
    ),
  );

  return (
    <div className="source-card">
      <div className="d-flex justify-content-between align-items-center gap-3">
        <div>
          <h3 className="title">{source.label || block.title}</h3>
          {block.description && <p className="m-0">{block.description}</p>}
        </div>
        <span className={clsx("stream-status", isStreaming && "streaming")}>
          {isStreaming ? (
            <span className="material-symbols-outlined">graphic_eq</span>
          ) : (
            <span className="svg-icon icon-eq-inactive" />
          )}
          {isStreaming ? "Streaming" : "Not streaming"}
        </span>
      </div>
      <Section title="Inputs">
        {block.inputs.map((input) => (
          <InputRow key={input.id} source={source} input={input} />
        ))}
      </Section>
      <Section title="Outputs">
        <OutputChips block={block} />
      </Section>
    </div>
  );
}

// A heading that folds what's under it, with an optional line describing it.
export function Section({ title, subtitle, large, children }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="d-flex flex-column gap-2">
      <h4 className="section-heading">
        <button
          className={clsx("section-toggle", large && "large", !open && "closed")}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span>
            <span className="section-title">{title}</span>
            {subtitle && <span className="subtitle">{subtitle}</span>}
          </span>
          <span className="material-symbols-outlined">arrow_drop_down</span>
        </button>
      </h4>
      {open && children}
    </div>
  );
}

// A device or a catalog entry, with its actions to the right and anything
// else, like a camera preview, underneath.
export function DeviceRow({ title, subtitle, subtitleClass, className, actions, children }) {
  return (
    <div className={clsx("device-row", className)}>
      <div className="d-flex justify-content-between align-items-center gap-3">
        <div className="text-truncate">
          <span className="title text-truncate">{title}</span>
          <span className={clsx("subtitle text-truncate", subtitleClass)}>{subtitle}</span>
        </div>
        <div className="d-flex gap-2 flex-shrink-0">{actions}</div>
      </div>
      {children}
    </div>
  );
}

// The line under an input's name is the device's name once it connects.
const SUBTITLE_COLOR = {
  connected: "text-primary",
  lost: "text-danger",
  failed: "text-danger",
};

// Clicking a held input disconnects it, whatever its button says.
const BUTTON_TEXT = {
  disconnected: "Connect",
  awaiting: "Connect",
  failed: "Connect",
  connected: "Connected",
  lost: "Disconnect",
};

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
    <DeviceRow
      title={input.label}
      subtitle={status?.error || status?.device || text.text || "No device connected"}
      subtitleClass={clsx("small", SUBTITLE_COLOR[state])}
      actions={
        <button
          className={`btn btn-48 ${state === "connected" ? "btn-outline-primary" : "btn-outline-dark"}`}
          onClick={toggle}
          disabled={state === "awaiting"}
          title={held ? "Disconnect" : undefined}
        >
          <span className="material-symbols-outlined">graphic_eq</span>
          {BUTTON_TEXT[state]}
        </button>
      }
    >
      {held && needsCamera(input.receiver) && (
        <CameraPreview sourceId={source.id} inputId={input.id} />
      )}
    </DeviceRow>
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
    <div className="position-relative border border-dark">
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
    <div className="d-flex flex-wrap gap-2">
      {shown.map(({ key, label }) => (
        <span key={key} className="tag">
          {label}
        </span>
      ))}
      {channels.length > OUTPUTS_SHOWN && (
        <button className="tag" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show less" : `${channels.length - OUTPUTS_SHOWN} more`}
        </button>
      )}
    </div>
  );
}
