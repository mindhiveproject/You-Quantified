import { PopupComponent } from "./popup_component";
import { P5PopupVisuals } from "./p5popup";
import { P5iFrame } from "./p5iframe";
import { FullScreen } from "react-full-screen";
import { useSelector } from "react-redux";
import React, { useRef } from "react";
import { selectParamValues } from "../../utility/selectors";
import { useSearchParams, useParams } from "react-router-dom";
import { EventMarkerStream } from "../../../devices/stream functions/event_markers";

export function VisualsWindow({
  visMetadata,
  code,
  fullScreenHandle,
  popupVisuals,
  setPopupVisuals,
  isPaused,
  setErrors,
  extensions,
}) {
  // Window with the visuals. It loads and manages the React components that enter
  const params = useSelector(selectParamValues);

  const paramsRef = useRef(params);
  paramsRef.current = params;

  const errorScript = `
    const originalLog = console.log;
    console.log = function(...args) {
      originalLog.apply(console, args);
      const logMessage = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      sendEvent({log: {message: logMessage, type: 'log'}});
    };
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

  const { visID } = useParams();
  const eventStream = new EventMarkerStream(visID);

  function handleWindowMessage(message) {
    let parsedData;
    try {
      parsedData = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
    } catch (e) {
      console.error('Failed to parse message data:', e);
      return;
    }

    if (parsedData?.log) {
      if (parsedData.log.type === 'error') {
        console.error('Error from visual:', parsedData.log);
      }
      setErrors((logs) => [...logs, parsedData.log].slice(-50));
      return;
    }

    
    if (parsedData?.clearErrors) {
      setErrors([]);
      return;
    }



    eventStream.streamEventMarkers(parsedData);
  }

  function handleWindowDismount() {
    eventStream.unmountEventMarkers();
  }

  const additionalScripts = [sendEvents, errorScript, receiveValues].join("\n");

  const [searchParams, setSearchParams] = useSearchParams();
  const isExecuting = searchParams.get("execute");

  return (
    <div className={`${popupVisuals ? "d-none" : "h-100 w-100"}`}>
      {!popupVisuals && (
        <div className="w-100 h-100">
          <FullScreen handle={fullScreenHandle} className="w-100 h-100">
            <P5iFrame
              code={code}
              params={params}
              isExecuting={isExecuting}
              extensions={extensions}
              additionalScripts={additionalScripts}
              handleWindowMessage={handleWindowMessage}
              handleWindowDismount={handleWindowDismount}
              isPaused={isPaused}
            />
          </FullScreen>
        </div>
      )}
      {popupVisuals && (
        <PopupComponent
          params={params}
          code={code}
          setPopupVisuals={setPopupVisuals}
        >
          <P5PopupVisuals
            secureOrigin={window.location.origin}
            initialCode={code}
            initialParams={params}
            isExecuting={isExecuting}
            extensions={extensions}
            additionalScripts={additionalScripts}
            handleWindowMessage={handleWindowMessage}
            handleWindowDismount={handleWindowDismount}
          />
        </PopupComponent>
      )}
    </div>
  );
}
