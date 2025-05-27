import store from "../store/store";
import devicesRaw from '../metadata/devices.json';

export class UploadedFile {
    buffer_num = 0;
    looping = false;
    playing = false;
  
    constructor(file, device, id, sampling_rate) {
      this.file = file;
      this.device = device;
      this.id = id;
      this.sampling_rate =
        sampling_rate || devicesRaw.find(({ heading }) => heading === device)?.sampling_rate;
        
      console.log("Device", this.device);
      console.log("Sampling rate", this.sampling_rate);

      store.dispatch({
        type: "devices/create",
        payload: {
          id: this.id,
          metadata: {
            device: this.device,
            id: this.id,
            "sampling_rate": this.sampling_rate,
            connected: true,
            playing: false,
            looping: false,
          },
        },
      });
    }
  
    startPlayback() {
      this.playing = true;
      store.dispatch({
        type: "devices/updateMetadata",
        payload: {
          id: this.id,
          field: "playing",
          data: this.playing,
        },
      });
  
      this.streamRecorder = setInterval(() => {
        store.dispatch({
          type: "devices/streamUpdate",
          payload: {
            id: this.id,
            data: this.file[this.buffer_num],
          },
        });
  
        this.buffer_num++;
  
        if (this.buffer_num > this.file.length - 1) {
          if (!this.looping) {
            this.pausePlayback();
          }
          this.buffer_num = 0;
        }
      }, 1000 / this.sampling_rate);
    }
  
    pausePlayback() {
      if (this.playing) {
        clearInterval(this.streamRecorder);
        this.playing = false;
        store.dispatch({
          type: "devices/updateMetadata",
          payload: {
            id: this.id,
            field: "playing",
            data: this.playing,
          },
        });
      }
    }
  
    loopPlayback() {
      this.looping = !this.looping;
      store.dispatch({
        type: "devices/updateMetadata",
        payload: {
          id: this.id,
          field: "looping",
          data: this.looping,
        },
      });
    }
  
    restartPlayback() {
      this.buffer_num = 0;
      if (this.playing) {
        this.pausePlayback();
      }
    }
  }
  