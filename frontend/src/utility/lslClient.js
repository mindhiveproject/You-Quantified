import store from "../store/store";

class LSLReceiver {
  /*
    Channel Format Types
    0: 'undefined',
    1: 'float32',
    2: 'double64',
    3: 'string',
    4: 'int32',
    5: 'int16',
    6: 'int8',
    7: 'int64'
  */

  constructor() {
    this.isConnected = false;
    this.isStreaming = false;
    this.metadata = {}; // Now an object mapping stream keys to metadata
    this._parse = this._parse.bind(this); // Bind the _parse method
    this._dispatchData = this._dispatchData.bind(this);
    this.dataBuffer = {};
    this.isDispatchScheduled = false;
  }

  connect(socketUrl, onConnect) {
    if (this.isConnected) {
      console.log("There is already a socket connection");
      return;
    }

    this.socket = new WebSocket(socketUrl);

    // Listener functions
    this.socket.onopen = () => {
      this.isConnected = true;
      onConnect();
      this.stream();

      // In case I stream async
      // this._startDataStream();
    };

    this.socket.onclose = (event) => {
      console.log("WebSocket closed:", event);
      this.stop();
    };

    this.socket.onerror = (event) => {
      console.log("WebSocket error:", event);
      this.stop();
    };
  }

  stream() {
    if (!this.isConnected) {
      console.log("WebSocket not connected");
      return;
    }
    this.socket.addEventListener("message", this._parse);
  }

  // Function that handles incoming messages
  _parse(event) {
    const message = event.data;
    const rawData = JSON.parse(message);
    console.log(rawData);

    // Iterate over all streams in the rawData
    for (const streamKey of Object.keys(rawData)) {
      const data = rawData[streamKey];

      // Initialize metadata for the stream if not already done
      if (!this.metadata[streamKey]) {
        if ("info" in data) {
          const info = data.info;
          if ([1, 2, 4, 5, 6].includes(info.channel_format)) {

            /*
            Stream ID in case I want unique devices for each source type

            const sourceIDs = Object.keys(rawData).map((curr) => {
              return rawData[curr]?.info?.source_id;
            });
            const repeatedSourceIDs = sourceIDs.filter(
              (ids) => ids === info?.source_id
            );
            const streamId =
              repeatedSourceIDs.length > 1
                ? info?.source_id + " - " + info?.type
                : info?.source_id;
            */


            const streamId =
              info?.source_id ||
              info?.type ||
              streamKey;

            // Store metadata for this stream
            this.metadata[streamKey] = {
              id: streamId,
              info: info,
            };

            // Dispatch an action to create the device
            store.dispatch({
              type: "devices/create",
              payload: {
                id: streamId,
                metadata: {
                  device: "LSL",
                  connected: true,
                  id: streamId,
                  info: info,
                  // "sampling rate": info.nominal_srate,
                  // type: info.type || "custom",
                },
              },
            });
          } else {
            console.log(
              `The LSL stream '${streamKey}' data type cannot be handled by this app.`
            );
            // Optionally, remove this stream from processing
            continue;
          }
        } else {
          console.log(`Data info is missing for stream '${streamKey}'.`);
          // Optionally, remove this stream from processing
          continue;
        }
        // Proceed to the next stream after initializing metadata
        continue;
      }

      // Process and dispatch data for this stream
      const metadata = this.metadata[streamKey];
      const res = {};

      // Assuming data.timeseries is an array of numbers (one per channel)
      if (metadata.info.channel_count > 1) {
        for (let i = 0; i < metadata.info.channel_count; i++) {
          const val = data.timeseries[i];
          res[streamKey + " channel " + (i + 1)] = val;
        }
      } else {
        res[streamKey] = data.timeseries[0];
      }

      // Include the timestamp
      res["LSL Timestamp"] = data.timestamp;

      // Buffer the data
      // this.dataBuffer[metadata.id] = res;

      store.dispatch({
        type: "devices/streamUpdate",
        payload: {
          id: metadata.id,
          data: res,
        },
      });
    }
  }

  async _startDataStream() {
    this.dataDispatch = setInterval(() => {
      if (this.isConnected) {
        this._dispatchData();
        // this._calculate_heart_rate();
      } else {
        clearInterval(this.dataDispatch);
      }
    }, 50);
  }

  _dispatchData() {
    for (const id in this.dataBuffer) {
      const data = this.dataBuffer[id];
      // Dispatch the data to the Redux store
      store.dispatch({
        type: "devices/streamUpdate",
        payload: {
          id: id,
          data: data,
        },
      });
    }
    // Clear the buffer
    this.dataBuffer = {};
  }

  stop() {
    if (!this.isConnected) {
      return;
    }
    console.log("Closing WebSocket connection");
    this.socket.removeEventListener("message", this._parse);
    this.socket.close(1000);
    this.socket = null;
    this.isConnected = false;

    // Update the connected status for each stream
    for (const streamKey of Object.keys(this.metadata)) {
      const metadata = this.metadata[streamKey];
      if (metadata.id) {
        store.dispatch({
          type: "devices/updateMetadata",
          payload: {
            id: metadata.id,
            field: "connected",
            data: this.isConnected,
          },
        });
      }
    }
  }
}

export default LSLReceiver;
