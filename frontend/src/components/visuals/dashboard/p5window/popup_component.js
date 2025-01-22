
import React, {useRef, useEffect} from "react";
import { createRoot } from "react-dom/client";

export function PopupComponent({ params, code, children, setPopupVisuals }) {
  const popupRef = useRef(null);

  useEffect(() => {
    // Create a new window and assign it to popupRef.current
    popupRef.current = window.open(
      "",
      "_blank",
      `width=${window.innerWidth / 2}, height=${window.innerHeight}`
    );
    popupRef.current.document.title = "Visualization";
    popupRef.current.addEventListener("unload", () => setPopupVisuals(false));

    const styleElement = popupRef.current.document.createElement("style");

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
    popupRef.current.document.head.appendChild(styleElement);

    var rootDiv = popupRef.current.document.createElement("div");
    popupRef.current.document.body.appendChild(rootDiv);

    const root = createRoot(rootDiv);
    root.render(children);

    // Cleanup function
    return () => {
      root.unmount();
      popupRef.current.removeEventListener("unload", () =>
        setPopupVisuals(false)
      );
      popupRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (popupRef.current != null) {
      // Use popupRef.current instead of popupRef.current.contentWindow
      popupRef.current.opener.postMessage(
        JSON.stringify({ params, code }),
        window.location.origin
      );
    }
  }, [params, code]);
}

