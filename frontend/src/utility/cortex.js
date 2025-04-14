import Quaternion from "quaternion";
import store from "../store/store";

function computePower(arr) {
  /**
   * a function that returns the avg power for each frequency band, with the option of returning relative power.
   */
  let powerArr = [0, 0, 0, 0, 0]; // this saves the sum of power values (theta, alpha, beta, betaH, gamma) across channels
  for (let i = 0; i < arr.length; i++) {
    powerArr[i % 5] += arr[i]; // updating the sums
  }
  let numChn = arr.length / 5;
  // dividing the number of channels
  for (let k = 0; k < powerArr.length; k++) {
    powerArr[k] /= numChn;
  }
  return powerArr;
}

function computeRotation(arr) {
  /**
    * a function that takes the 'mot' stream and returns rotation radians on x,y,z
    * there are two possible data formats based on the headset versions:
    [
      "COUNTER_MEMS","INTERPOLATED_MEMS",
      "Q0","Q1","Q2","Q3",
      "ACCX","ACCY","ACCZ",
      "MAGX","MAGY","MAGZ"
    ]
    and
    [
      "COUNTER_MEMS","INTERPOLATED_MEMS",
      "GYROX","GYROY","GYROZ",
      "ACCX","ACCY","ACCZ",
      "MAGX","MAGY","MAGZ"
    ]  
    
    transformation:
    Gyro_phy = (Gyro - 2^13) / (2^14 / 1000) 
    ACC_phy = (ACC - 2^13) / (2^14 /16) 
    Mag_phy = (Mag - 2^13) / (2^14 /24)
    */
  var rotation;
  var type;
  // gyros
  if (arr.length == 11) {
    let g = arr.slice(2, 5);
    // radians per second
    const resultArray = g.map(
      (element) => (element - 2 ** 13) / ((57.29 * 2 ** 14) / 1000)
    );
    //quaternions
  } else if (arr.length == 12) {
    let q = arr.slice(2, 6);
    let quat = new Quaternion(q);
    let euler = quat.toEuler("XYZ"); // Use the desired rotation order (e.g., 'XYZ')
    // rotation = [euler.roll, euler.pitch, euler.yaw];
    rotation = euler;
  } else {
    rotatio = [-1, -1, -1]; //DEBUG
  }
  return rotation;
}

//cortex stuff
function log(message) {
  // var paragraph = document.getElementById("elementA");
  // var text = document.createTextNode(message);
  // var lineBreak = document.createElement("br");
  // paragraph.appendChild(text);
  // paragraph.appendChild(lineBreak);
  // let logElement = this.logElement
  // const newContent = createSpan(message);
  // logElement.child(newContent);
  console.log(message);
}

class Cortex {
  constructor(user, socketUrl) {
    // create socket
    this.socket = new WebSocket(socketUrl);
    this.socketUrl = socketUrl;
    // read user infor
    this.user = user;
  }

  queryHeadsetId() {
    const QUERY_HEADSET_ID = 2;
    let socket = this.socket;
    let queryHeadsetRequest = {
      jsonrpc: "2.0",
      id: QUERY_HEADSET_ID,
      method: "queryHeadsets",
      params: {},
    };
    return new Promise(function (resolve, reject) {
      socket.send(JSON.stringify(queryHeadsetRequest));
      socket.addEventListener("message", (message) => {
        try {
          let data = message.data;
          if (JSON.parse(data)["id"] == QUERY_HEADSET_ID) {
            const results = JSON.parse(data)["result"];
            console.log(results);
            if (results.length > 0) {
              
              const state = store.getState();
              const other_ids = Object.keys(state.deviceMeta)
                .filter((elem) => state.deviceMeta[elem]?.device === "EMOTIV")
                .filter((elem)=> state.deviceMeta[elem]?.connected)
                .map((elem) => state.deviceMeta[elem]?.id);

              const diff_ids = results
                .map(({ id }) => id)
                .filter((id) => !other_ids.includes(id));

              let headsetId = diff_ids[0];
              resolve(headsetId);
            } else {
              console.log(
                "You do not have any headset, please connect headset with your pc."
              );
            }
          }
        } catch (error) {
          console.log(error);
        }
      });
    });
  }

