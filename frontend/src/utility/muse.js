// Courtesy of https://github.com/urish/muse-js/tree/master/demo
// Works on Edge or Chrome - Versions post 2016

import { MuseClient } from "muse-js";
import store from "../store/store";
import { fft } from "mathjs";
import { PolynomialRegression } from "ml-regression-polynomial";

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
    this.BAND_POWERS_SFREQ = 10; // Band power sfreq in Hz
    this.HR_SFREQ = 1;
    this.sfreq = 256;
    this.muse = new MuseClient();
    this.muse.enablePpg = true; // Enable the PPG (please)

    this.id = this.muse.deviceName;
    this.connected = false;

    this.numberOfChannels = 4;
    const arrayLength = this.WINDOW_SIZE * this.sfreq;

    this.PPG_WINDOW_SIZE = 10;
    this.ppg_sfreq = 64;

    this.ppgBuffer = new Array(this.PPG_WINDOW_SIZE * this.ppg_sfreq).fill(0);

    this.buffer = new Array(this.numberOfChannels);
    for (let i = 0; i < this.numberOfChannels; i++) {
      this.buffer[i] = new Array(arrayLength).fill(0);
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
            sampling_rate: {
              EEG: this.sfreq,
              PPG: 64,
              "Band Powers": this.BAND_POWERS_SFREQ,
              HR: this.HR_SFREQ,
            },
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
    } catch (error) {
      throw new Error("Unable to connect to muse")
    }
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
                modality: "EEG",
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
                modality: "PPG",
              },
            });
          }
        }
      }
    });

    this.startMetricStream(); // Existing EEG metrics stream
  }

  async startMetricStream() {
    this.eegMetricStream = setInterval(() => {
      if (this.connected) {
        calculate_eeg_metrics(this.buffer, this.id);
        // this._calculate_heart_rate();
      } else {
        clearInterval(this.eegMetricStream);
      }
    }, (1 / this.BAND_POWERS_SFREQ) * 1000);
    this.ppgMetricStream = setInterval(() => {
      if (this.connected) {
        calculate_ppg_metrics(this.ppgBuffer, this.id);
        // this._calculate_heart_rate();
      } else {
        clearInterval(this.ppgMetricStream);
      }
    }, (1 / this.HR_SFREQ) * 1000);
  }
}

async function calculate_eeg_metrics(muse_eeg, deviceID) {
  const fs = 256;

  const avrg_bandpowers = {};
  const bandpowers = {
    Theta: [4, 8],
    Alpha: [8, 12],
    "Low beta": [12, 16],
    "High beta": [16, 25],
    Gamma: [25, 45],
  };

  for (let [channel, data] of Object.entries(muse_eeg)) {
    const data_mean = average(data);
    const centered_data = data.map((val) => val - data_mean);
    const sample = applyHammingWindow(centered_data); // Hamming window on the data
    const N = sample.length;

    const raw_fft = fft(sample);
    let psd = raw_fft.map((elem) =>
      Math.sqrt(elem.re * elem.re + elem.im * elem.im)
    ); // Get the magnitude
    psd = psd.slice(0, Math.floor(N / 2)); // Get first bins of Fourier Transform
    psd = psd.map((mag) => (2 * mag) / N); // Normalize FFT by sample length

    for (let [key, freq_range] of Object.entries(bandpowers)) {
      const idx_start = Math.floor((freq_range[0] * N) / fs);
      const idx_end = Math.floor((freq_range[1] * N) / fs);
      avrg_bandpowers[key] = avrg_bandpowers[key] ?? {};
      avrg_bandpowers[key][channel] = average(psd.slice(idx_start, idx_end));
    }
  }

  const avrg = {};

  for (let col in avrg_bandpowers) {
    const bandpowers_arr = Object.keys(avrg_bandpowers[col]).map((val) =>
      parseFloat(avrg_bandpowers[col][val])
    );
    avrg[col] = average(bandpowers_arr);
  }

  store.dispatch({
    type: "devices/streamUpdate",
    payload: {
      id: deviceID,
      data: avrg,
      modality: "Band Powers",
      // data: avrg_bandpowers["Alpha"]
    },
  });
}

async function calculate_ppg_metrics(muse_ppg, deviceID) {
  const coeffs = [
    -0.00588043, -0.00620177, -0.00106799, 0.02467073, 0.07864882, 0.15035629,
    0.21289894, 0.23779528, 0.21289894, 0.15035629, 0.07864882, 0.02467073,
    -0.00106799, -0.00620177, -0.00588043,
  ];

  const ppg_fs = 64;

  const ppg_time = [];
  const length = muse_ppg.length;
  for (let i = 0; i < length; i++) {
    ppg_time.push(i / ppg_fs);
  }

  const filtered_signal = filtfilt(coeffs, [1.0], muse_ppg);
  const normalized_signal = normalizeArray(filtered_signal, ppg_time);

  const {
    x: waveform,
    peaks_amps,
    peak_locs,
  } = adaptiveThreshold(normalized_signal, ppg_fs);

  const hr = getHeartRateFromPeaks(peak_locs, ppg_fs);

  store.dispatch({
    type: "devices/streamUpdate",
    payload: {
      id: deviceID,
      data: { HR: hr },
      modality: "HR",
    },
  });
}

const average = (arr) =>
  arr.reduce((a, b) => {
    const parsedA = parseFloat(a);
    const parsedB = parseFloat(b);

    // Handle cases where parseFloat returns NaN
    return (isNaN(parsedA) ? 0 : parsedA) + (isNaN(parsedB) ? 0 : parsedB);
  }, 0) / arr.length;

