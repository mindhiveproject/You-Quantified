import visualsRaw from "../metadata/vis";


// Function to load metadata (mappings) of the parameters
export function loadParameters({params, visID}) {

  const storedMetaData = sessionStorage.getItem(`paramsMeta/${visID}`);

  if (storedMetaData) {
    return JSON.parse(storedMetaData);
  }

  return params
    ? params.reduce((acc, curr) => {
        acc[curr.name] = {
          mapping: "Manual",
          range: [0, 1],
          value: 0,
        };
        return acc;
      }, {})
    : {};
}

// This function loads the parameters and metadata as
// the user switches in the visualization
export function loadParamsRuntime(state, action) {
  let pathname = window.location.pathname;
  pathname = pathname.split("/")[2]?.replace(/%20/g, " ");
  const storedMappings = sessionStorage.getItem(`paramsMeta/${pathname}`);
  let params = {};
  const selection = action.payload;
  let meta = {};
  
  // Check for stored mappings in the session storage and return early
  if (storedMappings != null) {
    const maps = JSON.parse(storedMappings);
    params = Object.keys(maps).reduce((acc, parameter) => {
      acc[parameter] = 0;
      return acc;
    }, {});
    meta = maps;
    return { params, meta };
  }

  // Find the parameters in the visualization's metadata and load them to the store
  params = selection.properties.reduce((acc, parameter) => {
    acc[parameter.name] = parameter.value;
    return acc;
  }, {});

  // Declare the mappings based on the visualization's metadata
  meta = selection.properties.reduce((acc, parameter) => {
    let sharedKey;
    let foundDevice;
    // Check if there is a default value to map it automatically
    if ("default" in parameter) {
      for (let device in state.dataStream) {
        const dataKeys = Object.keys(state.dataStream[device]);
        sharedKey = dataKeys.find((key) => parameter.default.includes(key));
        if (sharedKey != undefined) {
          foundDevice = device;
          break;
        }
      }
      // Map it to the stream in case there was a value found
      acc[parameter.name] = {
        mapping: foundDevice ? [foundDevice, sharedKey] : "Manual",
        range: [0, 1],
      };
    } else {
      // If there's no default value, declare manual mapping
      acc[parameter.name] = {
        mapping: "Manual",
        range: [0, 1],
      };
    }
    return acc;
  }, {});
  
  return { meta, params };
}
