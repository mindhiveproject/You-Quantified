import VHeartRate from '../../../utility/vheartrate';
import store from '../../../store/store';

export function connectVHeartRate(changeConnectionStatus) {
  window.open("/audiovideo/heartrate/index.html", "_blank", "popup");
  const bc = new BroadcastChannel('video-heart-rate');
  const vhr = new VHeartRate(bc);
  vhr.initialize();

    changeConnectionStatus("awaiting");
    setTimeout(() => {
      const id = "Video Heart Rate";
        if (vhr.isOpen()) {
            changeConnectionStatus("connected");
            store.dispatch({
                type: "devices/create",
                payload: {
                id: id,
          metadata: {
            device: "VideoHeartRate",
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