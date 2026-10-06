import store from "../store/store";

// How often the latest values are pushed into the store. Devices deliver
// samples far faster than a visual can use them (Muse: 256 Hz), and every
// dispatch re-renders the mapping UI, so only the newest sample per channel is
// kept between flushes.
const FLUSH_INTERVAL_MS = 33;

// Turns yq-data packets into the shape visuals map to: for each device key,
// `dataStream[key] = { <channel label>: <latest value> }`.
//
// `keyFor(packet)` says which store entry a packet belongs to. Most devices are
// one entry; LSL is one per stream, so each shows up as its own source in the
// mapping dropdown.
export class StoreBridge {
  constructor({ deviceName, keyFor }) {
    this.deviceName = deviceName;
    this.keyFor = keyFor;
    this.latest = new Map(); // key -> { label: value }
    this.dirty = new Set();
    this.timer = null;
  }

  // Store entries this bridge has created so far.
  get keys() {
    return [...this.latest.keys()];
  }

  // Registers an entry up front, so a device appears the moment it connects
  // rather than on its first packet.
  ensure(key, extraMeta = {}) {
    if (this.latest.has(key)) return;
    this.latest.set(key, {});
    store.dispatch({
      type: "devices/create",
      payload: {
        id: key,
        metadata: {
          device: this.deviceName,
          id: key,
          connected: true,
          ...extraMeta,
        },
      },
    });
  }

  handle(packet) {
    const key = this.keyFor(packet);
    this.ensure(key);
    const values = this.latest.get(key);

    const info = packet.metadata?.channelInfo;
    const channelCount = packet.metadata?.channelCount || info?.length || 1;
    const samples = Math.floor(packet.data.length / channelCount);
    if (samples === 0) return;

    if (packet.labels) {
      // Event markers: the label is the channel, the value is what was marked.
      packet.labels.forEach((label, i) => {
        if (label) values[label] = packet.data[i];
      });
    } else {
      const last = (samples - 1) * channelCount;
      for (let c = 0; c < channelCount; c += 1) {
        const value = packet.data[last + c];
        if (Number.isFinite(value)) {
          values[info?.[c]?.label ?? `channel ${c + 1}`] = value;
        }
      }
    }

    this.dirty.add(key);
    this.schedule();
  }

  schedule() {
    if (this.timer !== null) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush();
    }, FLUSH_INTERVAL_MS);
  }

  flush() {
    for (const key of this.dirty) {
      store.dispatch({
        type: "devices/streamUpdate",
        payload: { id: key, data: { ...this.latest.get(key) } },
      });
    }
    this.dirty.clear();
  }

  setMeta(field, data) {
    for (const key of this.latest.keys()) {
      store.dispatch({
        type: "devices/updateMetadata",
        payload: { id: key, field, data },
      });
    }
  }

  // Drops this device's entries from the store, for a deliberate disconnect.
  remove() {
    clearTimeout(this.timer);
    this.timer = null;
    this.dirty.clear();
    for (const key of this.latest.keys()) {
      store.dispatch({ type: "devices/remove", payload: { id: key } });
    }
    this.latest.clear();
  }
}
