import React from "react";
import { P5iFrame } from "../../../dashboard/p5window/p5iframe";

/**
 * P5.js sandbox component for the AI visual generation interface
 * Provides a sandboxed environment to run and preview generated P5.js code
 * 
 * @param {object} props
 * @param {string} props.code - The P5.js code to execute
 * @param {object} props.params - Parameters for the visual
 * @param {function} props.setImage - Function to save the generated image
 * @param {function} props.setError - Function to handle errors
 * @param {boolean} props.isExecuting - Whether the code is currently executing
 */
export function P5AISandbox({ code, params = {}, setImage, setError, isExecuting }) {
  const extensions = [];

  const additionalCode = `
        window.addEventListener("error", ({ error }) => {
          var display = document.getElementById("error-display");
          display.innerText = error.message;
          window.parent.postMessage({"state": "error", "message": error.message});
        });

        windowResized = () => {
          // Allows the canvas to resize when you resize your window
          resizeCanvas(windowWidth, windowHeight);
        };

        var data = ${JSON.stringify(params)};
        window.addEventListener("message", (event)=>{
          if (event.origin === "${window.location.origin}") {
            data = JSON.parse(event.data);
          }
        })
    `;

  const screenshotCode = `
      const oldDraw = draw;
      
      draw = () => {
        oldDraw();

        if (frameCount === 10) {
          window.parent.postMessage({"state": "success"})
        }
      }
    `;

  function handleWindowMessage(message) {
    console.log("Window message", message);
    if (message?.data?.state === "error") {
      setError?.((prevError) => (prevError += message.data.message));
    } else if (message?.data?.state === "success") {
      setError?.("success");
    }
  }

  return (
    <div className="h-100 w-100">
      <P5iFrame
        code={code}
        params={params}
        isExecuting={!code || isExecuting}
        extensions={extensions}
        handleWindowMessage={handleWindowMessage}
        additionalScripts={additionalCode}
        postRunScripts={screenshotCode}
      />
    </div>
  );
}