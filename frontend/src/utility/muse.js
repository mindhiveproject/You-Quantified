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
    this.muse.enablePpg = true; // Enable the PPG (please)

    this.id = this.muse.deviceName;
    this.connected = false;

    this.numberOfChannels = 3;
    const arrayLength = this.WINDOW_SIZE * this.sfreq;

    this.PPG_WINDOW_SIZE = 10;
    this.ppg_sfreq = 64;

    this.ppgBuffer = new Array(this.PPG_WINDOW_SIZE * this.ppg_sfreq).fill(0);

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
          // Fill the data analysis buffer
          this.dataArray.forEach((obj) => {
            this.buffer[obj.electrode].splice(0, obj.samples.length);
            this.buffer[obj.electrode].push(...obj.samples);
          });

          for (let i = 0; i < this.dataArray[0].samples.length; i++) {
            const dispatchData = this.dataArray.reduce((acc, data, index) => {
              const key = this.channelNames[data.electrode];
              acc[key] = data.samples[i];
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

          this.dataArray = [];
        }
      }
    });

    // Subscribe to PPG readings
    this.muse.ppgReadings.subscribe((ppgReading) => {
      if (this.connected) {
        if (ppgReading.ppgChannel === 2) {
          this.ppgBuffer.splice(0, ppgReading.samples.length);
          this.ppgBuffer.push(...ppgReading.samples);
          for (let i = 0; i < ppgReading.samples.length; i++) {
            store.dispatch({
              type: "devices/streamUpdate",
              payload: {
                id: this.id,
                data: {
                  PPG: ppgReading.samples[i],
                },
              },
            });
          }
        }
      }
    });

    this.startMetricStream(); // Existing EEG metrics stream
  }

  async _calculate_heart_rate() {
    const heartRate = this.getHeartRateFromPPG();
    console.log("Heart Rate");
    console.log(heartRate);
    store.dispatch({
      type: "devices/streamUpdate",
      payload: {
        id: this.id,
        data: { HR: heartRate },
      },
    });
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
        this._calculate_heart_rate();
      } else {
        clearInterval(this.metricStream);
      }
    }, 100);
  }

  getHeartRateFromPPG() {
    const coeffs = [
      -0.00588043, -0.00620177, -0.00106799, 0.02467073, 0.07864882, 0.15035629,
      0.21289894, 0.23779528, 0.21289894, 0.15035629, 0.07864882, 0.02467073,
      -0.00106799, -0.00620177, -0.00588043,
    ];

    const filteredSignal = applyFIRFilter(this.ppgBuffer, coeffs);
    const normalizedArray = normalizeArray(filteredSignal);
    console.log("Normalized array");
    console.log(normalizedArray);
    store.dispatch({
      type: "devices/streamUpdate",
      payload: {
        id: this.id,
        data: {
          "Normalized PPG": normalizedArray[normalizedArray.length-1],
        },
      },
    });
    const { waveform, peaksAmps, peaksLocs } = adaptiveThreshold(
      normalizedArray,
      this.ppg_sfreq
    );
    const currHR = calculateHeartRate(peaksLocs, this.ppg_sfreq);

    return currHR;
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

function applyFIRFilter(data, coeffs) {
  const filteredData = [];
  const order = coeffs.length;

  for (let i = 0; i < data.length; i++) {
    let acc = 0;
    for (let j = 0; j < order; j++) {
      if (i - j >= 0) {
        acc += coeffs[j] * data[i - j];
      }
    }
    filteredData.push(acc);
  }
  return filteredData;
}

// 1. Normalize Array Function
function normalizeArray(arr) {
  // Subtract the mean
  const meanVal = arr.reduce((a, b) => a + b, 0) / arr.length;
  const centered = arr.map((val) => val - meanVal);

  // Scale to [0, 1]
  const minVal = Math.min(...centered);
  const maxVal = Math.max(...centered);
  const range = maxVal - minVal || 1; // Avoid division by zero
  const normArr = centered.map((val) => (val - minVal) / range);

  return normArr;
}

function standardDeviation(values) {
  const mean = values.reduce((a, b) => a + b) / values.length;
  return Math.sqrt(
    values.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) /
      values.length
  );
}

