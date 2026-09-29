
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export function PopupComponent({ children, setPopupVisuals }) {
  // DOM node inside the popup window that children get portaled into.
  // Portaling (instead of a separate root) keeps the popup in this React tree,
  // so props like params and code flow in directly without postMessage.
  const [container, setContainer] = useState(null);

  useEffect(() => {
    const popup = window.open(
      "",
      "_blank",
      `width=${window.innerWidth / 2}, height=${window.innerHeight}`
    );
    popup.document.title = "Visualization";

    const handleUnload = () => setPopupVisuals(false);
    popup.addEventListener("unload", handleUnload);

    const styleElement = popup.document.createElement("style");

    // Set the CSS rules
    styleElement.textContent = `
        body {
          margin: 0px;
          padding:0px;
          height: 100vh;
          width: 100vw;
        }

        * {
          overflow: hidden;
        }

        div {
          width: 100vw;
          height: 100vh;
        }
        .h-100 {
          height: 100vh;
        }
        .w-100 {
          width: 100vw;
        }
      `;

    // Append the <style> element to the <head>
    popup.document.head.appendChild(styleElement);

    const rootDiv = popup.document.createElement("div");
    popup.document.body.appendChild(rootDiv);
    setContainer(rootDiv);

    // Cleanup function
    return () => {
      popup.removeEventListener("unload", handleUnload);
      setContainer(null);
      popup.close();
    };
  }, []);

  return container ? createPortal(children, container) : null;
}