  requestAccess() {
    let socket = this.socket;
    let user = this.user;
    console.log("requesting");
    return new Promise(function (resolve, reject) {
      const REQUEST_ACCESS_ID = 1;
      let requestAccessRequest = {
        jsonrpc: "2.0",
        method: "requestAccess",
        params: {
          clientId: user.clientId,
          clientSecret: user.clientSecret,
        },
        id: REQUEST_ACCESS_ID,
      };
      // this.console.log('requesting access') //debug
      socket.send(JSON.stringify(requestAccessRequest));

      socket.addEventListener("message", (data) => {
        try {
          if (JSON.parse(data.data)["id"] == REQUEST_ACCESS_ID) {
            resolve(data);
          }
        } catch (error) {
          console.log(error); //debug
        }
      });
    });
  }

  manipulate(parsedData) {}

  authorize() {
    let socket = this.socket;
    let user = this.user;
    console.log("authorizing...");
    return new Promise(function (resolve, reject) {
      const AUTHORIZE_ID = 4;
      let authorizeRequest = {
        jsonrpc: "2.0",
        method: "authorize",
        params: {
          clientId: user.clientId,
          clientSecret: user.clientSecret,
          license: user.license,
          debit: user.debit,
        },
        id: AUTHORIZE_ID,
      };
      socket.send(JSON.stringify(authorizeRequest));
      socket.addEventListener("message", (message) => {
        try {
          let data = message.data;
          if (JSON.parse(data)["id"] == AUTHORIZE_ID) {
            console.log(JSON.stringify(data));
            let cortexToken = JSON.parse(data)["result"]["cortexToken"];
            resolve(cortexToken);
          }
        } catch (error) {
          console.log(error); //debug
        }
      });
      console.log("authorized."); //debug
    });
  }

  controlDevice(headsetId) {
    let socket = this.socket;
    const CONTROL_DEVICE_ID = 3;
    let controlDeviceRequest = {
      jsonrpc: "2.0",
      id: CONTROL_DEVICE_ID,
      method: "controlDevice",
      params: {
        command: "connect",
        headset: headsetId,
      },
    };
    return new Promise(function (resolve, reject) {
      socket.send(JSON.stringify(controlDeviceRequest));
      socket.addEventListener("message", (message) => {
        let data = message.data;
        try {
          if (JSON.parse(data)["id"] == CONTROL_DEVICE_ID) {
            resolve(data);
          }
        } catch (error) {
          console.log(error);
        }
      });
    });
  }

  createSession(authToken, headsetId) {
    let socket = this.socket;
    const CREATE_SESSION_ID = 5;
    let createSessionRequest = {
      jsonrpc: "2.0",
      id: CREATE_SESSION_ID,
      method: "createSession",
      params: {
        cortexToken: authToken,
        headset: headsetId,
        status: "active",
      },
    };
    return new Promise(function (resolve, reject) {
      socket.send(JSON.stringify(createSessionRequest));
      socket.addEventListener("message", (message) => {
        let data = message.data;
        try {
          if (JSON.parse(data)["id"] == CREATE_SESSION_ID) {
            let sessionId = JSON.parse(data)["result"]["id"];
            resolve(sessionId);
          }
        } catch (error) {}
      });
    });
  }

  licenseInfo(authToken) {
    let socket = this.socket;
    const LICENSE_INFO_ID = 6;
    let licenseInfoRequest = {
      id: LICENSE_INFO_ID,
      jsonrpc: "2.0",
      method: "getLicenseInfo",
      params: {
        cortexToken: authToken,
      },
    };
    return new Promise(function (resolve, reject) {
      socket.send(JSON.stringify(licenseInfoRequest));
      socket.addEventListener("message", (message) => {
        let data = message.data;
        try {
          if (JSON.parse(data)["id"] == LICENSE_INFO_ID) {
            resolve(data);
          }
        } catch (error) {
          console.log(error);
        }
      });
    });
  }

