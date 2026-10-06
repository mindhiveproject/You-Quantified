import { deviceRuntime } from "../../../devices/runtime";

// A visual's `sendEvent({ data: '{"key": 1}' })` becomes markers: each key of
// the payload is a label, its value what was marked. A payload that isn't an
// object is marked as a single label.
function toMarks(message) {
  let payload = message?.data ?? message;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return [[payload, undefined]];
    }
  }
  if (payload && typeof payload === "object") {
    return Object.entries(payload).map(([label, value]) => [label, Number(value)]);
  }
  return [[String(payload), undefined]];
}

// The channel between one running visual and the marker stream in the runtime.
export class EventMarkerStream {
  constructor(visID) {
    this.visID = visID;
  }

  streamEventMarkers(message) {
    deviceRuntime.mark(this.visID, toMarks(message));
  }

  unmountEventMarkers() {
    deviceRuntime.closeMarkers(this.visID);
  }
}
