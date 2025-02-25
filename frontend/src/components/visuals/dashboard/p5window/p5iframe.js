import React, { useRef, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { EventMarkerStream } from "../../../devices/stream functions/event_markers";

export function P5iFrame({ code, params, isExecuting, extensions }) {
  const iframeRef = useRef(null);

  const { visID } = useParams();
  const paramsRef = useRef(params);

  const eventStream = new EventMarkerStream(visID);
  paramsRef.current = params;

  const errorScript = `
    window.addEventListener("error", ({ error }) => {
      console.log(error);
      var display = document.getElementById("error-display");
      display.innerText = error.message;
    });
    `;

  const receiveValues = `
    var data = ${JSON.stringify(params)};
    window.addEventListener("message", (event)=>{
      if (event.origin === "${window.location.origin}") {
        data = JSON.parse(event.data);
      }
    })
    `;

  const sendEvents = `
    function sendEvent(message) {
      if (typeof message === 'object') {
        window.parent.postMessage(JSON.stringify(message));
      }
    }
  `;

  useEffect(() => {
    if (isExecuting === "false") {
      return;
    }

    // Sound library not working
    let additionalPackages = extensions || [];

    // Previous version
    // https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js
    const scripts = additionalPackages.map((item) => `<script src=${item.url}></script>` ).join('\n');
    const source = /* html */ `
      <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/p5@1.11.3/lib/p5.min.js"></script>
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
        <script>${receiveValues}</script>
        <script>${sendEvents}</script>
        <script>${errorScript}</script>
        <script>${code}</script>
      </body>
      </html>
      `;
    iframeRef.current.srcdoc = source;
  }, [code, extensions]);

  useEffect(() => {
    if (iframeRef.current != null) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify(paramsRef.current)
      );
    }
  }, [params]);

  function handleWindowMessage(message) {
    if (message.source != iframeRef.current?.contentWindow) return;
    eventStream.streamEventMarkers(message);
  }

  useEffect(() => {
    window.addEventListener("message", handleWindowMessage);
    return () => {
      window.removeEventListener("message", handleWindowMessage);
      eventStream.unmountEventMarkers();
    };
  }, []);

  return (
    <iframe
      id="visFrame"
      title="embedded-visualization"
      ref={iframeRef}
      src="https://sandbox.youquantified.com"
      sandbox="allow-same-origin allow-scripts"
      className="h-100 w-100"
    />
  );
}
