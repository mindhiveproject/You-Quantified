import store from "../store/store";


class FaceSync {

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
        for (const shape of data){
            newData["Difference in " + shape.categoryName]=shape.score
            //newData["Synchrony score of "+ shape.categoryName]=shape.diff_score
        };

        /*
        //append the raw channels
        for (let i = 0; i < chns.length; i++) {
            let key = chns[i];
            let val = rawVector[i];
            newData[key] = val;
        }*/
        store.dispatch({ type: 'devices/streamUpdate', payload: { id: "Face Synchrony", data: newData } })
    }

    isOpen(){
        return true;
    }
      

}

export default FaceSync;