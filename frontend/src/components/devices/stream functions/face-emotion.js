import store from "../../../store/store";
import { FaceEmotionRecognition } from "../../../utility/face_emotion";

export async function connectVideoEmotion(
  changeConnectionStatus,
  setCamStream,
  videoRef,
  canvasRef,
  processingVideoRef,
) {
  changeConnectionStatus("awaiting");

  if (!processingVideoRef?.current) {
    changeConnectionStatus("failed");
    return;
  }

  const videoElement = processingVideoRef.current;
  const canvasElement = canvasRef?.current;

  // Check if video stream already exists (shared with other face devices)
  let mediaStream = videoElement.srcObject;
  
  if (!mediaStream) {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
    });

    if (!mediaStream) {
      changeConnectionStatus("failed");
      return;
    }

    videoElement.srcObject = mediaStream;
  } else {
    console.log("Face Emotion: Reusing existing video stream");
  }
  try {
    await videoElement.play();
  } catch (playError) {
    if (playError.name === "AbortError") {
      console.log("Video play aborted (component likely unmounted)");
      mediaStream.getTracks().forEach((track) => track.stop());
      return;
    }
    throw playError;
  }

  setCamStream(mediaStream);
  let faceEmotion = window.faceEmotionDevice;
  if (!faceEmotion) {
    faceEmotion = new FaceEmotionRecognition(
      "/audiovideo/videoEmotion/models",
      videoElement,
      canvasElement,
    );
    window.faceEmotionDevice = faceEmotion;
  } else {
    faceEmotion.updateCanvas(canvasElement);
  }

  try {
    await faceEmotion.connect();

    const startStreaming = async () => {
      faceEmotion.stream();
      changeConnectionStatus("connected");
    };

    if (videoElement.readyState >= 2) {
      await startStreaming();
    } else {
      const loadHandler = async () => {
        await startStreaming();
        videoElement.removeEventListener("loadeddata", loadHandler);
      };
      videoElement.addEventListener("loadeddata", loadHandler);
    }
  } catch (error) {
    console.error("Failed to connect face landmarker:", error);
    changeConnectionStatus("failed");

    if (videoElement && videoElement.srcObject) {
      const tracks = videoElement.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoElement.srcObject = null;
    }

    setCamStream(null);
  }
}

export function disconnectVideoEmotion(setCamStream, processingVideoRef) {
  const faceEmotion = window.faceEmotionDevice;
  
  if (faceEmotion) {
    faceEmotion.stop();
  }
  
  // Check if any other face devices are still running
  const faceLandmarker = window.faceLandmarkerDevice;
  const otherDeviceRunning = faceLandmarker?.isOpen();
  
  // Only stop the video stream if no other face device is using it
  if (!otherDeviceRunning && processingVideoRef?.current?.srcObject) {
    console.log("Face Emotion: Stopping video stream");
    const tracks = processingVideoRef.current.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    processingVideoRef.current.srcObject = null;
  } else if (otherDeviceRunning) {
    console.log("Face Emotion: Keeping video stream for other face devices");
  }
  
  setCamStream(null);
}
