import { P5iFrame } from "./p5iframe";
import React, { useEffect, useState } from "react";

export function P5PopupVisuals({
  secureOrigin,
  initialCode,
  initialParams,
  isExecuting,
  extensions,
  additionalScripts,
  handleWindowMessage,
}) {
  const [params, setParams] = useState(initialParams);
  const [code, setCode] = useState(initialCode);

  function receiveEvent(event) {
    if (event.origin === secureOrigin) {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        msg = { params, code };
      }
      setParams(msg.params);
      setCode(msg.code);
    }
  }

  useEffect(() => {
    window.addEventListener("message", receiveEvent);
    return () => {
      window.removeEventListener("message", receiveEvent);
    };
  }, []);

  return (
    <div className="h-100 w-100">
      <P5iFrame
        params={params}
        code={code}
        isExecuting={isExecuting}
        extensions={extensions}
        additionalScripts={additionalScripts}
        handleWindowMessage={handleWindowMessage}
        handleWindowDismount={handleWindowDismount}
      />
    </div>
  );
}
