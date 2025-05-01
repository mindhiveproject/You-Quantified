import React, { useRef, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { EventMarkerStream } from "../../../devices/stream functions/event_markers";

export function P5iFrame({
  code,
  params,
  isExecuting = true,
  extensions,
  additionalScripts,
  handleWindowMessage,
  handleWindowDismount = () => {},
  postRunScripts,
}) {
  const iframeRef = useRef(null);

  const paramsRef = useRef(params);

  paramsRef.current = params;

  useEffect(() => {
    if (isExecuting === "false" || isExecuting === false) {
      return;
    }

    // Sound library not working
    let additionalPackages = extensions || [];

    // Previous version
    // https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js
    const scripts = additionalPackages
      .map((item) => `<script src=${item.url}></script>`)
      .join("\n");
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
        <script>${additionalScripts}</script>
        <script>${code}</script>
        <script>${postRunScripts}</script>
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
      src="https://sandbox.youquantified.com"
      sandbox="allow-same-origin allow-scripts"
      className="h-100 w-100"
    />
  );
}
