import { createSelector } from "reselect";

export const selectDataMappings = createSelector(
  [(state) => state.params],
  (data) => {
    return Object.keys(data).reduce((acc, obj) => {
      acc[obj] = data[obj].mapping;
      return acc;
    }, {});
  }
);

export const getDataStreamKeys = createSelector(
  [(state) => state.dataStream],
  (dataStreamObject) => {
    const returnItems = [];
    for (const valor in dataStreamObject) {
      let newObj = {};
      newObj["device"] = valor;
      newObj["data"] = Object.keys(dataStreamObject[valor]);
      returnItems.push(newObj);
    }
    return returnItems;
  }
);

export const selectParamValues = createSelector(
  [(state) => state.params],
  (data) => {
    return Object.keys(data).reduce((acc, obj) => {
      acc[obj] = data[obj].value;
      return acc;
    }, {});
  }
);
