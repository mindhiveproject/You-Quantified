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
export function P5AISandbox({
  code,
  params = {},
  setImage,
  setError,
  isExecuting,
  isVerifyingRef,
}) {
  const extensions = [];

  // Play marco polo here and just respond to an event that asks for the status.
  // If necessary, you can also wait, but this will always happen in response to an event.
  // There could be a boolean tracking it that gets sent with the event and otherwise can't be changed

  const additionalCode = `

        const polo = {
          state: "none",
          message: "",
        }

        window.addEventListener("error", ({ error }) => {
          var display = document.getElementById("error-display");
          if (display) display.innerText = error.message;
          polo.state = "error";
          polo.message = error.message;
          window.parent.postMessage({type: "executionStatus", state: "error", message: error.message}, "*");
        });

        windowResized = () => {
          // Allows the canvas to resize when you resize your window
          resizeCanvas(windowWidth, windowHeight);
        };

        var data = ${JSON.stringify(params)};
        window.addEventListener("message", (event)=>{
          if (event.data && typeof event.data === 'object') {
            if (event.data.type === "updateParams") {
              try {
                data = event.data.params || data;
              } catch (e) {
                console.error("Failed to parse parameters", e);
              }
            } else if (event.data.type === "requestStatus") {
              window.parent.postMessage({
                type: "statusUpdate", 
                state: polo.state, 
                message: polo.message
              }, "*");
            }
          }
        });
    `;

  const screenshotCode = `
      const oldDraw = draw;
      

      draw = () => {
        oldDraw();

        if (frameCount === 10) {
          polo.state = "success";
          polo.message = "";
          window.parent.postMessage({
            type: "executionStatus",
            state: "success", 
            frameCount: frameCount
          }, "*");
          
          // Optionally capture canvas for image
          try {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              const imageData = canvas.toDataURL('image/png');
              window.parent.postMessage({
                type: "canvasImage", 
                imageData: imageData
              }, "*");
            }
          } catch (e) {
            console.error("Failed to capture canvas", e);
          }
        }
      }

    `;

  function handleWindowMessage(event) {
    if (!event || !event.data) return;

    const message = event.data;
    
    if (!isVerifyingRef.current) return;

    console.log("Submitting error message...")

    if (message.type === "executionStatus") {
      setError(message);
      if (message.state === "success" && setImage && message.imageData) {
        setImage(message.imageData);
      }
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
