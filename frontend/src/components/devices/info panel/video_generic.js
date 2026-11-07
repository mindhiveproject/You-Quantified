import { useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { findDeviceByName } from "../../../devices/definitions";
import { deviceRuntime, useCameraStream } from "../../../devices/runtime";
import { ModalDataInformation } from "./data_sources_display";

// Face geometry drawn over the preview, for devices whose definition has an
// `overlay`. The canvas covers the video exactly: yq-data maps its normalized
// coordinates onto it using the video's size and object-fit.
function PreviewOverlay({ deviceName, videoRef }) {
  const canvasRef = useRef(null);
  const deviceId = useSelector(
    (state) =>
      Object.values(state.deviceMeta).find((meta) => meta.device === deviceName)
        ?.id,
  );

  useEffect(() => {
    if (!deviceId || !deviceRuntime.hasOverlay(deviceId)) return;
    let cancelled = false;
    let detach;
    deviceRuntime
      .attachOverlay(deviceId, canvasRef.current, videoRef.current)
      .then((stop) => {
        if (cancelled) stop();
        else detach = stop;
      })
      .catch((error) => console.warn("Could not draw the overlay", error));
    return () => {
      cancelled = true;
      detach?.();
    };
  }, [deviceId, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className="position-absolute top-0 start-0 w-100 h-100"
      style={{ pointerEvents: "none" }}
    />
  );
}

export function VideoInfoPane({ currentDevice }) {
  const deviceInfo = findDeviceByName(currentDevice?.device);
  const videoRef = useRef(null);
  // The camera itself is owned by the device runtime; this is only a preview.
  const camStream = useCameraStream();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = camStream;
    if (camStream) {
      video.play().catch((err) => {
        console.log("Video play failed:", err);
      });
    }
  }, [camStream]);

  return (
    <div className="p-4">
      <h4 className="mb-2">{deviceInfo.name}</h4>

      {camStream ? (
        <div className="mb-3 position-relative w-100 border border-dark">
          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            className="w-100 d-block"
            style={{
              objectFit: "cover",
            }}
          ></video>
          <PreviewOverlay deviceName={deviceInfo.name} videoRef={videoRef} />
        </div>
      ) : (
        <div className="mb-4 mt-4 text-primary">
          Click the {deviceInfo.name} button to start streaming video.
        </div>
      )}
      <div>
        <span>{deviceInfo.description}</span>
        <div className="mt-3">
          <h6>Available data streams</h6>
          <p>
            This device can stream the following data to a visualization. Hover
            to learn more.
          </p>
          <ModalDataInformation source={deviceInfo.name} groupData={true} />
        </div>
      </div>
    </div>
  );
}
