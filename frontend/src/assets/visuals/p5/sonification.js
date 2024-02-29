const sonification = `
// delta = 4 Hz, theta = 6 Hz, alpha = 10 Hz, beta = 24 Hz, gamma = 40 Hz

// chose these values so that frequency ratios would map onto pitch ratios that form specific musical intervals (3:2 = perfect fifth, 5:4 = major third)

delta_freq = 4;
theta_freq = 6;
alpha_freq = 10;
beta_freq = 24;
gamma_freq = 40;

BaseFreq = 110;

let delta;
let deltaBaseFreq = BaseFreq - 0.5 * delta_freq; //

let theta;
let thetaBaseFreq = BaseFreq * 1.5 - 0.5 * theta_freq; //perfect fifth

let alpha;
let alphaBaseFreq = BaseFreq * 2.5 - 0.5 * alpha_freq; //major third

let beta;
let betaBaseFreq = BaseFreq * 3 - 0.5 * beta_freq; //perfect fifth

let gamma;
let gammaBaseFreq = BaseFreq * 10 - 0.5 * gamma_freq; //major third

let analyzer; // visualize the waveform

let delta_modulator;
let theta_modulator;
let alpha_modulator;
let beta_modulator;
let gamma_modulator;

let isPlaying = false;

// I've just been using mouseover to turn sound on/off but we should map to actual buttons

windowResized = () => {
  resizeCanvas(windowWidth, windowHeight);
}


function playOscillator() {
  delta.amp(1 * data?.["Delta"], 0.01);
  delta_modulator.amp(1 * data?.["Delta"], 0.01);

  theta.amp(0.8 * data?.["Theta"], 0.01);
  theta_modulator.amp(0.8 * data?.["Theta"], 0.01);

  alpha.amp(0.6 * data?.["Alpha"], 0.01);
  alpha_modulator.amp(0.6 * data?.["Alpha"], 0.01);

  beta.amp(0.4*data?.["Beta"], 0.01);
  beta_modulator.amp(0.4*data?.["Beta"], 0.01);

  gamma.amp(0.2*data?.["Gamma"], 0.01);
  gamma_modulator.amp(0.2*data?.["Gamma"], 0.01);

  delta.pan(1);
  theta.pan(1);
  alpha.pan(1);
  beta.pan(1);
  gamma.pan(1);

  delta_modulator.pan(-1);
  theta_modulator.pan(-1);
  alpha_modulator.pan(-1);
  beta_modulator.pan(-1);
  gamma_modulator.pan(-1);
}

function stopOscillator() {
  delta_modulator.amp(0.0, 1.0);
  delta.amp(0.0, 1.0);

  theta_modulator.amp(0.0, 1.0);
  theta.amp(0.0, 1.0);

  alpha_modulator.amp(0.0, 1.0);
  alpha.amp(0.0, 1.0);

  beta_modulator.amp(0.0, 1.0);
  beta.amp(0.0, 1.0);

  gamma_modulator.amp(0.0, 1.0);
  gamma.amp(0.0, 1.0);

  delta_modulator.stop();
  theta_modulator.stop();
  alpha_modulator.stop();
  beta_modulator.stop();
  gamma_modulator.stop();
  delta.stop();
  theta.stop();
  alpha.stop();
  beta.stop();
  gamma.stop();


  delta_modulator.dispose();
  theta_modulator.dispose();
  alpha_modulator.dispose();
  beta_modulator.dispose();
  gamma_modulator.dispose();
  delta.dispose();
  theta.dispose();
  alpha.dispose();
  beta.dispose();
  gamma.dispose();

}

mousePressed = () => {
  isPlaying = true;
  userStartAudio();
}

setup = () => {
  getAudioContext().suspend();
  var cnv = createCanvas(windowWidth, windowHeight);
  noFill();

  delta = new p5.Oscillator("sine");
  delta.amp(0); // set amplitude
  delta.freq(deltaBaseFreq); // set frequency
  delta.start(); // start oscillating

  theta = new p5.Oscillator("sine");
  theta.amp(0); // set amplitude
  theta.freq(thetaBaseFreq); // set frequency
  theta.start(); // start oscillating

  alpha = new p5.Oscillator("sine");
  alpha.amp(0); // set amplitude
  alpha.freq(alphaBaseFreq); // set frequency
  alpha.start(); // start oscillating

  beta = new p5.Oscillator("sine");
  beta.amp(0); // set amplitude
  beta.freq(betaBaseFreq); // set frequency
  beta.start(); // start oscillating

  gamma = new p5.Oscillator("sine");
  gamma.amp(0); // set amplitude
  gamma.freq(gammaBaseFreq); // set frequency
  gamma.start(); // start oscillating

  delta_modulator = new p5.Oscillator("sine");
  theta_modulator = new p5.Oscillator("sine");
  alpha_modulator = new p5.Oscillator("sine");
  beta_modulator = new p5.Oscillator("sine");
  gamma_modulator = new p5.Oscillator("sine");

  delta_modulator.freq(deltaBaseFreq + 0.5 * delta_freq);
  delta_modulator.amp(0);
  theta_modulator.freq(thetaBaseFreq + 0.5 * theta_freq);
  theta_modulator.amp(0);
  alpha_modulator.freq(alphaBaseFreq + 0.5 * alpha_freq);
  alpha_modulator.amp(0);
  beta_modulator.freq(betaBaseFreq + 0.5 * beta_freq);
  beta_modulator.amp(0);
  gamma_modulator.freq(gammaBaseFreq + 0.5 * gamma_freq);
  gamma_modulator.amp(0);

  delta_modulator.start();
  theta_modulator.start();
  alpha_modulator.start();
  beta_modulator.start();
  gamma_modulator.start();

  // create an FFT to analyze the audio
  analyzer = new p5.FFT();

  /*
  playButton = createButton("Play");
  playButton.position(0, 100);

  playButton.mousePressed(() => {
    toggleOscillator();
  });
  */
};

function remove() {
  stopOscillator();
}

draw = () => {
  background(30);

  // analyze the waveform
  waveform = analyzer.waveform();

  // draw the shape of the waveform
  stroke(255);
  strokeWeight(10);
  beginShape();
  for (let i = 0; i < waveform.length; i++) {
      let x = map(i, 0, waveform.length, 0, width);
      let y = map(waveform[i], -1, 1, -height / 2, height / 2);
      vertex(x, y + height / 2);
  }
  endShape();

  strokeWeight(1);

  if (!isPlaying) {
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);
    fill(255, 255, 255);
    textAlign(CENTER);
    textSize(20);
    strokeWeight(0.5);
    text("Click anywhere on the screen to start the sound system", width/2, height/2);
  } else {
    fill(0, 0, 0, 0);
    playOscillator();
  }
};
`

export default sonification;
