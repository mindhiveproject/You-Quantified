import store from "../../../store/store";

export class EventMarkerStream {
  constructor(visID) {
    this.eventReceived = false;
    this.id = "event_markers_" + visID;
  }

  streamEventMarkers(message) {
    if (!this.eventReceived) {
      this._createEventMarkers();
      this.eventReceived = true;
    }
    this._sendEventMarker(message);
  }

  _createEventMarkers() {
    store.dispatch({
      type: "devices/create",
      payload: {
        id: this.id,
        metadata: {
          device: "Event Markers",
          type: "event marker",
          id: this.id,
          connected: true,
        },
      },
    });
  }

  _sendEventMarker(message) {
    const data = JSON.parse(message.data);

    store.dispatch({
      type: "devices/streamUpdate",
      payload: {
        id: this.id,
        data,
      },
    });
  }

  unmountEventMarkers() {
    store.dispatch({
      type: "devices/updateMetadata",
      payload: {
        id: this.id,
        field: "connected",
        data: false,
      },
    });
  }
}
