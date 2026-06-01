import React, { useRef, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { EventMarkerStream } from "../../../devices/stream functions/event_markers";

export function P5iFrame({
  code,
  params,
  isExecuting = true,
  extensions,
  additionalScripts,
  isPaused,
  handleWindowMessage,
  handleWindowDismount = () => {},
  postRunScripts,
}) {
  const iframeRef = useRef(null);

  const paramsRef = useRef(params);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  paramsRef.current = params;

  const source = useMemo(() => {
    if (isExecuting === "false" || isExecuting === false) {
      return "";
    }

    // Sound library not working
    let additionalPackages = extensions || [];

    const scripts = additionalPackages
      .map((item) => `<script src=${item.url} crossorigin="anonymous"></script>`)
      .join("\n");
    return /* html */ `
      <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/p5@1.11.3/lib/p5.min.js" crossorigin="anonymous"></script>
        ${scripts}
        <style>
          body {
            margin: 0px;
            padding:0px;
            height: 100vh;
            width: 100vw;
          }
          * {
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div id="app"></div>
        <span id="error-display"></span>
        <script>${additionalScripts}</script>
        <script>
          window.addEventListener("error", (event) => {
            const errorInfo = {
              message: event.error?.message || event.message || 'Unknown error',
              stack: event.error?.stack || '',
              lineno: event.lineno - 65 || 0,
              colno: event.colno || 0,
              type: 'error'
            };
            sendEvent({log: errorInfo});
          });
          
          try {
            ${code}
            if (typeof window.setup === 'function') {
              const originalSetup = window.setup;
              window.setup = function() {
                try {
                  return originalSetup.apply(this, arguments);
                } catch (error) {
                  console.error('Error in setup:', error);
                  sendEvent({log: {
                    message: 'Error in setup: '+ error.message || String(error),
                    stack: error.stack || '',
                    type: 'error'
                  }});
                  throw error;
                }
              };
            }
            sendEvent({clearErrors: true});
            if (typeof window.draw === 'function') {
              const originalDraw = window.draw;
              window.draw = function() {
                try {
                  if (data?.["isVisualJSPaused"]) noLoop();
                  if (!data?.["isVisualJSPaused"]) loop();
                  return originalDraw.apply(this, arguments);
                } catch (error) {
                  console.error('Error in draw:', error);
                  sendEvent({log: {
                    message: 'Error in draw: '+ error.message || String(error),
                    stack: error.stack || '',
                    type: 'error'
                  }});
                  throw error;
                }
              };
            }
          } catch (error) {
            console.error('Error:', error);
            sendEvent({log: {
              message: error.message || String(error),
              stack: error.stack || '',
              type: 'error'
            }});
          }
        </script>
        <script>${postRunScripts || ""}</script>
      </body>
      </html>
      `;
  }, [code, extensions, isExecuting]);

  useEffect(() => {
    if (iframeRef.current != null) {
      const messageData = {
        ...paramsRef.current,
        isVisualJSPaused: isPaused
      };
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify(messageData)
      );
    }
  }, [params, isPaused]);

  function getWindowMessage(message) {
    if (message.source != iframeRef.current?.contentWindow) return;
    handleWindowMessage(message);
  }

  useEffect(() => {
    window.addEventListener("message", getWindowMessage);
    return () => {
      window.removeEventListener("message", getWindowMessage);
      handleWindowDismount();
    };
  }, []);

  return (
    <iframe
      id="visFrame"
      title="embedded-visualization"
      ref={iframeRef}
      srcDoc={source}
      allow="autoplay; encrypted-media"
      sandbox="allow-same-origin allow-scripts allow-downloads allow-popups allow-forms"
      referrerPolicy="strict-origin-when-cross-origin"
      className="h-100 w-100"
    />
  );
}