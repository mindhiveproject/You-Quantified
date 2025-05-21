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

  constructor(modelBasePath, videoElement, canvasElement, id) {
    this.modelBasePath = modelBasePath;
    this.htmlVideoElement = videoElement;
    this.canvasHtmlElement = canvasElement;
    this.id = id || videoElement.id || "face-emotion-recognition";
  }

  async connect() {
    await this._loadModels();
    store.dispatch({
      type: "devices/create",
      payload: {
        id: this.id,
        metadata: {
          device: "Face Emotion Recognition",
          connected: true,
          id: this.id,
          // Need to find the sampling rate. Is it the same as the video frame rate?
          "sampling_rate": 24,
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
    } catch(e) {
      console.log("Error loading models", e);
    }
  }

  async stream() {

    if (!this.htmlVideoElement || !this.loadedModels) return;
    console.log("Started streaming")
    console.log("HTML Video Element", this.htmlVideoElement);
    console.log("Type of video element", this.htmlVideoElement instanceof HTMLVideoElement);
    console.log("Type of video element", this.htmlVideoElement.constructor.name);

    this.detections = await faceapi.detectAllFaces(this.htmlVideoElement);
    if (this.detections.length === 0) return;

    this.landmarks = await detections.withFaceLandmarks();
    this.expressions = await landmarks.withFaceExpressions();
    this.ageGender = await landmarks.withAgeAndGender();

    // Add multi-face support by running face recognition on each face
    // Then, calculate every metric by face
    // Stream for each face using different ids (dispatch)
    // The face recognition should only occurr when new faces enter/leave the frame and it should save old faces (in case someone comes back)
    // Dispatch an type "devices/create" action for each new face (should only happen when a new face enters)

    console.log(this.expressions);

    /* store.dispatch({
      type: "devices/streamUpdate",
      payload: {
        id: this.id,
        data: {
          ...this.expressions[0].expressions,
        },
      },
    });*/
  }

  async drawResults(
    showAgeGender = true,
    showExpressions = true,
    showLandmarks = true
  ) {
    if (!this.canvasHtmlElement || !this.loadedModels) return;
    const input = this.htmlVideoElement;
    const canvas = this.canvasHtmlElement;
    const displaySize = { width: input.width, height: input.height };

    faceapi.matchDimensions(canvas, displaySize);

    const resizedDetections = faceapi.resizeResults(
      this.detections,
      displaySize
    );

    const resizedLandmarks = faceapi.resizeResults(this.landmarks, displaySize);

    const resizedExpressions = faceapi.resizeResults(
      this.expressions,
      displaySize
    );

    const resizedAgeGender = faceapi.resizeResults(this.ageGender, displaySize);

    faceapi.draw.drawDetections(canvas, resizedDetections);

    if (showAgeGender) {
      faceapi.draw.drawDetections(canvas, resizedAgeGender);
    }

    if (showExpressions) {
      faceapi.draw.drawFaceExpressions(canvas, resizedExpressions);
    }

    const minProbability = 0.05;
    faceapi.draw.drawFaceExpressions(canvas, resizedResults, minProbability);

    if (showLandmarks) {
      faceapi.draw.drawFaceLandmarks(canvas, resizedLandmarks);
    }
  }
}
