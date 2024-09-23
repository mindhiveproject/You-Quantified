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
    
    // PPG Heart rate
    this.muse.enablePpg = true; // Enable the PPG (please)
    this.ppgBuffer = [];
    this.bufferSize = 512; // 8 sec buffer
    this.ppgDataArray = []; // store PPG readings

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

    // EEG readings
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

    // Subscribe to PPG readings
    this.muse.ppgReadings.subscribe((ppgReading) => {
      if (this.connected) {
        this.ppgBuffer.push(...ppgReading.samples);

        if (this.ppgBuffer.length > this.bufferSize) {
          this.ppgBuffer = this.ppgBuffer.slice(-this.bufferSize);
        }

        if (this.ppgBuffer.length >= this.bufferSize) {
          const heartRate = this._calculateHeartRate(this.ppgBuffer);

          store.dispatch({
            type: "devices/streamUpdate",
            payload: {
              id: this.id,
              data: { heartRate },
            },
          });

          // Use a sliding window approach instead of clearing the buffer
          this.ppgBuffer = this.ppgBuffer.slice(-this.bufferSize / 2);
        }
      }
    });

    this.startMetricStream();  // Existing EEG metrics stream
  }
  
  _calculateHeartRate(ppgBuffer) {
    // console.log("ppgBuffer", ppgBuffer);
    // const ppgSamples = ppgBuffer.flatMap((data) => data.samples);
    // console.log("ppgSamples", ppgSamples);
    const heartRate = getHeartRateFromPPG(ppgBuffer);
    console.log("heartRate", heartRate);
    return heartRate;
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
        // Reconsider the addition of res[key]
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

function getHeartRateFromPPG(ppgSamples) {
  const smoothedSignal = smoothSignal(ppgSamples);
  const peaks = detectPeaks(smoothedSignal);
  const rrIntervals = calculateRRIntervals(peaks);
  const heartRate = calculateBPM(rrIntervals);
  console.log("rrIntervals", rrIntervals)
  return heartRate;
}

function smoothSignal(signal, smoothingFactor = 3) {
  const smoothedSignal = [];
  for (let i = 0; i < signal.length; i++) {
    const start = Math.max(0, i - smoothingFactor);
    const end = Math.min(signal.length, i + smoothingFactor);
    const window = signal.slice(start, end);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    smoothedSignal.push(average);
  }
  // console.log(smoothedSignal)
  return smoothedSignal;
}

function detectPeaks(signal, thresholdRatio = 0.6, windowSize = 10) {
  const maxSignalValue = Math.max(...signal);
  const threshold = maxSignalValue * thresholdRatio;

  const peaks = [];
  for (let i = windowSize; i < signal.length - windowSize; i++) {
    const window = signal.slice(i - windowSize, i + windowSize + 1);
    const isPeak = signal[i] > threshold && signal[i] === Math.max(...window);

    if (isPeak) {
      peaks.push(i);
      // Move i forward to avoid detecting the same peak in overlapping windows
      i += windowSize; 
    }
  }

  console.log('Signal:', signal);
  console.log('Peaks:', peaks);
  return peaks;
}


function calculateRRIntervals(peaks) {
  const rrIntervals = [];
  for (let i = 1; i < peaks.length; i++) {
    rrIntervals.push(peaks[i] - peaks[i - 1]);
  }
  return rrIntervals;
}

function calculateBPM(rrIntervals, samplingRate = 64) {
  const averageRRInterval = rrIntervals.reduce((sum, val) => sum + val, 0) / rrIntervals.length;
  return Math.round((60 * samplingRate) / averageRRInterval);
}
