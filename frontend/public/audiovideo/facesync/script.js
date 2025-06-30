// Copyright 2023 The MediaPipe Authors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;
const demosSection = document.getElementById("demos");
const imageBlendShapes = document.getElementById("image-blend-shapes");
const videoBlendShapes = document.getElementById("video-blend-shapes");
let faceLandmarker;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoWidth = 480;
let scores = {};
let threshold=0.90;
let noTwoFace= [
    { index: 0, score: 0.1, categoryName: '_neutral', displayName: '', diff_score: 1 },
    { index: 1, score: 0.1, categoryName: 'browDownLeft', displayName: '', diff_score: 1 },
    { index: 2, score: 0.1, categoryName: 'browDownRight', displayName: '', diff_score: 1 },
    { index: 3, score: 0.1, categoryName: 'browInnerUp', displayName: '', diff_score: 1 },
    { index: 4, score: 0.1, categoryName: 'browOuterUpLeft', displayName: '', diff_score: 1 },
    { index: 5, score: 0.1, categoryName: 'browOuterUpRight', displayName: '', diff_score: 1 },
    { index: 6, score: 0.1, categoryName: 'cheekPuff', displayName: '', diff_score: 1 },
    { index: 7, score: 0.1, categoryName: 'cheekSquintLeft', displayName: '', diff_score: 1 },
    { index: 8, score: 0.1, categoryName: 'cheekSquintRight', displayName: '', diff_score: 1 },
    { index: 9, score: 0.1, categoryName: 'eyeBlinkLeft', displayName: '', diff_score: 1 },
    { index: 10, score: 0.1, categoryName: 'eyeBlinkRight', displayName: '', diff_score: 1 },
    { index: 11, score: 0.1, categoryName: 'eyeLookDownLeft', displayName: '', diff_score: 1 },
    { index: 12, score: 0.1, categoryName: 'eyeLookDownRight', displayName: '', diff_score: 1 },
    { index: 13, score: 0.1, categoryName: 'eyeLookInLeft', displayName: '', diff_score: 1 },
    { index: 14, score: 0.1, categoryName: 'eyeLookInRight', displayName: '', diff_score: 1 },
    { index: 15, score: 0.1, categoryName: 'eyeLookOutLeft', displayName: '', diff_score: 1 },
    { index: 16, score: 0.1, categoryName: 'eyeLookOutRight', displayName: '', diff_score: 1 },
    { index: 17, score: 0.1, categoryName: 'eyeLookUpLeft', displayName: '', diff_score: 1 },
    { index: 18, score: 0.1, categoryName: 'eyeLookUpRight', displayName: '', diff_score: 1 },
    { index: 19, score: 0.1, categoryName: 'eyeSquintLeft', displayName: '', diff_score: 1 },
    { index: 20, score: 0.1, categoryName: 'eyeSquintRight', displayName: '', diff_score: 1 },
    { index: 21, score: 0.1, categoryName: 'eyeWideLeft', displayName: '', diff_score: 1 },
    { index: 22, score: 0.1, categoryName: 'eyeWideRight', displayName: '', diff_score: 1 },
    { index: 23, score: 0.1, categoryName: 'jawForward', displayName: '', diff_score: 1 },
    { index: 24, score: 0.1, categoryName: 'jawLeft', displayName: '', diff_score: 1 },
    { index: 25, score: 0.1, categoryName: 'jawOpen', displayName: '', diff_score: 1 },
    { index: 26, score: 0.1, categoryName: 'jawRight', displayName: '', diff_score: 1 },
    { index: 27, score: 0.1, categoryName: 'mouthClose', displayName: '', diff_score: 1 },
    { index: 28, score: 0.1, categoryName: 'mouthDimpleLeft', displayName: '', diff_score: 1 },
    { index: 29, score: 0.1, categoryName: 'mouthDimpleRight', displayName: '', diff_score: 1 },
    { index: 30, score: 0.1, categoryName: 'mouthFrownLeft', displayName: '', diff_score: 1 },
    { index: 31, score: 0.1, categoryName: 'mouthFrownRight', displayName: '', diff_score: 1 },
    { index: 32, score: 0.1, categoryName: 'mouthFunnel', displayName: '', diff_score: 1 },
    { index: 33, score: 0.1, categoryName: 'mouthLeft', displayName: '', diff_score: 1 },
    { index: 34, score: 0.1, categoryName: 'mouthLowerDownLeft', displayName: '', diff_score: 1 },
    { index: 35, score: 0.1, categoryName: 'mouthLowerDownRight', displayName: '', diff_score: 1 },
    { index: 36, score: 0.1, categoryName: 'mouthPressLeft', displayName: '', diff_score: 1 },
    { index: 37, score: 0.1, categoryName: 'mouthPressRight', displayName: '', diff_score: 1 },
    { index: 38, score: 0.1, categoryName: 'mouthPucker', displayName: '', diff_score: 1 },
    { index: 39, score: 0.1, categoryName: 'mouthRight', displayName: '', diff_score: 1 },
    { index: 40, score: 0.1, categoryName: 'mouthRollLower', displayName: '', diff_score: 1 },
    { index: 41, score: 0.1, categoryName: 'mouthRollUpper', displayName: '', diff_score: 1 },
    { index: 42, score: 0.1, categoryName: 'mouthShrugLower', displayName: '', diff_score: 1 },
    { index: 43, score: 0.1, categoryName: 'mouthShrugUpper', displayName: '', diff_score: 1 },
    { index: 44, score: 0.1, categoryName: 'mouthSmileLeft', displayName: '', diff_score: 1 },
    { index: 45, score: 0.1, categoryName: 'mouthSmileRight', displayName: '', diff_score: 1 },
    { index: 46, score: 0.1, categoryName: 'mouthStretchLeft', displayName: '', diff_score: 1 },
    { index: 47, score: 0.1, categoryName: 'mouthStretchRight', displayName: '', diff_score: 1 },
    { index: 48, score: 0.1, categoryName: 'mouthUpperUpLeft', displayName: '', diff_score: 1 },
    { index: 49, score: 0.1, categoryName: 'mouthUpperUpRight', displayName: '', diff_score: 1 },
    { index: 50, score: 0.1, categoryName: 'noseSneerLeft', displayName: '', diff_score: 1 },
    { index: 51, score: 0.1, categoryName: 'noseSneerRight', displayName: '', diff_score: 1 }
];


