import store from "../../../store/store";

export function connectVideoEmotion(changeConnectionStatus) {
  const newWindow = window.open(
    "/audiovideo/videoEmotion/index.html",
    "_blank",
    "popup"
  );

  const id = "Face Emotion";

  store.dispatch({
    type: "devices/create",
    payload: {
      id: id,
      metadata: {
        device: "Video Emotion",
        type: "default",
        id: id,
        connected: true,
      },
    },
  });

  var newWindowCheckInterval = setInterval(() => {
    if (newWindow.closed) {
      store.dispatch({
        type: "devices/updateMetadata",
        payload: {
          id: id,
          field: "connected",
          data: false,
        },
      });
      clearInterval(newWindowCheckInterval);
    }
  }, 1000);

  changeConnectionStatus("awaiting");
  const bc = new BroadcastChannel("face-emotion");

  bc.onmessage = (eventMessage) => {
    const rawData = JSON.parse(eventMessage.data);
    const expressionData = rawData?.expressions[0]?.expressions;
    store.dispatch({
      type: "devices/streamUpdate",
      payload: {
        id: id,
        data: expressionData,
      },
    });
  };

  changeConnectionStatus("connected");


  window.onbeforeunload = () => {
    if (newWindow && !newWindow.closed) {
      newWindow.close();
    }
  };
}
