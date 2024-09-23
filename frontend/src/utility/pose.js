import store from "../store/store";


const pose_dict = {
    0: 'nose',
    1: 'left eye (inner)',
    2: 'left eye',
    3: 'left eye (outer)',
    4: 'right eye (inner)',
    5: 'right eye',
    6: 'right eye (outer)',
    7: 'left ear',
    8: 'right ear',
    9: 'mouth (left)',
    10: 'mouth (right)',
    11: 'left shoulder',
    12: 'right shoulder',
    13: 'left elbow',
    14: 'right elbow',
    15: 'left wrist',
    16: 'right wrist',
    17: 'left pinky',
    18: 'right pinky',
    19: 'left index',
    20: 'right index',
    21: 'left thumb',
    22: 'right thumb',
    23: 'left hip',
    24: 'right hip',
    25: 'left knee',
    26: 'right knee',
    27: 'left ankle',
    28: 'right ankle',
    29: 'left heel',
    30: 'right heel',
    31: 'left foot index',
    32: 'right foot index'
  };
  

export default class Pose {
    constructor(bc) {
        this.bc = bc;
    }

    async initialize() {
        this.bc.onmessage = (eventMessage) => {
            this.receiveData(eventMessage.data);
        }
    }

    receiveData(data) {
        let newData = {};
        console.log(data);
        for (var i=0; i< data.length; i++) {
            console.log(data[i]);
            newData[pose_dict[i]] = data[i];
        }
        store.dispatch({ type: 'devices/streamUpdate', payload: { id: "Pose Landmarks", data: newData } })
    }

    isOpen() {
        return true;
    }
}