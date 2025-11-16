import { MuseDevice } from "../../../utility/muse";

export async function connectMuse(changeConnectionStatus) {
  const muse = new MuseDevice();
  changeConnectionStatus("awaiting")
  try {
    await muse.connect();
  } catch (e) {
    console.log(e)
    changeConnectionStatus("failed");
  }

  if (muse.connected) {
    muse.stream();
    changeConnectionStatus("connected");
  } else {
    changeConnectionStatus("failed");
  }
}
