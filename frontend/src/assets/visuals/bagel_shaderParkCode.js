export function bagelShaderParkCode() {
    return `
setMaxIterations(50)

//setStepSize(.1)

// movements
let degree = input()
let relative = input()

//params
let attract = 0.5
let speed = 0.3
let nscale=0;
let nAmplitude = 2;
let hueOffset = 0;
let rings = 1;
let mixAmt = 1

// shape variables
let s = getSpace();
let samplePos = vec3(0, 0, -degree) * .2 +(degree*.1);
let n = noise(samplePos);
let n1 = nsin((noise(samplePos)) * rings );
let n2 = nsin((noise(samplePos + hueOffset)) * rings);
let n3 = nsin((noise(samplePos + hueOffset * 2.2)) * rings);
let col = pow(vec3(n1, n2, n3), vec3(7));

// shapes
let horizon = shape(() => {
    rotateX(PI/2);
    torus(1.5, 1.39);
    expand(n*nAmplitude)
    setGeometryQuality(80)
    sphere(.1);
    blend(5);
    });  
let fractalBall = shape(() => {
    let s = getSpace();
    let position = vec3(mouse.x, mouse.y, s.z);
    let amplitude = .9;
    let k = fractalNoise(s + speed*time) * 0.1;
    sphere(0.5);
    expand(k);
  });


color(col);
horizon();
mixGeo(relative)
fractalBall()
`};