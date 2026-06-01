import { FaceLandmarkerDevice } from "../../../utility/face_landmarker";
import store from "../../../store/store";

export async function connectFace(changeConnectionStatus, setCamStream, videoRef, canvasRef, processingVideoRef) {
  changeConnectionStatus("awaiting");
  
  try {
    // Use the persistent hidden video element for processing
    if (!processingVideoRef?.current) {
      console.error("processingVideoRef not available");
      changeConnectionStatus("failed");
      return;
    }
    
    const videoElement = processingVideoRef.current;
    const canvasElement = canvasRef?.current || null;
    
    // Check if video stream already exists (shared with other face devices)
    let mediaStream = videoElement.srcObject;
    
    if (!mediaStream) {
      // Get video stream from camera
      mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      
      if (!mediaStream) {
        changeConnectionStatus("failed");
        return;
      }
      
      // Set srcObject on hidden video element for processing
      videoElement.srcObject = mediaStream;
    } else {
      console.log("Face Landmarker: Reusing existing video stream");
    }
    
    try {
      await videoElement.play();
    } catch (playError) {
      // Handle AbortError when component unmounts during play
      if (playError.name === 'AbortError') {
        console.log("Video play aborted (component likely unmounted)");
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }
      throw playError;
    }
    
    setCamStream(mediaStream);
    let faceLandmarker = window.faceLandmarkerDevice;
    
    if (!faceLandmarker) {
      faceLandmarker = new FaceLandmarkerDevice(videoElement, canvasElement);
      window.faceLandmarkerDevice = faceLandmarker;
    } else {
      console.log("Reusing existing Face Landmarker");
      faceLandmarker.updateCanvas(canvasElement);
    }
    
    try {
      await faceLandmarker.connect();
      
      // Start streaming once video is ready
      const startStreaming = async () => {
        await faceLandmarker.stream();
        changeConnectionStatus("connected");
      };
      
      // Check if video is already ready, otherwise wait for it
      if (videoElement.readyState >= 2) {
        // Video already has data loaded
        await startStreaming();
      } else {
        // Wait for video to load
        const loadHandler = async () => {
          await startStreaming();
          videoElement.removeEventListener('loadeddata', loadHandler);
        };
        videoElement.addEventListener('loadeddata', loadHandler);
      }
      
    } catch (error) {
      console.error("Failed to connect face landmarker:", error);
      changeConnectionStatus("failed");
      
      // Clean up stream
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoElement.srcObject = null;
      }
      
      setCamStream(null);
    }
    
  } catch (error) {
    console.error("Failed to access camera:", error);
    changeConnectionStatus("failed");
    
    // Ensure cleanup on any error
    if (processingVideoRef?.current?.srcObject) {
      const tracks = processingVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      processingVideoRef.current.srcObject = null;
    }
  }
}

export function disconnectFace(setCamStream, processingVideoRef) {
  const faceLandmarker = window.faceLandmarkerDevice;
  
  if (faceLandmarker) {
    faceLandmarker.stop();
  }
  
  // Check if any other face devices are still running
  const faceEmotion = window.faceEmotionDevice;
  const otherDeviceRunning = faceEmotion?.isOpen();
  
  // Only stop the video stream if no other face device is using it
  if (!otherDeviceRunning && processingVideoRef?.current?.srcObject) {
    console.log("Face Landmarker: Stopping video stream");
    const tracks = processingVideoRef.current.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    processingVideoRef.current.srcObject = null;
  } else if (otherDeviceRunning) {
    console.log("Face Landmarker: Keeping video stream for other face devices");
  }
  
  setCamStream(null);
}
