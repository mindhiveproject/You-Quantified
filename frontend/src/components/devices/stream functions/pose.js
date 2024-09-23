import Pose from "../../../utility/pose";
import store from "../../../store/store";


export function connectPose(changeConnectionStatus) {
    window.open("/audiovideo/pose/index.html", "_blank", "popup");
    const bc = new BroadcastChannel('pose-landmarks');
    const pose = new Pose(bc);
    pose.initialize();

    changeConnectionStatus("awaiting");
    setTimeout(() => {
        const id = "Pose Landmarks";
        if (pose.isOpen()) {
            changeConnectionStatus("connected");
            store.dispatch({
                type: "devices/create",
                payload: {
                id: id,
          metadata: {
            device: "Pose",
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