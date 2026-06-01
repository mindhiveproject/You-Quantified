import { useRef, useEffect } from "react";
import devicesRaw from "../../../metadata/devices.json";
import { ModalDataInformation } from "./data_sources_display";
import clsx from "clsx";

export function VideoInfoPane({
  currentDevice,
  camStream,
  setCamStream,
  videoRef,
  canvasRef,
}) {
  const deviceJsonInfo = devicesRaw.find(
    ({ device }) => device === currentDevice?.device,
  );

  useEffect(() => {
    // Set srcObject for UI display video
    if (videoRef?.current && camStream) {
      videoRef.current.srcObject = camStream;
      videoRef.current.play().catch((err) => {
        console.log("Video play failed:", err);
      });
    }
  }, [camStream, videoRef]);

  useEffect(() => {
    // Update canvas for whichever device is currently active/being viewed
    if (canvasRef?.current) {
      const isFaceLandmarker = currentDevice?.device === "Face Landmarker";
      const isFaceEmotion = currentDevice?.device === "Video Emotion";
      
      if (isFaceLandmarker && window.faceLandmarkerDevice) {
        window.faceLandmarkerDevice.updateCanvas(canvasRef.current);
      } else if (isFaceEmotion && window.faceEmotionDevice) {
        window.faceEmotionDevice.updateCanvas(canvasRef.current);
      }
    }
  }, [canvasRef, currentDevice]);

  console.log(videoRef.current, canvasRef.current);

  return (
    <div className="p-4">
      <h4 className="mb-2">{deviceJsonInfo.device}</h4>

      {videoRef?.current || videoRef ? (
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
          <canvas
            ref={canvasRef}
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              pointerEvents: "none",
            }}
          />
        </div>
      ) : (
        <div className="mb-4 mt-4 text-primary">
          Click the {deviceJsonInfo.device} button to start streaming video.
        </div>
      )}
      <div>
        <span>{deviceJsonInfo.description}</span>
        <div className="mt-3">
          <h6>Available data streams</h6>
          <p>
            This device can stream the following data to a visualization. Hover
            to learn more.
          </p>
          <ModalDataInformation
            source={deviceJsonInfo.device}
            groupData={true}
          />
        </div>
      </div>
    </div>
  );
}

function CameraDropDown() {}
