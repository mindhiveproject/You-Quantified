import { FaceEmotionRecognition } from "../../../utility/face_emotion";
import { render, createPortal, createRoot } from "react-dom";
import { useEffect, useMemo, useRef } from "react";

export function connectVideoEmotion() {
  const newWindow = window.open(
    "about:blank",
    "_blank",
    "popup"
  );

  newWindow.document.title = "Video Emotion";
  const container = document.createElement("div");
  container.id = "root";
  newWindow.document.body.appendChild(container);

  window.onbeforeunload = () => {
    if (newWindow && !newWindow.closed) {
      newWindow.close();
    }
  };

  return render(<VideoWindow />, container);
}


function VideoWindow({ onClose = () => {} }) {
  // const [videoInitialized, setVideoInitialized] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  async function startPredictions() {
    const modelPaths = "/audiovideo/videoEmotion/models";

    const faceEmotion = new FaceEmotionRecognition(
      modelPaths,
      videoRef.current,
      canvasRef.current
    );
    await faceEmotion.connect();
    await faceEmotion.stream();
  }

  useEffect(() => {

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          console.log(videoRef.current);
          videoRef.current.srcObject = stream;
          startPredictions();
        })
        .catch((err) => {
          console.log("Something went wrong!");
        });
    }

    window.onbeforeunload = () => {
      onClose();
    };
  });

  // https://github.com/samdutton/simpl/blob/gh-pages/getusermedia/sources/js/main.js
  // 

  return (
    <div className="w-100 h-100">
      <video
        id="video"
        autoPlay={true}
        muted
        playsInline
        ref={videoRef}
      ></video>
      <canvas id="canvas" ref={canvasRef}></canvas>
    </div>
  );
}
