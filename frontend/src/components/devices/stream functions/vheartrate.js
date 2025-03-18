import VHeartRate from "../../../utility/vheartrate";
import store from "../../../store/store";

export function connectVHeartRate(changeConnectionStatus) {
  var popup = window.open(
    "/audiovideo/heartrate/index.html",
    "_blank",
    "popup"
  );

  var popupCheckInterval = setInterval(() => {
    if (popup.closed) {
      store.dispatch({
        type: "devices/updateMetadata",
        payload: {
          id: "Video Heart Rate",
          field: "connected",
          data: false,
        },
      });
      clearInterval(popupCheckInterval); // Stop checking once closed
    }
  }, 1000); // Check every 1000ms

  window.onbeforeunload = function () {
    if (popup && !popup.closed) {
      popup.close();
    }
  };

  const bc = new BroadcastChannel("video-heart-rate");
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
            device: "Video Heart Rate",
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
