import { configureStore } from "@reduxjs/toolkit";

const initialState = {
  params: {},
  dataStream: {},
  deviceMeta: {},
  update: { type: "none" },
};

// React Redux Store to manage the data that moves throghout the entire app
function rootReducer(state = initialState, action) {
  switch (action.type) {
    case "params/update":
      // Logic to handle parameter updates
      return {
        ...state,
        params: {
          ...state.params,
          [action.payload.name]: {
            ...state.params[action.payload.name],
            value: action.payload.value,
          },
        },
      };

    case "params/load":
      // Logic to handle initializing parameters

      let loadedParams = action.payload.reduce((acc, obj) => {
        acc[obj.name] = { value: 0, mapping: "Manual", range: [0, 1] };
        return acc;
      }, {});

      return {
        ...state,
        params: loadedParams,
      };

    case "params/updateMappings":
      return {
        ...state,
        params: {
          ...state.params,
          [action.payload.name]: {
            ...state.params[action.payload.name],
            mapping: action.payload.mapping,
          },
        },
      };

    case "params/create":
      return {
        ...state,
        params: {
          ...state.params,
          [action.payload.name]: {
            value: 0,
            mapping: "Manual",
            range: [0, 1],
          },
        },
      };

    case "params/updateRange":
      return {
        ...state,
        params: {
          ...state.params,
          [action.payload.name]: {
            ...state.params[action.payload.name],
            range: action.payload.range,
          },
        },
      };

    case "devices/create":
      // Logic to handle creation of a new device
      return {
        ...state,
        deviceMeta: {
          ...state.deviceMeta,
          [action.payload.id]: action.payload.metadata,
        },
        dataStream: {
          ...state.dataStream,
          [action.payload.id]: {},
        },
      };

    case "devices/updateMetadata":
      // This logic is especially useful in a device that may disconnect like the emotiv
      // It is also useful for handling pre-recorded files

      return {
        ...state,
        deviceMeta: {
          ...state.deviceMeta,
          [action.payload.id]: {
            ...state.deviceMeta[action.payload.id],
            [action.payload.field]: action.payload.data,
          },
        },
      };

    case "devices/streamUpdate":
      // Logic to handle device stream updates

      return {
        ...state,
        update: { type: "stream", device: action.payload.id, modality: action.payload?.modality || 'device' },
        dataStream: {
          ...state.dataStream,
          [action.payload.id]: {
            ...action.payload.data,
            timestamp: Date.now(),
          },
        },
      };

    default:
      return state;
  }
}

const store = configureStore({ reducer: rootReducer });

export default store;