const bc= new BroadcastChannel('face-sync');


// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
async function createFaceLandmarker() {
    const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode,
        numFaces: 2
    });
    demosSection.classList.remove("invisible");
}
createFaceLandmarker();

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}
// Enable the live webcam view and start detection.
function enableCam(event) {
    if (!faceLandmarker) {
        console.log("Wait! faceLandmarker not loaded yet.");
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "Enable Predictions";
    }
    else {
        webcamRunning = true;
        enableWebcamButton.innerText = "Disable Predictions";
    }
    // getUsermedia parameters.
    const constraints = {
        video: true
    };
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}
let lastVideoTime = -1;
let results = undefined;
const drawingUtils = new DrawingUtils(canvasCtx);
async function predictWebcam() {
    const radio = video.videoHeight / video.videoWidth;
    video.style.width = videoWidth + "px";
    video.style.height = videoWidth * radio + "px";
    canvasElement.style.width = videoWidth + "px";
    canvasElement.style.height = videoWidth * radio + "px";
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
    // Now let's start detecting the stream.
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await faceLandmarker.setOptions({ runningMode: runningMode });
    }
    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = faceLandmarker.detectForVideo(video, startTimeMs);
    }
    if (results.faceLandmarks) {
        for (const landmarks of results.faceLandmarks) {
            //bc.postMessage(landmarks);
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#FF3030" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: "#FF3030" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#30FF30" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: "#30FF30" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: "#FF3030" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: "#30FF30" });
        }
    }
    if (results.faceBlendshapes) {
        for (const shapes of results.faceBlendshapes) {
            ;
        }
    }
    drawBlendShapes(videoBlendShapes, results.faceBlendshapes);
    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}
function drawBlendShapes(el, blendShapes) {

    if (blendShapes.length<2) {
        bc.postMessage(noTwoFace)
        console.log("No two faces")
        return;
    }

    let [firstBlendShape, secondBlendShape] = blendShapes;
    console.log(firstBlendShape)
    let absoluteDifferences = firstBlendShape.categories.map((item, index) => {
        const absDiff = 1 - (Math.abs(item.score - secondBlendShape.categories[index].score));
        const categoryName = item.categoryName;

        // Initialize score for this categoryName if it doesn't already exist
        if (!scores[categoryName]) {
            scores[categoryName] = 0;
        }

        if (absDiff > threshold) {
            scores[categoryName]++;
          }

        return {
          ...item, // spread operator to copy all properties from the current item
          score: absDiff,
          diff_score: scores[item.categoryName]
        };
      });


    
    let htmlMaker = "";
    bc.postMessage(absoluteDifferences)
    console.log("Absolute Differences", absoluteDifferences);
    absoluteDifferences.map((shape) => {
        htmlMaker += `
      <li class="blend-shapes-item">
        <span class="blend-shapes-label">${shape.displayName || shape.categoryName}</span>
        <span class="blend-shapes-value" style="width: calc(${+shape.score}% - 120px)">${(+shape.score).toFixed(4)}</span>
      </li>
    `;
    });
    el.innerHTML = htmlMaker;
}