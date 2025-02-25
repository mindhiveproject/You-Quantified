import Face from "../../../utility/face";
import store from "../../../store/store";

export function connectFace(changeConnectionStatus) {
  var popup = window.open("/audiovideo/face/index.html", "_blank", "popup");

  window.onbeforeunload = function() {
    if (popup && !popup.closed) {
        popup.close();
    }
  };

  const bc = new BroadcastChannel("face-landmarks");
  const face = new Face(bc);
  face.initialize();

  changeConnectionStatus("awaiting");
  setTimeout(() => {
    const id = "Face Landmarker";
    if (face.isOpen()) {
      changeConnectionStatus("connected");
      store.dispatch({
        type: "devices/create",
        payload: {
          id: id,
          metadata: {
            device: "Face Landmarker",
            type: "video",
            id: id,
            connected: true,
          },
        },
      });
    } else {
      changeConnectionStatus("failed");
    }
  }, 2000);
}
