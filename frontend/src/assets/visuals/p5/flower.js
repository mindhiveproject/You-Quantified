/*
 * flower class
 * https://openprocessing.org/sketch/724567
 */
const flower = `
function divideIfNotZero(numerator, denominator) {
    if (denominator === 0 || isNaN(denominator)) {
        return 0;
    }
    else {
        return numerator / denominator;
    }
}

function flower(values, sum, colors, width, height, r, c, petalCount, circleCount, maxRad, minRad, frac, rot) {
    let rad = 0;
    noStroke();
    push();
    translate(width / 2, height / 2);
    for (let j = 0; j < petalCount; j++) {
        for (let i = c; i <= circleCount; i++) {
            let tt = i / circleCount;
            let x = r * tt * cos(tt * rot + (2 * PI * j) / petalCount - PI / 2);
            let y = r * tt * sin(tt * rot + (2 * PI * j) / petalCount - PI / 2);
            let petalSize = divideIfNotZero(values[j], sum) + 0.7;
            if (i < frac * circleCount) {
                rad = map(i, 0, frac * circleCount, minRad, maxRad * petalSize);
            } else {
                rad = map(i, frac * circleCount, circleCount, maxRad * petalSize, minRad);
            }

            // let col1 = color(255 * t, 255, 0, 10);
            let col2 = color(50 * t + 205, 255 * (1 - t), 200, 200);
            let col1 = colors[j];
            col1.setAlpha(255 * t);
            fill(lerpColor(col1, col2, i / circleCount - 0.4));
            ellipse(x, y, 2 * rad, 2 * rad);
        }
    }
    pop();
}


let theta;
let alpha;
let beta1;
let beta2;
let gamma;
let colors;

windowResized = () => {
  resizeCanvas(windowWidth, windowHeight);
}

setup = () => {
    createCanvas(windowWidth, windowHeight);
    theta = color(72, 50, 133); // Blue
    alpha = color(37, 17, 30); // Dark purple
    beta1 = color(247, 213, 30); // Yellow
    beta2 = color(247, 148, 30); // Orange
    gamma = color(207, 25, 73); // Red
    colors = [theta, alpha, beta1, beta2, gamma];
};

draw = () => {
    background(0);
    // compute the sum
    let values = Object.values(data);
    let sum = values.reduce((acc, currentValue) => Math.abs(acc) + Math.abs(currentValue), 0);
    t = (0.3 * abs(sin(frameCount * 0.004))) + 0.8;
    flower(values, sum, colors, windowWidth, windowHeight,
        150 * t + 100, 10, 5, 100, 68, 0.1 * (t) + 0.1, 0.6, PI * (1 - t));
};
`;

export default flower;
