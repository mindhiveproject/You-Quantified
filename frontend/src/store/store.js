import { configureStore } from "@reduxjs/toolkit";

const initialState = {
  params: {},
  dataStream: {},
  deviceMeta: {},
};


function initialParamState(name) {
  const stored = sessionStorage.getItem(`mapping_${name}`);
  let mapping = "Manual";
  let hasUserSelected = false;
  if (stored) {
    try {
      mapping = JSON.parse(stored);
      hasUserSelected = true;
    } catch (e) {
      // invalid data, ignore
    }
  }
  return { value: 0, mapping, range: [0, 1], hasUserSelected };
}

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

    case "params/sync": {
      const names = action.payload.map(({ name }) => name);
      const current = Object.keys(state.params);

      const unchanged =
        names.length === current.length &&
        names.every((name) => name in state.params);
      if (unchanged) return state;

      return {
        ...state,
        params: names.reduce((acc, name) => {
          acc[name] = state.params[name] ?? initialParamState(name);
          return acc;
        }, {}),
      };
    }

    case "params/updateMappings": {
      const paramName = action.payload.name;
      const newMapping = action.payload.mapping;
      const userSelected = action.payload.userSelected || false;

      if (userSelected) {
        sessionStorage.setItem(
          `mapping_${paramName}`,
          JSON.stringify(newMapping)
        );
      }

      return {
        ...state,
        params: {
          ...state.params,
          [paramName]: {
            ...state.params[paramName],
            mapping: newMapping,
            ...(userSelected ? { hasUserSelected: true } : {}),
          },
        },
      };
    }

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

    case "devices/remove": {
      const { [action.payload.id]: _meta, ...deviceMeta } = state.deviceMeta;
      const { [action.payload.id]: _data, ...dataStream } = state.dataStream;
      return { ...state, deviceMeta, dataStream };
    }

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
