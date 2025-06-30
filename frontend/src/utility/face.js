import store from "../store/store";


class Face {

    constructor(bc) {
        // create socket
        this.bc = bc;
        this.lastMessageTime = null; // Add timestamp tracking
    }

    async initialize() {

        this.bc.onmessage = (eventMessage) => {
            this.receiveData(eventMessage.data)
           }

    }

    receiveData(data) {

        store.dispatch({ type: 'devices/streamUpdate', payload: { id: "Face Landmarker", data: data } })
    }

    isOpen(){
        return true;
    }
      

}

export default Face;