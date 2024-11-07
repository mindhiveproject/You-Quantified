import store from "../store/store";


class VoiceEmotion {

    constructor(bc) {
        // create socket
        this.bc = bc;
    }

    async initialize() {

        this.bc.onmessage = (eventMessage) => {
            console.log(eventMessage.data)
            this.receiveData(eventMessage.data)
            
           }

    }

    receiveData(data) {
        let newData= {}
        newData["Valence"]= data[0]
        newData["Arousal"]= data[1]
        

        /*
        //append the raw channels
        for (let i = 0; i < chns.length; i++) {
            let key = chns[i];
            let val = rawVector[i];
            newData[key] = val;
        }*/
        store.dispatch({ type: 'devices/streamUpdate', payload: { id: "Voice Emotion", data: newData } })
    }

    isOpen(){
        return true;
    }
      

}

export default VoiceEmotion;