import { PopupComponent } from "./popup_component";
import { P5PopupVisuals } from "./p5popup";
import { P5iFrame } from "./p5iframe";
import { FullScreen } from "react-full-screen";
import { useSelector } from "react-redux";
import React, { useEffect, useRef, useState } from "react";
import { selectParamValues } from "../../utility/selectors";
import { useSearchParams } from "react-router-dom";
import { useFullScreenHandle } from "react-full-screen";

export function VisualsWindow({
  visMetadata,
  code,
  fullScreenHandle,
  popupVisuals,
  setPopupVisuals,
}) {
  // Window with the visuals. It loads and manages the React components that enter
  const params = useSelector(selectParamValues);

  const paramsRef = useRef(params);
  paramsRef.current = params;

  const [component, setComponent] = useState(null);

  /*
  useEffect(() => {
    // The following function imports components that are not P5.js visuals by using the default export
    // Checks engine to see if it should handle it as a P5.js visualization
    if (!visMetadata?.editable) {
      importComponent();
    }

    async function importComponent() {
      // All components are placed in this path
      const module = await import(
        `../../../assets/visuals/${visMetadata.path}`
      );
      const CustomComponent = module.default;
      setComponent(<CustomComponent value={paramsRef} />);
    }
  }, [code]);*/

  const [searchParams, setSearchParams] = useSearchParams();
  const isExecuting = searchParams.get("execute");

  return (
    <div className={`${popupVisuals ? "d-none" : "h-100 w-100"}`}>
      {!popupVisuals && (
        <div className="w-100 h-100">
          {params && visMetadata?.editable ? (
            <FullScreen handle={fullScreenHandle} className="w-100 h-100">
              <P5iFrame code={code} params={params} isExecuting={isExecuting} />
            </FullScreen>
          ) : (
            component
          )}
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
          />
        </PopupComponent>
      )}
    </div>
  );
}
