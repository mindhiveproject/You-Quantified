import * as faceapi from "face-api.js";
import store from "../store/store";

// From FaceAPI js https://justadudewhohacks.github.io/face-api.js/docs/globals.html#drawdetectionoptions
// Github https://github.com/justadudewhohacks/face-api.js/tree/master?tab=readme-ov-file

export class FaceEmotionRecognition {
  modelBasePath;
  htmlVideoElement;
  canvasHtmlElement;
  loadedModels = false;
  landmarks;
  detections;
  expressions;
  ageGender;
  id;
  isRunning = false;
  connected = false;

  constructor(
    modelBasePath,
    videoElement,
    canvasElement,
    id = "face-emotion-recognition",
  ) {
    this.modelBasePath = modelBasePath;
    this.htmlVideoElement = videoElement;
    this.canvasHtmlElement = canvasElement;
    this.id = id || videoElement.id;
  }

  updateCanvas(canvasElement) {
    this.canvasHtmlElement = canvasElement;
  }

  async connect() {
    await this._loadModels();
    this.connected = true;
    
    store.dispatch({
      type: "devices/create",
      payload: {
        id: this.id,
        metadata: {
          device: "Video Emotion",
          connected: true,
          id: this.id,
          // Need to find the sampling rate. Is it the same as the video frame rate?
          sampling_rate: 24,
          type: "default",
        },
      },
    });
  }

  async _loadModels() {
    try {
      await faceapi.loadFaceDetectionModel(this.modelBasePath);
      await faceapi.loadFaceLandmarkModel(this.modelBasePath);
      await faceapi.loadAgeGenderModel(this.modelBasePath);
      await faceapi.loadFaceExpressionModel(this.modelBasePath);
      this.loadedModels = true;
      console.log("Successfully loaded face emotion models");
    } catch (e) {
      console.log("Error loading models", e);
    }
  }

  async stream() {
    if (!this.htmlVideoElement || !this.loadedModels) return;
    
    this.isRunning = true;

    const processFrame = async () => {
      if (!this.htmlVideoElement || !this.loadedModels || !this.isRunning) return;

      if (this.htmlVideoElement.readyState < 2) {
        this.htmlVideoElement.requestVideoFrameCallback(processFrame);
      }

      try {
        // Chain all methods BEFORE awaiting - this is the correct face-api.js pattern
        const results = await faceapi.detectAllFaces(this.htmlVideoElement)
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();

        if (results.length === 0) {
          // No faces detected, continue to next frame
          this.htmlVideoElement.requestVideoFrameCallback(processFrame);
          return;
        }

        this.detections = results;

        // For now, use the first detected face
        // TODO: Add multi-face support by running face recognition on each face
        // Then, calculate every metric by face
        // Stream for each face using different ids (dispatch)
        // The face recognition should only occurr when new faces enter/leave the frame and it should save old faces (in case someone comes back)
        // Dispatch an type "devices/create" action for each new face (should only happen when a new face enters)
        
        const firstFace = results[0];

        store.dispatch({
          type: "devices/streamUpdate",
          payload: {
            id: this.id,
            data: {
              ...firstFace.expressions,
              // age: firstFace.age,
              // gender: firstFace.gender,
            },
          },
        });

        if (this.canvasHtmlElement && results) {
          this.drawResults();
        }

      } catch (error) {
        console.error("Error processing frame:", error);
      }

      // Request next frame
      if (this.htmlVideoElement && this.isRunning) {
        this.htmlVideoElement.requestVideoFrameCallback(processFrame);
      }
    };

    this.htmlVideoElement.requestVideoFrameCallback(processFrame);
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

  async drawResults(
    showAgeGender = false,
    showExpressions = true,
    showLandmarks = false,
  ) {
    if (!this.canvasHtmlElement || !this.loadedModels || !this.detections) return;
    
    const input = this.htmlVideoElement;
    const canvas = this.canvasHtmlElement;
    const displaySize = { width: input.videoWidth, height: input.videoHeight };

    faceapi.matchDimensions(canvas, displaySize);

    // Now this.detections contains the full results with all data
    const resizedResults = faceapi.resizeResults(this.detections, displaySize);

    // Clear canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw detections (bounding boxes)
    faceapi.draw.drawDetections(canvas, resizedResults);

    if (showLandmarks) {
      faceapi.draw.drawFaceLandmarks(canvas, resizedResults);
    }

    if (showExpressions) {
      const minProbability = 0.05;
      faceapi.draw.drawFaceExpressions(canvas, resizedResults, minProbability);
    }

    if (showAgeGender) {
      // Draw age and gender for each face
      resizedResults.forEach((result) => {
        const { age, gender, genderProbability, detection } = result;
        const box = detection.box;
        const text = `${Math.round(age)} years, ${gender} (${Math.round(genderProbability * 100)}%)`;
        const drawBox = new faceapi.draw.DrawTextField([text], box.topLeft);
        drawBox.draw(canvas);
      });
    }
  }
}
