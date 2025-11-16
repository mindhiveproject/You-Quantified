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

  let intervalRuns = 0;
  const intervalDuration = 1000; // 1 second
  const maxIntervalRuns = 5; // 5 seconds
  
  const connectionTimer = setInterval(() => {
    const id = c.headsetId;
    
    if (c.sessionId !== undefined) {
      changeConnectionStatus("connected");
      store.dispatch({
        type: "devices/create",
        payload: {
          id: id,
          metadata: {
            device: "EMOTIV",
            type: "eeg",
            id: id,
            connected: true,
          },
        },
      });
      clearInterval(connectionTimer);
    } else if (intervalRuns >= maxIntervalRuns) {
      changeConnectionStatus("failed");
      console.log("Failed EMOTIV Connection")
      console.log(c);
      clearInterval(connectionTimer);
    } else {
      intervalRuns++;
    }
  }, intervalDuration);
}
