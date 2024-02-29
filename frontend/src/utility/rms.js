import store from "../store/store";


class AudioRMS {

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
        newData["Volume"]= data
       

        /*
        //append the raw channels
        for (let i = 0; i < chns.length; i++) {
            let key = chns[i];
            let val = rawVector[i];
            newData[key] = val;
        }*/
        store.dispatch({ type: 'devices/streamUpdate', payload: { id: "Audio Volume", data: newData } })
    }

    isOpen(){
        return true;
    }
      

}

export default AudioRMS;