import AudioRMS from '../../../utility/rms';
import store from '../../../store/store';

export function connectAudioRMS(changeConnectionStatus) {
  window.open("/audiovideo/rms/index.html", "_blank", "popup");
  const bc = new BroadcastChannel('audio-rms');
  const rms = new AudioRMS(bc);
  rms.initialize();

    changeConnectionStatus("awaiting");
    setTimeout(() => {
      const id = "Audio Volume";
        if (rms.isOpen()) {
            changeConnectionStatus("connected");
            store.dispatch({
                type: "devices/create",
                payload: {
                id: id,
          metadata: {
            device: "Audio Volume",
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