function applyHammingWindow(signal) {
  function hamm(i, N) {
    return 0.54 - 0.46 * Math.cos((Math.PI * 2 * i) / (N - 1));
  }

  const array = [];
  for (let i = 0; i < signal.length; i++) {
    array.push(signal[i] * hamm(i, signal.length));
  }

  return array;
}

// Implementation from: https://www.sciencedirect.com/science/article/pii/S0010482509001826
export function filtfilt(
  b,
  a,
  x,
  axis = -1,
  padtype = "odd",
  padlen = null,
  method = "pad",
  irlen = null
) {
  // Normalize the filter coefficients if a[0] is not 1
  if (a[0] !== 1) {
    b = b.map((coef) => coef / a[0]);
    a = a.map((coef) => coef / a[0]);
  }

  // Set default padlen if not provided
  if (padlen === null) {
    padlen = 3 * Math.max(a.length, b.length);
  }

  // Check that padlen is less than the length of x minus 1
  if (padlen >= x.length - 1) {
    throw new Error("padlen must be less than x.length - 1.");
  }

  // Handle padding based on padtype
  let x_padded;
  if (padlen > 0) {
    if (padtype === "odd") {
      const edge_left = x[0];
      const edge_right = x[x.length - 1];

      const pad_left_slice = x.slice(1, padlen + 1).reverse();
      const pad_left = pad_left_slice.map((value) => 2 * edge_left - value);

      const pad_right_slice = x
        .slice(x.length - padlen - 1, x.length - 1)
        .reverse();
      const pad_right = pad_right_slice.map((value) => 2 * edge_right - value);

      x_padded = pad_left.concat(x).concat(pad_right);
    } else if (padtype === "even") {
      // Implement even padding if needed
    } else if (padtype === "constant") {
      const pad_left = Array(padlen).fill(x[0]);
      const pad_right = Array(padlen).fill(x[x.length - 1]);
      x_padded = pad_left.concat(x).concat(pad_right);
    } else {
      throw new Error("padtype must be 'odd', 'even', or 'constant'.");
    }
  } else {
    x_padded = x.slice();
  }

  // Implement the filtering function
  function lfilter(b, a, x) {
    const y = new Array(x.length);
    const len = Math.max(a.length, b.length);
    const a_coeffs = a.slice(1);
    const b_coeffs = b.slice(1);

    for (let i = 0; i < x.length; i++) {
      y[i] = b[0] * x[i];
      for (let j = 0; j < b_coeffs.length; j++) {
        if (i - j - 1 >= 0) {
          y[i] += b_coeffs[j] * x[i - j - 1];
        }
      }
      for (let j = 0; j < a_coeffs.length; j++) {
        if (i - j - 1 >= 0) {
          y[i] -= a_coeffs[j] * y[i - j - 1];
        }
      }
    }
    return y;
  }

  // Forward filter
  let y = lfilter(b, a, x_padded);

  // Reverse the signal
  y = y.reverse();

  // Backward filter
  y = lfilter(b, a, y);

  // Reverse the signal again
  y = y.reverse();

  // Remove the padding
  const start = padlen;
  const end = y.length - padlen;
  const y_final = y.slice(start, end);

  return y_final;
}

export function normalizeArray(arr, time) {
  // Fit a degree-6 polynomial to the data
  const regression = new PolynomialRegression(time, arr, 6);

  // Evaluate the polynomial (trend) at each time point
  const trend = time.map((t) => regression.predict(t));

  // Subtract the trend from the original array to detrend the data
  const normArr = arr.map((val, idx) => val - trend[idx]);

  // Find the minimum and maximum of the detrended array
  const min = Math.min(...normArr);
  const max = Math.max(...normArr);

  // Normalize the detrended array to the range [0, 1]
  const normalizedArr = normArr.map((val) => (val - min) / (max - min));

  return normalizedArr;
}

export function adaptiveThreshold(arr, sfreq) {
  let x = new Array(arr.length).fill(0);
  x[0] = Math.max(...arr) * 0.2;
  let std = stdDev(arr);
  let peak_amps = [0];
  let peak_locs = [0];

  for (let i = 1; i < arr.length; i++) {
    x[i] =
      x[i - 1] -
      0.6 * Math.abs((peak_amps[peak_amps.length - 1] + std) / sfreq);
    if (arr[i] > x[i]) {
      if (peak_locs.length > 1) {
        const peak_diff =
          peak_locs[peak_amps.length - 2] - peak_locs[peak_amps.length - 1];
        let refractory_period = 0.6;
        if (peak_diff / sfreq < refractory_period) {
          x[i] = arr[i];
        }
      } else {
        x[i] = arr[i];
      }
    } else {
      if (x[i - 1] === arr[i - 1]) {
        peak_amps.push(x[i - 1]);
        peak_locs.push(i - 1);
      }
    }
  }
  return { x, peak_amps, peak_locs };
}

// Helper function to calculate standard deviation
function stdDev(arr) {
  const n = arr.length;
  const mean = arr.reduce((acc, val) => acc + val, 0) / n;
  const variance =
    arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  return Math.sqrt(variance);
}

export function getHeartRateFromPeaks(peakLocs, ppgFs) {
  let heartRateMuseMoving = [0];

  for (let i = 1; i < peakLocs.length - 1; i++) {
    let heartRate = ((peakLocs[i + 1] - peakLocs[i]) / ppgFs) * 60;
    heartRateMuseMoving.push(heartRate);
  }

  return Math.floor(average(heartRateMuseMoving));
}
