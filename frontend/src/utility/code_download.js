export default function downloadCode(visName, code) {
    // CallBackFunction to download a CSV
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";

    const currentDate = new Date();
    const dateString = currentDate.fileName();

    const blob = new Blob([code], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = visName.toLowerCase().replace(/ /g, "_") + "_" + dateString + ".txt";

    // Creates a hidden <a> object and clicks it
    a.click();
    window.URL.revokeObjectURL(url);
}


Date.prototype.fileName = function () {
    // YYYYMMDDThhmm - standard format for dates and times
    var month = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
    var hh = this.getHours();
    var mm = this.getMinutes();

    return [this.getFullYear(),
    (month > 9 ? '' : '0') + month,
    (dd > 9 ? '' : '0') + dd,
        "T",
    (hh > 9 ? '' : '0') + hh,
    (mm > 9 ? '' : '0') + mm,
    ].join('');
};