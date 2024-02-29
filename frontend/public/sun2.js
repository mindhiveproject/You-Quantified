import React, { useEffect } from 'react';
import Sketch from 'react-p5';
import P5 from 'p5';

// star variables
var sun;
var mountain;
var xpos = 0;
var ypos = 0;
var ytarget = 0;
var gradient = 0;
var gradient_target = 0;
var vol = 0;
var power = 0;
var easing = 0.1; // Easing value (adjust as needed)
var fromX, fromY;
var toX, toY;
var step = 2.5;

function P5Wrapper({sketch, params}) {
    const canvasRef = React.useRef();

    useEffect(() => {

        const Q = new P5(p => sketch(p, params, canvasRef), canvasRef.current);

        canvasRef.current.firstChild.style.visibility = "visible"
        function updateCanvasDimensions() {
            Q.createCanvas(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
            Q.redraw();
        }

        window.addEventListener("resize", updateCanvasDimensions, true);

        // Super important cleanup function
        return () => {
            Q.noLoop();
            Q.remove();
            window.removeEventListener("resize", updateCanvasDimensions, true);
        }
    }, []);

    return (
        <div className="h-100" ref={canvasRef} />
    ); 

}

const Sun = ({ value }) => {

    //Xavier's star class
    /*
     * The Star class
     */
    function Star(p5_instance, position, radius, fadingFactor, flaresActivity, flaresColor, imageWidth) {
        this.position = position;
        this.radius = radius;
        this.fadingFactor = fadingFactor;
        this.flaresActivity = flaresActivity;
        this.imageWidth = imageWidth;
        this.body = p5_instance.createImage(this.imageWidth, this.imageWidth);
        this.flares = p5_instance.createImage(this.imageWidth, this.imageWidth);
        this.timeCounter = 0;
        this.flaresColor = flaresColor;
        this.p5_instance = p5_instance;
        // Initialize the star's body image
        var x, y, pixel, distanceSq;
        var radiusSq = p5_instance.sq(this.radius);
        var center = this.imageWidth / 2;

        this.body.loadPixels();

        for (x = 0; x < this.imageWidth; x++) {
            for (y = 0; y < this.imageWidth; y++) {
                pixel = 4 * (x + y * this.imageWidth);
                distanceSq = p5_instance.sq(x - center) + p5_instance.sq(y - center);
                this.body.pixels[pixel] = 236;
                this.body.pixels[pixel + 1] = 24;
                this.body.pixels[pixel + 2] = 1;
                this.body.pixels[pixel + 3] = 255 * (0.95 - distanceSq / radiusSq);
            }
        }

        this.body.updatePixels();
    }

    //
    // The update method
    //
    Star.prototype.update = function () {

        var x, y, deltaX, deltaY, pixel, distanceSq, relativeAngle;
        var dx, dy, sumColor, counter, pixelColor;
        var radiusSq = this.p5_instance.sq(this.radius);
        var center = this.imageWidth / 2;
        var nPixels = this.p5_instance.sq(this.imageWidth);

        // Create the flares in the star's body (save the result in the red channel)
        this.flares.loadPixels();

        for (x = 0; x < this.imageWidth; x++) {
            for (y = 0; y < this.imageWidth; y++) {
                deltaX = x - center;
                deltaY = y - center;
                distanceSq = this.p5_instance.sq(deltaX) + this.p5_instance.sq(deltaY);

                if (distanceSq < radiusSq) {
                    relativeAngle = this.p5_instance.atan2(deltaY, deltaX) / this.p5_instance.TWO_PI;

                    if (relativeAngle < 0) {
                        relativeAngle++;
                    }

                    pixel = 4 * (x + y * this.imageWidth);
                    this.flares.pixels[pixel] = 255 * this.p5_instance.noise(0.1 * (Math.sqrt(distanceSq) - this.timeCounter), 10 * relativeAngle);
                }
            }
        }

        // Smooth the flares (save the result in the blue and alpha channels)
        for (x = 2; x < this.imageWidth - 2; x++) {
            for (y = 2; y < this.imageWidth - 2; y++) {
                pixel = 4 * (x + y * this.imageWidth);
                deltaX = x - center;
                deltaY = y - center;
                distanceSq = this.p5_instance.sq(deltaX) + this.p5_instance.sq(deltaY);
                sumColor = 0;
                counter = 0;

                // Loop over nearby pixels
                for (dx = -2; dx <= 2; dx++) {
                    for (dy = -2; dy <= 2; dy++) {
                        if (this.p5_instance.sq(deltaX + dx) + this.p5_instance.sq(deltaY + dy) < distanceSq) {
                            sumColor += this.flares.pixels[pixel + 4 * (dx + dy * this.imageWidth)];
                            counter++;
                        }
                    }
                }

                if (counter > 0) {
                    this.flares.pixels[pixel] = sumColor / counter;
                    this.flares.pixels[pixel + 1] = sumColor / counter;
                    this.flares.pixels[pixel + 2] = sumColor / counter;
                    this.flares.pixels[pixel + 3] = 360 * (1 - this.fadingFactor) * 0.25 * radiusSq / distanceSq;
                } else {
                    this.flares.pixels[pixel] = 0;
                    this.flares.pixels[pixel + 1] = 0;
                    this.flares.pixels[pixel + 2] = 0;
                    this.flares.pixels[pixel + 3] = 0;
                }
            }
        }

        // Update the flares image (i.e. the red and green channels)
        for (var i = 0; i < nPixels; i++) {
            pixel = 4 * i;
            // pixelColor = this.flares.pixels[pixel + 2];
            this.flares.pixels[pixel] = 236;
            this.flares.pixels[pixel + 1] = 24;
            this.flares.pixels[pixel + 2] = 1;

        }

        this.flares.updatePixels();

        // Increase the time counter
        this.timeCounter += this.flaresActivity;
    };

    //
    // The paint method
    //
    Star.prototype.paint = function () {
        this.p5_instance.push();
        this.p5_instance.translate(this.position.x - this.imageWidth / 2, this.position.y - this.imageWidth / 2);
        this.p5_instance.image(this.flares, 0, 0);
        this.p5_instance.image(this.body, 0, 0);
        this.p5_instance.pop();
    };


    // Update the position with interpolation
    //
    Star.prototype.setPosition = function (target) {
        let deltaY = target - ypos;
        ypos += deltaY * easing;
        this.position = this.p5_instance.createVector(this.p5_instance.width / 2, ypos);
    };

    // mountain functions
    function mountains(p5_instance, closerColor, furtherColor, mistColor) {
        p5_instance.randomSeed(90);
        // Find the reference Y of each mountain
        let y0 = 0.8 * p5_instance.width; // First reference Y
        let i0 = 10; // Initial interval
        let cy = []; // Initialize the reference Y array

        for (let j = 0; j < 10; j++) {
            cy[9 - j] = y0;
            y0 -= i0 / p5_instance.pow(1.2, j);
        }

        let dx = 0;

        for (let j = 1; j < 10; j++) {
            let a = p5_instance.random(-p5_instance.width / 2, p5_instance.width / 2); // Random discrepancy between the sin waves
            let b = p5_instance.random(-p5_instance.width / 2, p5_instance.width / 2); // Random discrepancy between the sin waves
            let c = p5_instance.random(2, 4); // Random amplitude for the second sin wave
            let d = p5_instance.random(40, 50); // Noise function amplitude
            let e = p5_instance.random(-p5_instance.width / 2, p5_instance.width / 2); // Adds a discrepancy between the noise of each mountain

            for (let x = 0; x < p5_instance.width; x++) {
                let y = cy[j]; // Y = reference Y
                y += 10 * j * p5_instance.sin(2 * dx / j + a); // First sin wave oscillates according to j (the closer the mountain, the bigger the amplitude and smaller the frequency)
                y += c * j * p5_instance.sin(5 * dx / j + b); // Second sin wave has a random medium amplitude (affects more the further mountains) and bigger frequency
                y += d * j * p5_instance.noise(1.2 * dx / j + e); // First noise function adds randomness to the mountains, amplitude depends on a random number and increases with j, frequency decreases with j
                y += 1.7 * j * p5_instance.noise(10 * dx); // Second noise function simulates the canopy, it has high frequency and small amplitude depending on j so it is smoother on the further mountains

                p5_instance.strokeWeight(2); // Mountains look smoother with stroke weight of 2
                let temp_color = p5_instance.lerpColor(furtherColor, closerColor, j / 9);  //color 
                let temp_alfa = p5_instance.map(j / 9, 0, 1, 70, 300);;  //alpha
                p5_instance.stroke(p5_instance.red(temp_color), p5_instance.green(temp_color), p5_instance.blue(temp_color), temp_alfa);
                p5_instance.line(x, y, x, p5_instance.height);

                dx += 0.02;
            }

            for (let i = p5_instance.height; i > cy[j]; i -= 3) {
                let alfa = p5_instance.map(i, cy[j], p5_instance.height, 0, 360 / (j + 1)); // Alfa begins bigger for the further mountains
                p5_instance.strokeWeight(3); // Interval of 3 for faster rendering
                mistColor.setAlpha(alfa);
                p5_instance.stroke(mistColor);
                p5_instance.line(0, i, p5_instance.width, i);
            }
        }
    }
    
    
    const Sketch = (p, value, canvasRef) => {

        p.setup = () => {

            p.createCanvas(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
            p.background(220);
            p.background(0, 20, 80);


            // Create the sun
            let centerX = p.width / 2;
            let centerY = p.height / 2;
            let distance_radius = 100;
            let radius = 80;

            var fadingFactor = 0.8;
            var flaresActivity = 0.2;
            var imageWidth = Math.max(p.width, p.height);
            var flaresColor = 165

            let x = centerX;
            let y = centerY;
            let position = p.createVector(x, y);
            sun = new Star(p, position, radius, fadingFactor, flaresActivity, flaresColor, imageWidth);
            p.colorMode(p.RGB, 255, 255, 255, 360);

        };

        p.draw = () => {

            // this slider specifies the normalization range
            let val = 3;

            // draw background that fades stars slowly
            p.background(220);
            p.background(0, 20, 80, 1);

            // gradient 
            gradient_target = p.map(value.current["Sun Position"]["x"] * 3, val, 0, 0, 1);
            let delta_gradient = gradient_target - gradient;
            gradient += delta_gradient * easing;
            // day colors
            let c1 = p.color(255, 255, 232);  // bright yellow
            let c2 = p.color(200, 210, 255); //light blue
            // night colors
            let c3 = p.color(13, 0, 51); //dark blue
            let c4 = p.color(191, 31, 2); // sunset red

            let c_up = p.lerpColor(c1, c3, gradient)
            let c_down = p.lerpColor(c2, c4, gradient)

            // draw gradient
            for (let y = 0; y < p.height; y++) {
                let n = p.map(y, 0, p.height, 0, 1);
                let newc = p.lerpColor(c_up, c_down, n);
                p.stroke(newc);
                p.line(0, y, p.width, y);
            }

            // update the sun
            ytarget = p.map(value.current["Sun Position"] * 3, val, 0, 2 / 6 * p.height, 6 / 6 * p.height, true);
            sun.setPosition(ytarget)
            //Update the star
            //sun.update();
            // Paint the star
            sun.paint();

            // draw mountains
            // Define the colors
            let cFurther = p.color(172, 182, 230); // Purplish unsaturated light blue for the further mountains
            let cCloser = p.color(8, 17, 26); // Greeny saturated dark blue for the closer mountains
            let cMist = p.color(200, 200, 200); // White for the mist
            // p.background(230, 25, 90);
            mountains(p, cCloser, cFurther, cMist);

        };

    }
    return (
        <P5Wrapper sketch={Sketch} params={value}/>
    )
};


export default Sun;

