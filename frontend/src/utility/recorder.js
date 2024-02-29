
import store from '../store/store';
import Papa from 'papaparse';


function saveToObject(saveObject) {
    saveObject.push(store.getState().dataStream);

    // Code to save it to local storage (in case this works better for MindHive)
    // const data = JSON.parse(sessionStorage.getItem("data"));
    // data.push(store.getState().dataStream)
    // sessionStorage.setItem("data", JSON.stringify(data));
    
}

function _toObservable(store) {
    return {
      subscribe({ onNext }) {
        let dispose = store.subscribe(() => onNext(store.getState()));
        onNext(store.getState());
        return { dispose };
      }
    }
}

export function subToStore(saveObject) {
    const obversable = _toObservable(store);
    const unsub = obversable.subscribe({onNext: ()=>saveToObject(saveObject)})
    return unsub
}

/*
export function saveAtInterval(saveObject, interval) {
    const intervalID = setInterval(()=>saveToObject(saveObject), interval)
    return intervalID
}
*/

function autoCSVDownload(saveObject) {
    // CallBackFunction to download a CSV
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";

    const finalObject = {}
    const currentDate = new Date();
    const dateString = currentDate.fileName();
    // const saveObject = JSON.parse(sessionStorage.getItem("data"));

    for (const key in saveObject[0]) {
        finalObject[key] = saveObject.map((data)=>data[key]);
        // finalObject[key][0]["Device"] = key;
        // finalObject[key] = finalObject[key].map((data)=>data[key]=)
        // finalObject[key][0]["Device"] = key;
        const json = JSON.stringify(finalObject[key]);
        const blob = new Blob([Papa.unparse(json)], {type: "text/csv"});
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = key.toLowerCase().replace(/ /g, "_")+"_"+dateString+".csv";
    
        // Creates a hidden <a> object and clicks it
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

export function stopRecording(unsub, saveObject) {
    //clearInterval(intervalID);
    unsub.dispose();

    autoCSVDownload(saveObject);
    while(saveObject.length > 0) {
        saveObject.pop();
    }

    // sessionStorage.removeItem("data");
}

Date.prototype.fileName = function() {
    // YYYYMMDDThhmm - standard format for dates and times
    var month = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
    var hh = this.getHours();
    var mm = this.getMinutes();

    return [this.getFullYear(),
            (month>9 ? '' : '0') + month,
            (dd>9 ? '' : '0') + dd,
            "T",
            (hh>9 ? '' : '0') + hh,
            (mm>9 ? '' : '0') + mm,
           ].join('');
};