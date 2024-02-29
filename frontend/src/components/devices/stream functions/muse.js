import { MuseDevice } from "../../../utility/muse";

export async function connectMuse(changeConnectionStatus) {
  const muse = new MuseDevice();
  changeConnectionStatus("awaiting")
  await muse.connect();

  if (muse.connected) {
    muse.stream();
    changeConnectionStatus("connected");
  } else {
    changeConnectionStatus("failed");
  }
}
