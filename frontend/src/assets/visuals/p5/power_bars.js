const powerBars = `

function divideIfNotZero(numerator, denominator) {
  if (denominator === 0 || isNaN(denominator)) {
        return 0;
  }
  else {
        return numerator / denominator;
  }
}

let ts = [];
let ts_key = 'Time Series';
var keys = ['Theta','Alpha',"Low beta","High beta","Gamma"];
var xlabels = ['Theta','Alpha',"Low beta","High beta","Gamma"]; //data for the x axis
var colors = ["#f9b820","#f9b820","#f9b820","#f9b820","#f9b820"];

// mousePressed = () => {
//   let ind = getMouseLabel(mouseX, mouseY);
//   if (ind!=-1) {
//     ts_key = xlabels[ind];
//   }
//   return false
// };

function getMouseLabel(x,y) { // given a mouse location, return the area it is in
  for (let t=0; t<5; t++) {
    let x_upper = vert_x+graphWidth*(1/xlabels.length*(t+1));
    let x_lower = vert_x+graphWidth*(1/xlabels.length*(t));
    let y_upper = vert_y2+30;
    let y_lower = vert_y1+40;
    if (x >= x_lower && x <= x_upper && y >= y_lower && y <= y_upper) {
      return t;
    }
  }
  // if the position isn't in the boxes
  return -1;
};

function drawTimeSeries(p5, ts, xOffset, size, lowerbound, upperbound) {
  beginShape();
  for (let i = 0; i < size && i < ts.length; i++) {
    vertex((xOffset - i), map(ts[ts.length - i - 1], 0, 1, lowerbound, upperbound));
  }
  endShape(); 
}

windowResized = () => {
  resizeCanvas(windowWidth, windowHeight);
}

var marginTop = 0;
var marginLeft = 0;
var marginRight = 0;
var marginBottom = 0;
var graphWidth = 0;
var graphHeight = 0;
var graph2Height = 0;
let vert_x = 0;
let vert_y1 = 0;
let vert_y2 = 0;
let graphOffset = 0;
let secondGraphShrink= 0;


setup = () => {
  createCanvas(windowWidth, windowHeight);
};

draw = () => {
  marginLeft = 1/30*width; 
  marginTop = 1/8*height;
  marginRight = 1/60*width;
  marginBottom = 1/30*height;
  graphWidth = 4/5*width;
  graphHeight = 1/3*height;
  graph2Height = 1/3*height;
  vert_x = marginLeft+1/16*width;
  vert_y1 = marginTop-1/20*height;  //up
  vert_y2 = marginTop+1/20*height+graphHeight;  //down
  graphOffset = 0.17*height+graph2Height;
  secondGraphShrink = 0.75;



  background(255);
  fill(0);
  textSize(20);
  // computing the sum of all the current values (the first five)
  let values = Object.values(data).slice(0,5);
  let sum = values.reduce((acc, currentValue) => Math.abs(acc) + Math.abs(currentValue), 0);
  text("Relative Power Values", width/2+marginLeft, marginTop/2);

  /*
  * axes
  */
  //function that draws the axes, with a yOffset, ie move vertically
  function draw_axes(yOffset,shrink){
    //draw vertical axis
    line(vert_x, shrink*vert_y1+yOffset, vert_x, shrink*vert_y2+yOffset);
    //10 ticks, spaced 50px apart
    textAlign(CENTER, CENTER);
    textSize(15);
    for (var t=0; t<= 10; t+= 1) {
      line(vert_x-5, shrink*(vert_y1+(vert_y2-vert_y1)*t/10)+yOffset, vert_x, shrink*(vert_y1+(vert_y2-vert_y1)*t/10)+yOffset);
      text(round(0.1*(10-t),1), vert_x-20, shrink*(vert_y1+(vert_y2-vert_y1)*t/10)+yOffset);
    }
    // draw ylabels
    push();
    textSize(20);
    let angle = radians(270);
    rotate(angle);
    translate(-shrink*(vert_y1+0.5*(vert_y2-vert_y1))-yOffset,1/30*width);
    text("relative power", 0,0);
    pop();
    
    //draw horizontal axis
    textSize(20);
    line(vert_x, shrink*(vert_y2)+yOffset, vert_x+graphWidth, shrink*(vert_y2)+yOffset);
  }
  draw_axes(0,1);  // axes for graph1
  draw_axes(graphOffset,secondGraphShrink);  // axes for graph2
  // draw xlabel for graph2
  push();
  textSize(20);
  text("time", vert_x+graphWidth/2,secondGraphShrink*(vert_y2+20)+graphOffset);
  pop();
  /*
  * bar plot code
  */

  for (var t=0; t<xlabels.length; t++) {
      push();
      fill(0);
      text(xlabels[t], vert_x+graphWidth*(1/xlabels.length*(t+0.5)), vert_y2+20);
      fill(colors[t]);
      let barwidth = graphWidth*1/xlabels.length*2/4;
      rect(vert_x+graphWidth*(1/xlabels.length*t)+1/2*barwidth, vert_y2, barwidth, map(divideIfNotZero(data?.[keys[t]],sum),0,1,0,vert_y1-vert_y2));
      pop();
    }
  /*
  * time series code
  */
  let upper = secondGraphShrink*vert_y1+graphOffset;  //up
  let lower = secondGraphShrink*vert_y2+graphOffset;  //down

  // time series
  ts.push(divideIfNotZero(data?.[ts_key],sum)); //todo
  if (ts.length > graphWidth) {
    ts.shift();
  }
  if (ts.length >= 2) {
    //rect(0, 0, width, height);
    noFill();
    drawTimeSeries(p5, ts, vert_x+graphWidth, graphWidth, lower, upper);
  }

};


`;

export default powerBars;