  subRequest(stream, authToken, sessionId) {
    let socket = this.socket;
    const SUB_REQUEST_ID = 6;
    let subRequest = {
      jsonrpc: "2.0",
      method: "subscribe",
      params: {
        cortexToken: authToken,
        session: sessionId,
        streams: stream,
      },
      id: SUB_REQUEST_ID,
    };
    console.log("sub eeg request: ", subRequest);
    socket.send(JSON.stringify(subRequest));
    socket.addEventListener("message", (message) => {
      let data = message.data;
      try {
        let parsedData = JSON.parse(data);
        // computing an average
        this.manipulate(parsedData);
      } catch (error) {
        console.log("Streaming error as follows:");
        console.log(error);
        this.closeSession(this.authToken, this.sessionId);
      }
    });
  }

  /**
   * - query headset infor
   * - connect to headset with control device request
   * - authentication and get back auth token
   * - create session and get back session id
   */
  async querySessionInfo() {
    console.log("Start query session info...");
    console.log("Query headset ID...");
    let headsetId = "";
    await this.queryHeadsetId().then((headset) => {
      headsetId = headset;
    });
    this.headsetId = headsetId;
    console.log(headsetId);

    console.log("Query ctResult...");
    let ctResult = "";
    await this.controlDevice(headsetId).then((result) => {
      ctResult = result;
    });
    this.ctResult = ctResult;
    console.log(JSON.parse(ctResult));

    console.log("Query authToken...");
    let authToken = "";
    await this.authorize().then((auth) => {
      authToken = auth;
    });
    this.authToken = authToken;

    console.log("Query license info...");
    let license = "";
    await this.licenseInfo(authToken).then((result) => {
      license = result;
    });
    console.log(JSON.stringify(license));

    console.log("Query sessionID...");
    let sessionId = "";
    await this.createSession(authToken, headsetId).then((result) => {
      sessionId = result;
    });
    this.sessionId = sessionId;

    console.log("HEADSET ID -----------------------------------");
    console.log(this.headsetId);
    console.log("\r\n");
    console.log("CONNECT STATUS -------------------------------");
    console.log(this.ctResult);
    console.log("\r\n");
    console.log("AUTH TOKEN -----------------------------------");
    console.log(this.authToken);
    console.log("\r\n");
    console.log("SESSION ID -----------------------------------");
    console.log(this.sessionId);
    console.log("\r\n");
  }

  /**
   * - check if user logined
   * - check if app is granted for access
   * - query session info to prepare for sub and train
   */
  async checkGrantAccessAndQuerySessionInfo() {
    let requestAccessResult = "";
    await this.requestAccess().then((result) => {
      requestAccessResult = result;
    });

    let accessGranted = JSON.parse(requestAccessResult.data);

    // check if user is logged in CortexUI
    if ("error" in accessGranted) {
      console.log(
        "You must login on CortexUI before request for grant access then rerun"
      );
      console.log(accessGranted);
      console.log(requestAccessResult);
      throw new Error(
        "You must login on CortexUI before request for grant access"
      );
    } else {
      console.log(accessGranted["result"]["message"]);
      // console.console.log(accessGranted['result'])
      if (accessGranted["result"]["accessGranted"]) {
        await this.querySessionInfo();
      } else {
        console.log(
          "You must accept access request from this app on CortexUI then rerun"
        );
        throw new Error(
          "You must accept access request from this app on CortexUI"
        );
      }
    }
  }

  // defineDeviceData(headsetId){}

  closeSession(authToken, session) {
    let socket = this.socket;
    const UPDATE_SESSION_ID = 5;
    let updateSessionRequest = {
      jsonrpc: "2.0",
      id: UPDATE_SESSION_ID,
      method: "updateSession",
      params: {
        cortexToken: authToken,
        session: session,
        status: "close",
      },
    };
    return new Promise((resolve, reject) => {
      socket.send(JSON.stringify(updateSessionRequest));
      socket.addEventListener("message", (message) => {
        let data = message.data;
        console.log(data);
        try {
          if (JSON.parse(data)["id"] == UPDATE_SESSION_ID) {
            console.log(data);
            resolve(sessionId);
          }
        } catch (error) {
          console.log(error);
        }
      });
    });
  }
  /**
   *
   * - check login and grant access
   * - subcribe for stream
   * - logout data stream to console or file
   */
  sub(streams) {
    this.socket.addEventListener("open", async () => {
      await this.checkGrantAccessAndQuerySessionInfo();
      let data_stream = this.subRequest(
        streams,
        this.authToken,
        this.sessionId
      ); // this is the function that is called every time a message is sent
      // this.socket.addEventListener('message', (data)=>{
      // This funciton is not used
      // })
    });
  }

