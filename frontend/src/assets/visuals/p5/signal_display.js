const signal_display = `

// helper function
function drawTimeSeries(ts, xOffset, lowerbound, upperbound) {
    beginShape();
    for (let i = 0; i < windowWidth && i < ts.length; i++) {
        vertex((xOffset - i), map(ts[ts.length - i - 1], minimum, maximum, upperbound, lowerbound));
    }
    endShape();
}

windowResized = () => {
  resizeCanvas(windowWidth, windowHeight);
}

// define parameters
let minimum = -0.5;
let maximum = 1.5;
let timeSeries = [];
let chn_names = ['AF3', 'F7', 'F3', 'FC5', 'T7', 'P7', 'O1', 'O2', 'P8', 'T8', 'FC6', 'F4', 'F8', 'AF4'];
let chn = chn_names.length;
let signal_names = Object.keys(data);
// time series lists for all the channels
const ts_channels = [];
for (let i = 0; i < chn; i++) {
    ts_channels.push([]);
}

//p5 functions
setup = () => {
    createCanvas(windowWidth, windowHeight);
};

draw = () => {
    background(220);
    for (let k = 0; k < chn; k++) {
        ts_channels[k].push(data?.[signal_names[k]]);
        if (ts_channels[k].length > width) {
            ts_channels[k].shift();
        }
        if (ts_channels[k].length >= 2) {
            rect(0, 0, width, height);
            noFill();
            drawTimeSeries(ts_channels[k], width, k * height / chn, (k + 1) * height / chn);
        }
    }
};`;

export default signal_display;
