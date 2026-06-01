import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import store from "../store/store";

export class FaceLandmarkerDevice {
  constructor(videoElement, canvasElement = null) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement?.getContext("2d");
    this.drawingUtils = canvasElement ? new DrawingUtils(this.canvasCtx) : null;
    
    this.faceLandmarker = null;
    this.runningMode = "VIDEO";
    this.isRunning = false;
    this.lastVideoTime = -1;
    this.results = undefined;
    
    this.id = "Face Landmarker";
    this.connected = false;
  }

  updateCanvas(canvasElement) {
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement?.getContext("2d");
    this.drawingUtils = canvasElement ? new DrawingUtils(this.canvasCtx) : null;
  }

  async connect() {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      
      this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: this.runningMode,
        numFaces: 1
      });
      
      this.connected = true;
      
      // Create device in store
      store.dispatch({
        type: "devices/create",
        payload: {
          id: this.id,
          metadata: {
            device: "Face Landmarker",
            type: "video",
            id: this.id,
            connected: true,
          },
        },
      });
      
      console.log("Face Landmarker connected successfully");
    } catch (error) {
      this.connected = false;
      throw new Error("Unable to load Face Landmarker model: " + error);
    }
  }

  async stream() {
    if (!this.faceLandmarker) {
      console.error("Face Landmarker not initialized. Call connect() first.");
      return;
    }
    
    if (!this.videoElement) {
      console.error("No video element provided");
      return;
    }
    
    this.isRunning = true;
    this.predictWebcam();
  }

  async predictWebcam() {
    if (!this.isRunning || !this.videoElement) {
      return;
    }

    // Ensure video is ready
    if (this.videoElement.readyState < 2) {
      requestAnimationFrame(() => this.predictWebcam());
      return;
    }

    // Only process if we have a new frame
    if (this.lastVideoTime !== this.videoElement.currentTime) {
      this.lastVideoTime = this.videoElement.currentTime;
      const startTimeMs = performance.now();
      
      try {
        this.results = this.faceLandmarker.detectForVideo(this.videoElement, startTimeMs);
        
        // Draw landmarks on canvas if available
        if (this.canvasElement && this.results.faceLandmarks) {
          this.drawLandmarks();
        }
        
        // Dispatch blend shapes to Redux store
        if (this.results.faceBlendshapes && this.results.faceBlendshapes.length > 0) {
          this.dispatchBlendShapes(this.results.faceBlendshapes[0]);
        }
      } catch (error) {
        console.error("Error detecting face:", error);
      }
    }
    
    // Continue prediction loop
    if (this.isRunning) {
      requestAnimationFrame(() => this.predictWebcam());
    }
  }

  drawLandmarks() {
    if (!this.canvasElement || !this.canvasCtx || !this.drawingUtils) {
      console.log("Cannot draw - missing:", {
        canvas: !!this.canvasElement,
        ctx: !!this.canvasCtx,
        utils: !!this.drawingUtils
      });
      return;
    }
    
    // Sync canvas size with video element dimensions
    if (this.videoElement.videoWidth && this.videoElement.videoHeight) {
      if (this.canvasElement.width !== this.videoElement.videoWidth ||
          this.canvasElement.height !== this.videoElement.videoHeight) {
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
        console.log(`Canvas resized to match video: ${this.canvasElement.width}x${this.canvasElement.height}`);
      }
    }
    
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
    // Draw landmarks
    for (const landmarks of this.results.faceLandmarks) {
      this.drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      );
      this.drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030" }
      );
      this.drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: "#FF3030" }
      );
      this.drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#30FF30" }
      );
      this.drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: "#30FF30" }
      );
      this.drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#E0E0E0" }
      );
      this.drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#E0E0E0" }
      );
      this.drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: "#FF3030" }
      );
      this.drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: "#30FF30" }
      );
    }
    
    this.canvasCtx.restore();
  }

  dispatchBlendShapes(blendShapes) {
    const data = {};
    
    for (const shape of blendShapes.categories) {
      data[shape.categoryName] = shape.score;
    }
    
    store.dispatch({
      type: "devices/streamUpdate",
      payload: {
        id: this.id,
        data: data,
      },
    });
  }

  stop() {
    this.isRunning = false;
    
    if (this.connected) {
      store.dispatch({
        type: "devices/updateMetadata",
        payload: {
          id: this.id,
          field: "connected",
          data: false,
        },
      });
    }
    
    this.connected = false;
  }

  isOpen() {
    return this.connected && this.isRunning;
  }
}
