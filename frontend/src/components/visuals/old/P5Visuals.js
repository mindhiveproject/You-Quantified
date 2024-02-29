import P5 from "p5";
import React, { useEffect, useRef, useState } from "react";

window.p5 = P5;
require("p5/lib/addons/p5.sound");

const P5Visuals = ({ value, code }) => {
  const [error, setError] = useState(false);
  const blacklist = ["document.", "http", "/>", "eval", "decode", "window."];

  let cleanCode = "";

  function blacklistCharacters(inputString, blacklist) {
    // Check if the input string contains any blacklisted characters
    const utf8Data = inputString.replace(/[^\x20-\x7E]+/g, "");

    for (let i = 0; i < blacklist.length; i++) {
      if (inputString.includes(blacklist[i])) {
        console.log("Invalid string...");
        inputString.replace(blacklist[i], "");
      }
    }

    // If no blacklisted characters are found, return the input string
    return inputString;
  }

  const regexSetup =
    /p\.setup\s*=\s*(?:\(\)\s*=>\s*{([^}]+)}|function\s*\(\s*\)\s*{([^}]+)})\s*;\s*p\.draw/g;
  const regexDraw =
    /p\.draw\s*=\s*(?:\(\)\s*=>\s*{([^]*)}|function\s*\(\s*\)\s*{([^]*)})/s;

  cleanCode = code
    .replace(
      regexSetup,
      (match, capturedCode) =>
        `p.setup = () => { \ntry {\n${capturedCode}\n} catch (e) {\nconsole.log(e);\n} \n} \np.draw`
    )
    .replace(
      regexDraw,
      (match, capturedCode) =>
        `p.draw = () => { \ntry {\n${capturedCode}\n} catch (e) {\nconsole.log(e);\n} \n}`
    );

  cleanCode = blacklistCharacters(cleanCode, blacklist);
  useEffect(() => {
    setError(false);
  }, [code]);

  const canvas = <P5Wrapper value={value} code={cleanCode} />;



  return canvas && !error ? canvas : errorScreen;
};

const P5Wrapper = ({ value, code }) => {
  const canvasRef = React.useRef();
  let Q;
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const sketch = new Function("p", "value", "canvasRef", code);
      Q = new P5((p) => sketch(p, value, canvasRef), canvasRef.current);
      setError(false);
    } catch (e) {
      Q = new P5(function q() {}, canvasRef.current);
      setError(e);
      console.log(e);
    }
    canvasRef.current.firstChild.style.visibility = "visible";

    let observer = new ResizeObserver(function () {
      updateCanvasDimensions();
    });

    observer.observe(canvasRef.current);

    function updateCanvasDimensions() {
      Q.createCanvas(
        canvasRef.current.offsetWidth,
        canvasRef.current.offsetHeight
      );
      Q.redraw();
    }

    // Super important cleanup function
    return () => {
      Q.noLoop();
      Q.remove();
      observer.disconnect();
    };
  }, [code]);

  const errorScreen = (
    <div className="d-flex justify-content-start align-items-center mt-3 error-screen">
      {error.toString()}
    </div>
  );
  //  className="h-100"
  return (
    <>
      <div ref={canvasRef} className={`w-100 h-100`} />
      {error && errorScreen}
    </>
  );
};

export default P5Visuals;
