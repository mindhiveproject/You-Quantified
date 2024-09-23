import Face from "../../../utility/face";
import store from "../../../store/store";

export function connectFace(changeConnectionStatus) {
  window.open("/audiovideo/face/index.html", "_blank", "popup");
  const bc = new BroadcastChannel("face-landmarks");
  const face = new Face(bc);
  face.initialize();

  changeConnectionStatus("awaiting");
  setTimeout(() => {
    const id = "Face Landmarks";
    if (face.isOpen()) {
      changeConnectionStatus("connected");
      store.dispatch({
        type: "devices/create",
        payload: {
          id: id,
          metadata: {
            device: "Face",
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