function adaptiveThreshold(arr, sfreq) {
  const len = arr.length;
  const x = new Array(len).fill(0);
  x[0] = Math.max(...arr) * 0.2;
  const std = standardDeviation(arr);
  const peaksAmps = [];
  const peaksLocs = [];
  const refractoryPeriod = 0.2 * sfreq; // in samples

  for (let i = 1; i < len; i++) {
    x[i] =
      x[i - 1] -
      0.6 * Math.abs((peaksAmps[peaksAmps.length - 1] || 0 + std) / sfreq);

    if (arr[i] > x[i]) {
      x[i] = arr[i];
    } else {
      if (x[i - 1] === arr[i - 1]) {
        peaksAmps.push(x[i - 1]);
        peaksLocs.push(i - 1);
      }
    }
  }

  return { waveform: x, peaksAmps, peaksLocs };
}

function calculateHeartRate(peaksLocs, sfreq) {
  const heartRates = [];

  for (let i = 0; i < peaksLocs.length - 1; i++) {
    const timeDiff = (peaksLocs[i + 1] - peaksLocs[i]) / sfreq; // in seconds
    const bpm = (1 / timeDiff) * 60; // Convert to bpm
    heartRates.push(bpm);
  }

  return heartRates;
}

/*
Old code
function applyFIRFilter(signal, coeffs) {
  const output = new Array(signal.length).fill(0);

  for (let n = 0; n < signal.length; n++) {
    let filteredValue = 0;

    for (let k = 0; k < coeffs.length; k++) {
      if (n - k >= 0) {
        filteredValue += signal[n - k] * coeffs[k]; // Consistent order
      }
    }
    output[n] = filteredValue;
  }

  return output;
}

const average = (arr) => arr.reduce((a, b) => a + b) / arr.length;

function normalizeArray(arr) {
  // Calculate the average (mean) of the array
  let mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;

  // Subtract the mean from each element to center the data
  let centeredArray = arr.map((val) => val - mean);

  // Get the min and max of the centered array
  let minVal = Math.min(...centeredArray);
  let maxVal = Math.max(...centeredArray);

  // Normalize the values between 0 and 1
  let normalizedArray = centeredArray.map(
    (val) => (val - minVal) / (maxVal - minVal)
  );

  return normalizedArray;
}

function adaptiveThreshold(arr, sfreq) {
  let x = Array(arr.length).fill(0);
  x[0] = Math.max(...arr) * 0.2; // Initialize first value of x
  const std = mathStd(arr); // Ensure this function returns a valid standard deviation
  let peaksAmps = [];
  let peaksLocs = [];

  const refractoryPeriod = 0.6; // in seconds
  const refractoryPeriodSamples = refractoryPeriod * sfreq; // Convert to samples
  const epsilon = 1e-6; // for floating-point comparison

  for (let i = 1; i < arr.length; i++) {
    const lastPeakAmp = peaksAmps.length > 0 ? peaksAmps[peaksAmps.length - 1] : 0;

    x[i] = x[i - 1] - 0.6 * Math.abs((lastPeakAmp + std) / sfreq);

    if (arr[i] > x[i]) {
      x[i] = arr[i];
      if (peaksLocs.length > 0) {
        let peakDiff = i - peaksLocs[peaksLocs.length - 1];
        if (peakDiff < refractoryPeriodSamples) {
          // Within refractory period, do not detect as a new peak
          continue;
        }
      }
    } else {
      if (Math.abs(x[i - 1] - arr[i - 1]) < epsilon) {
        peaksAmps.push(x[i - 1]);
        peaksLocs.push(i - 1);
      }
    }
  }

  return { x, peaksAmps, peaksLocs };
}


function getHeartRateFromPeaks(peakLocs, ppgFs) {
  let heartRateMuseMoving = [0];

  for (let i = 0; i < peakLocs.length - 1; i++) {
    let heartRate = (ppgFs / (peakLocs[i + 1] - peakLocs[i])) * 60;
    heartRateMuseMoving.push(heartRate);
  }

  return average(heartRateMuseMoving);
}

// Custom standard deviation function
function mathStd(arr) {
  const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
  return Math.sqrt(
    arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length
  );
}
*/
