import React, { useState, useRef } from "react";
import Papa from "papaparse";
import devicesRaw from "../../../metadata/devices";
import { useDispatch, useSelector } from "react-redux";

import Modal from "react-bootstrap/Modal";
import store from "../../../store/store";
import { createSelector } from "reselect";

const getDataIDs = createSelector(
  [(state) => state.deviceMeta],
  (deviceMeta) => {
    return Object.keys(deviceMeta).filter(
      (name) => "playing" in deviceMeta[name]
    );
  }
);

window.recordings = {};

export function FileUploader({ setCurrentScreen }) {
  const dispatch = useDispatch();
  const prevRecordIDs = useSelector(getDataIDs);
  const [recordingDevice, setRecordingDevice] = useState("");
  const [successText, setSuccessText] = useState("");
  const [id, setID] = useState(() => {
    const rec = prevRecordIDs.length;
    if (rec != 0) {
      return "Pre-recorded " + (rec + 1);
    } else {
      return "Pre-recorded";
    }
  });

  async function uploadFile(e) {
    if (recordingDevice === "") {
      setSuccessText("You must first specify the device, please try again");
      return;
    }

    const form = e.currentTarget;
    const [file] = await form.files;

    // If I were working with a server, I could post the files to a URL
    // The current solution is to save them into session storage
    // The limitation is that this limits the size of session storage
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        // results.data - contains the uploaded file output
        window.recordings[id] = new UploadedFile(
          results.data,
          recordingDevice,
          id
        );
        dispatch({
          type: "devices/create",
          payload: {
            id: id,
            metadata: {
              device: recordingDevice,
              playing: false,
              looping: false,
            },
          },
        });
        setSuccessText("Uploaded!");
      },
      error: (error) => {
        setSuccessText(
          "There was an error with the file you uploaded, please try again."
        );
        console.log(error);
      },
    });
  }

  const successTextStyle =
    successText !== "Uploaded!" ? "text-warning" : "text-success";

  const deviceList = ["EMOTIV"];
  const dropdownMenu = deviceList.map((item) => (
    <option value={item} key={item}>
      {item}
    </option>
  ));

  function nameDevice(e) {
    const regex = /[!@#$%^&*+{}\[\]:;<>,.?~\\|\/\="']/g;
    const string = e.target.value.replace(regex, "");
    e.target.value = string;
    setID(string);
  }

  return (
    <div className="mt-5 w-50">
      <button
        className="btn btn-link text-decoration-none fw-medium mb-0"
        onClick={() => setCurrentScreen("new")}
      >
        <i className="bi bi-arrow-left-short"></i>New device
      </button>
      <h2>
        <input
          type="text"
          className="h4 m-0 invisible-input"
          placeholder="Pre-recorded device"
          onBlur={nameDevice}
        ></input>
      </h2>
      <div>
        Upload the recorded file from your computer. It is important that you
        specify the device that was used to record that file.
        <div className="row mt-3">
          <div className="col-4">
            <select
              className="form-select"
              defaultValue=""
              onChange={(e) => setRecordingDevice(e.target.value)}
            >
              <option value="">Choose the device</option>
              {dropdownMenu}
            </select>
          </div>
          <div className="input-group col">
            <input
              type="file"
              className="form-control"
              id="inputUpload"
              accept="text/csv"
              onChange={uploadFile}
              disabled={recordingDevice === ""}
            />
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-between">
        <p className={successTextStyle}>{successText}</p>
      </div>
    </div>
  );
}

class UploadedFile {
  buffer_num = 0;
  looping = false;
  playing = false;

  constructor(file, device, id) {
    this.file = file;
    this.device = device;
    this.id = id;
    this.sampling_rate = devicesRaw.find(
      ({ heading }) => heading === device
    ).sampling_rate;
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
