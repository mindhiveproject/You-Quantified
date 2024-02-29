// Courtesy of https://github.com/urish/muse-js/tree/master/demo
// Works on Edge or Chrome - Versions post 2016

import { MuseClient } from "muse-js";
import store from "../store/store";
import * as math from "mathjs";

export class MuseDevice {
  channelNames = {
    0: "TP9",
    1: "AF7",
    2: "AF8",
    3: "TP10",
  };

  // Change if you want electrodes to have different weights in the power calculation
  electrodePowerWeights = [1, 1, 1, 1];

  // Band powers of EEG. The last index is written inclusively to use all powers less than the last index.
  bandPowers = {
    Theta: [4, 8],
    Alpha: [8, 12],
    "Low beta": [12, 16],
    "High beta": [16, 25],
    Gamma: [25, 45],
  };

  constructor() {
    this.connected = false;
    this.dataArray = [];
    this.WINDOW_SIZE = 2;
    this.sfreq = 256;
    this.muse = new MuseClient();
    this.id = this.muse.deviceName;
    this.connected = false;

    this.numberOfChannels = 3;
    const arrayLength = this.WINDOW_SIZE * this.sfreq;

    this.buffer = new Array(this.numberOfChannels);
    for (let i = 0; i <= this.numberOfChannels; i++) {
      this.buffer[i] = new Array(arrayLength).fill(0);
    }

    for (const key in this.bandPowers) {
      this.bandPowers[key] = [
        this.bandPowers[key][0] * this.WINDOW_SIZE,
        this.bandPowers[key][1] * this.WINDOW_SIZE - 1,
      ];
    }
  }

  async connect() {
    try {
      await this.muse.connect();
      this.id = this.muse.deviceName;
      this.connected = true;
      store.dispatch({
        type: "devices/create",
        payload: {
          id: this.id,
          metadata: {
            device: "Muse",
            connected: true,
            id: this.id,
            type: "default",
          },
        },
      });

      this.muse.connectionStatus.subscribe((status) => {
        this.connected = status;
        store.dispatch({
          type: "devices/updateMetadata",
          payload: {
            id: this.id,
            field: "connected",
            data: status,
          },
        });
      });

      const info = await this.muse.deviceInfo();
      console.log(info);
    } catch (error) {}
  }

  async stream() {
    this.muse.start();
    this.muse.eegReadings.subscribe((reading) => {
      if (this.connected) {
        this.dataArray.push(reading);
        if (this.dataArray.length == 4) {
          /*
                      const dispatchData = this.dataArray.reduce((acc, obj) => {
                          const sum = obj.samples.reduce((a, b) => a + b, 0);
                          const avg = (sum / obj.samples.length) || 0;
                          acc[this.channelNames[obj.electrode]] = avg;
                          return acc
                      }, {})
                      store.dispatch({
                          type: 'devices/streamUpdate',
                          payload: {
                              id: this.id,
                              data: dispatchData
                          }
                      })*/

          for (let i = 0; i < this.dataArray[0].samples.length; i++) {
            const dispatchDataArray = this.dataArray.map((data, index) => ({
              [this.channelNames[data.electrode]]: data.samples[i],
            }));

            const dispatchData = dispatchDataArray.reduce((acc, data) => {
              acc[Object.keys(data)[0]] = data[Object.keys(data)[0]];
              return acc;
            }, {});
            store.dispatch({
              type: "devices/streamUpdate",
              payload: {
                id: this.id,
                data: dispatchData,
              },
            });
          }

          // Fill the data analysis buffer
          this.dataArray.forEach((obj) => {
            this.buffer[obj.electrode].splice(0, obj.samples.length);
            this.buffer[obj.electrode].push(...obj.samples);
          });

          this.dataArray = [];
        }
      }
    });
    this.startMetricStream();
  }

  async _calculate_eeg_metrics() {
    const res = Object.keys(this.bandPowers).reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});

    for (let i = 0; i < this.numberOfChannels; i++) {
      let sample = this.buffer[i];
      sample = applyHanningWindow(sample); // Hanning window on the data

      const fft = math.fft(sample);
      let mag = fft.map((elem) =>
        math.sqrt(elem.re * elem.re + elem.im * elem.im)
      ); // Get the magnitude
      mag = mag.splice(0, Math.floor(sample.length / 2)); // Get first bins of Fourier Transform
      mag = mag.map((mag) => mag / sample.length); // Normalize FFT by sample length

      for (const key in this.bandPowers) {
        res[key] =
          res[key] +
          this.electrodePowerWeights[i] *
            math.mean(
              mag.slice(this.bandPowers[key][0], this.bandPowers[key][1])
            );
      }
    }

    for (const key in res) {
      res[key] = res[key] / this.numberOfChannels;
    }

    store.dispatch({
      type: "devices/streamUpdate",
      payload: {
        id: this.id,
        data: res,
      },
    });
  }

  async startMetricStream() {
    this.metricStream = setInterval(() => {
      if (this.connected) {
        this._calculate_eeg_metrics();
      } else {
        clearInterval(this.metricStream);
      }
    }, 50);
  }
}

function applyHanningWindow(signal) {
  function hann(i, N) {
    return 0.5 * (1 - Math.cos((6.283185307179586 * i) / (N - 1)));
  }

  const array = [];
  for (let i = 0; i < signal.length; i++) {
    array.push(signal[i] * hann(i, signal.length));
  }
  return array;
}
