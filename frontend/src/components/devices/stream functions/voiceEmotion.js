import VoiceEmotion from '../../../utility/vEmotion';
import store from '../../../store/store';

export function connectVoiceEmotion(changeConnectionStatus) {
  window.open("/audiovideo/voiceEmotion/index.html?type=cats&label=emotion", "_blank", "popup");
  const bc = new BroadcastChannel('voice-emotion');
  const ve = new VoiceEmotion(bc);
  ve.initialize();

    changeConnectionStatus("awaiting");
    setTimeout(() => {
      const id = "Voice Emotion";
        if (ve.isOpen()) {
            changeConnectionStatus("connected");
            store.dispatch({
                type: "devices/create",
                payload: {
                id: id,
          metadata: {
            device: "Voice Emotion",
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