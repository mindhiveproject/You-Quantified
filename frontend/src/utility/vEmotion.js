import store from "../store/store";

class VoiceEmotion {
  constructor(bc) {
    // create socket
    this.bc = bc;
  }

  async initialize() {
    this.bc.onmessage = (eventMessage) => {
      console.log(eventMessage.data);
      this.receiveData(eventMessage.data);
    };
  }

  receiveData(data) {
    const {
      valence: Valence,
      arousal: Arousal,
      H: Happiness,
      N: Neutral,
      A: Anger,
      S: Sadness,
    } = data;

    const newData = { Valence, Arousal, Happiness, Neutral, Anger, Sadness };

    store.dispatch({
      type: "devices/streamUpdate",
      payload: { id: "Voice Emotion", data: newData },
    });
  }

  isOpen() {
    return true;
  }
}

export default VoiceEmotion;
