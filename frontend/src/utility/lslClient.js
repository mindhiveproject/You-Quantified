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

  // The constructor could contain the option to parse timestamps for accurate synchrony
  constructor() {
    this.isStreaming = false;
    this.metadata = false;
  }

  connect(socketUrl, onConnect) {
    if (this.isConnected) {
      console.log("There is already a socket connection");
      return;
    }

    this.socket = new WebSocket(socketUrl);

    // Some listener functions
    this.socket.onopen = () => {
      this.isConnected = true;
      onConnect();
      this.stream(); // Only for debugging and testing
    };

    this.socket.onclose = this.stop;
    this.socket.onerror = (event) => {
      console.log(event);
      this.stop();
    };
  }

  stream() {
    if (!this.isConnected) {
      console.log("Websocket not connected");
      return;
    }
    this.socket.addEventListener("message", this._parse);
  }

  // Function that actually manages the message
  _parse(message) {
    const rawData = JSON.parse(message.data);
    const data = rawData[Object.keys(rawData)[0]];
    
    // Set metadata on first message
    if (!this.metadata?.id) {
      if ("info" in data) {
        this.metadata = data.info;
        if ([1, 2, 4, 5, 6].includes(data.info.ch_format)) {
          this.metadata.id =
            typeof data.info?.source_id == "undefined"
              ? data.info.type
              : data.info.source_id;
          console.log(this.metadata.id);
          store.dispatch({
            type: "devices/create",
            payload: {
              id: this.metadata.id,
              metadata: {
                device: "LSL",
                connected: true,
                id: this.metadata.id,
                info: this.metadata,
                type: "custom",
              },
            },
          });
        } else {
          console.log(
            "The LSL stream's data type cannot be handled by this app."
          );
        }
      } else {
        if (this.socket) {
          this.socket.stop();
        }
      }
      return;
    }
    // Dispatching logic for most messages, after metadata was created

    const res = {};
    for (var i = 0; i < this.metadata.ch_count; i++) {
      const val = data.timeseries[i][data.timeseries.length - 1] || data.timeseries[data.timeseries.length - 1];
      res["Channel " + (i + 1)] = val;
    }

    store.dispatch({
      type: "devices/streamUpdate",
      payload: {
        id: this.metadata.id,
        data: res,
      },
    });
  }

  stop(event) {
    if (!this.isConnected) {
      return;
    }
    console.log("Closing websocket");
    this.socket.removeEventListener("message", this._parse);
    this.socket.close(1000);
    this.isConnected = false;
    store.dispatch({
      type: "devices/updateMetadata",
      payload: {
        id: this.metadata.id,
        field: "connected",
        data: this.isConnected,
      },
    });
  }
}

const average = (array) => array.reduce((a, b) => a + b) / array.length;

export default LSLReceiver;
