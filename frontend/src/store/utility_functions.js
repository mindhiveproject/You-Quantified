// Map the value to the range 0 to 1
export function normalizeValue(value, min, max) {
  return (value - min) / (max - min);
}


// Function to update the values of the parameters in session storage & store
export function updateWithLocalStorage(state, action, mode) {
  const prevMappings = JSON.parse(sessionStorage.getItem("paramsMeta"));

  const { parameter } = action.payload;

  const newState = { ...state };
  newState.paramsMeta = { ...state.paramsMeta };

  if (mode === "delete") {
    delete newState.paramsMeta[parameter];
  } else {
    newState.paramsMeta[parameter] = {
      ...newState.paramsMeta[parameter],
      ...(mode === "create" ? { range: [0, 1], mapping: "Manual" } : {}),
      ...(mode === "update" ? { mapping: action.payload.stream } : {}),
      ...(mode === "range" ? { range: action.payload.range } : {}),
    };
  }

  const mapsToSave = {
    ...prevMappings,
    [action.payload.vis]: newState.paramsMeta,
  };

  sessionStorage.setItem("paramsMeta", JSON.stringify(mapsToSave));
  return newState;
}