  setupProfile(authToken, headsetId, profileName, status) {
    const SETUP_PROFILE_ID = 7;
    let setupProfileRequest = {
      jsonrpc: "2.0",
      method: "setupProfile",
      params: {
        cortexToken: authToken,
        headset: headsetId,
        profile: profileName,
        status: status,
      },
      id: SETUP_PROFILE_ID,
    };
    // console.console.log(setupProfileRequest)
    let socket = this.socket;
    return new Promise(function (resolve, reject) {
      socket.send(JSON.stringify(setupProfileRequest));
      socket.addEventListener("message", (data) => {
        if (status == "create") {
          resolve(data);
        }

        try {
          // console.console.log('inside setup profile', data)
          if (JSON.parse(data)["id"] == SETUP_PROFILE_ID) {
            if (JSON.parse(data)["result"]["action"] == status) {
              console.log(
                "SETUP PROFILE -------------------------------------"
              );
              console.log(data);
              console.log("\r\n");
              resolve(data);
            }
          }
        } catch (error) {}
      });
    });
  }

  queryProfileRequest(authToken) {
    const QUERY_PROFILE_ID = 9;
    let queryProfileRequest = {
      jsonrpc: "2.0",
      method: "queryProfile",
      params: {
        cortexToken: authToken,
      },
      id: QUERY_PROFILE_ID,
    };

    let socket = this.socket;
    return new Promise(function (resolve, reject) {
      socket.send(JSON.stringify(queryProfileRequest));
      socket.addEventListener("message", (data) => {
        try {
          if (JSON.parse(data)["id"] == QUERY_PROFILE_ID) {
            // console.console.log(data)
            resolve(data);
          }
        } catch (error) {}
      });
    });
  }
}

//initialize the output
let powerVector = [0, 0, 0, 0, 0];
let motionVector = [0, 0, 0];
let rawVector = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let time = 0;
let chns = [
  "AF3",
  "F7",
  "F3",
  "FC5",
  "T7",
  "P7",
  "O1",
  "O2",
  "P8",
  "T8",
  "FC6",
  "F4",
  "F8",
  "AF4",
];

class CortexPower extends Cortex {
  constructor(user, socketUrl) {
    super(user, socketUrl);
  }

  // Add error handling functino using parsedData to check if there's data. I could also throw a return value from the sub?
  // 'eeg' contains ['COUNTER', 'INTERPOLATED', 'AF3', 'F7', 'F3', 'FC5', 'T7', 'P7', 'O1', 'O2', 'P8', 'T8', 'FC6', 'F4', 'F8', 'AF4', 'RAW_CQ', 'MARKER_HARDWARE', 'MARKERS']
  manipulate(parsedData) {
    if ("warning" in parsedData) {
      if (parsedData?.warning?.code === 1) {
        store.dispatch({
          type: "devices/updateMetadata",
          payload: {
            id: this.headsetId,
            field: "connected",
            data: false,
          },
        });
      }
      return;
    }
    // resolving power data
    try {
      let power = parsedData["pow"];
      powerVector = computePower(power);
    } catch (error) {}

    // resolving motion data
    try {
      let motion = parsedData["mot"];
      motionVector = computeRotation(motion);
    } catch (error) {}

    // resolving raw data
    try {
      let raw = parsedData["eeg"];
      time = parsedData["time"]; // take timestamp whenever eeg is updated, bc it's the fastest sampled data
      rawVector = raw.slice(2, -3);
    } catch (error) {}

    // create the dictionary
    let newData = {
      Theta: powerVector[0],
      Alpha: powerVector[1],
      "Low beta": powerVector[2],
      "High beta": powerVector[3],
      Gamma: powerVector[4],
      //'X': motionVector[0],
      //'Y': motionVector[1],
      //'Z': motionVector[2],
      Time: time,
    };

    store.dispatch({
      type: "devices/streamUpdate",
      payload: { id: this.headsetId, data: newData },
    });
  }
}

export default CortexPower;
