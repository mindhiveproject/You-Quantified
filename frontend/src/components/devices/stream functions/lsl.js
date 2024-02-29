import LSLReceiver from "../../../utility/lslClient";

export async function connectLSL(changeConnectionStatus) {
  const lslClient = new LSLReceiver();

  changeConnectionStatus("awaiting");

  lslClient.connect("ws://localhost:8333", () =>
    changeConnectionStatus("connected")
  );

  window.addEventListener("beforeunload", () => {
    lslClient.stop();
  });

  setTimeout(function () {
    if (!lslClient.isConnected) {
      changeConnectionStatus("failed");
    }
  }, 1000);
}
