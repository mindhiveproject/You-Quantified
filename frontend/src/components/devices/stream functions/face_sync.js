import FaceSync from "../../../utility/faceSync";
import store from "../../../store/store";

export function connectFaceSync(changeConnectionStatus) {
  window.open("/audiovideo/facesync/index.html", "_blank", "popup");
  const bc = new BroadcastChannel("face-sync");
  const face = new FaceSync(bc);
  face.initialize();

  changeConnectionStatus("awaiting");
  setTimeout(() => {
    const id = "Face Synchrony";
    if (face.isOpen()) {
      changeConnectionStatus("connected");
      store.dispatch({
        type: "devices/create",
        payload: {
          id: id,
          metadata: {
            device: "FaceSync",
            type: "default",
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
