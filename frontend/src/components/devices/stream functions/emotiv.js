import CortexPower from "../../../utility/cortex";
import store from "../../../store/store";

export function connectEmotiv(changeConnectionStatus) {
  let socketUrl = "wss://localhost:6868";
  // this key does not inquire for EEG raw data
  let user = {
    license: process.env.REACT_APP_CORTEX_LICENSE,
    clientId: process.env.REACT_APP_CORTEX_CLIENT_ID,
    clientSecret: process.env.REACT_APP_CORTEX_CLIENT_SECRET,
    debit: 100,
  };

  const c = new CortexPower(user, socketUrl);
  c.sub(["pow", "eeg", "mot"]);

  changeConnectionStatus("awaiting");
  setTimeout(() => {
    const id = c.headsetId;
    if (c.sessionId !== undefined) {
      changeConnectionStatus("connected");
      store.dispatch({
        type: "devices/create",
        payload: {
          id: id,
          metadata: {
            device: "EMOTIV",
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
