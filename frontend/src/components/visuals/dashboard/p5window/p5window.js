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
  extensions,
}) {
  // Window with the visuals. It loads and manages the React components that enter
  const params = useSelector(selectParamValues);

  const paramsRef = useRef(params);
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

  const { visID } = useParams();
  const eventStream = new EventMarkerStream(visID);

  function handleWindowMessage(message) {
    eventStream.streamEventMarkers(message);
  }

  function handleWindowDismount() {
    eventStream.unmountEventMarkers();
  }

  const additionalScripts = [errorScript, receiveValues, sendEvents].join("\n");

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
