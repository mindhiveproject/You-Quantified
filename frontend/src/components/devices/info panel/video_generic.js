import { useRef, useEffect } from "react";
import { findDeviceByName } from "../../../devices/definitions";
import { useCameraStream } from "../../../devices/runtime";
import { ModalDataInformation } from "./data_sources_display";

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
        <div className="mb-3 position-relative w-100">
          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            className="w-100 d-block border border-dark"
            style={{
              objectFit: "cover",
            }}
          ></video>
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
