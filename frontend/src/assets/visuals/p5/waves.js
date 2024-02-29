const waves = `

var mysound;
var fft, amps;
var isPlaying = false;

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight);
  frameRate(30);
}

windowResized = () => {
  resizeCanvas(windowWidth, windowHeight);
}

let seed = 0;

function draw() {
  background(0);

  let spectrum = [data?.["Low"], data?.["Low Mid"], data?.["High Mid"], data?.["Highs"]];

  let stepx = round(width / 64); // Adjust this step value
  let stepy = round(height / 64);

  spectrum = interpolateArray(spectrum, 64)

  // let level = data?.["Brightness"];
  let level = 0;

  let specx = 0;
  for (let x = 0; x < width; x += stepx) {
    const xamp = spectrum[specx] || 0;
    specx += 1;
    let specy = 0;
    for (let y = 0; y < height; y += stepy) {
      const yamp = spectrum[specy] || 0;
      specy += 1;
  
      stroke(xamp * 255 + 100, level * 255 + 100, yamp * 255 + 100);
      const offx = (noise(x * 0.01 + seed + xamp * 0.2, y * 0.01 + seed + yamp * 0.2) + noise(x * 0.01 + seed * 4 + xamp * 4, y * 0.01 + seed * 4 + yamp * 4)) * 200 - 200;

      point(map(x + offx, 0, width, 50, width - 50), map(y + offx, 0, height, 50, height - 50))
    }
  }

  seed = seed + 0.003;

  function interpolateArray(originalArray, newLength) {
    if (originalArray.length !== 4) {
      throw new Error("Original array must have exactly 4 values.");
    }
  
    const interpolatedArray = [];
    for (let i = 0; i < newLength; i++) {
      const t = i / (newLength - 1); // Calculate the interpolation factor between 0 and 1

      // Perform linear interpolation
      const value = (
        (1 - t) * originalArray[0] +
        t * originalArray[1]
      ) * (1 - t) +
        (
          (1 - t) * originalArray[2] +
          t * originalArray[3]
        ) * t;
  
      interpolatedArray.push(value);
    }
  
    return interpolatedArray;
  }
}
`;

export default waves;
