import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import clsx from "clsx";
import CodePane from "../../../dashboard/code/code_editor";
import { P5AISandbox } from "./P5AISandbox";
import AIDataManagementWindow from "./AIDataManagementWindow";
import AIExpandButton from "../ui/AIExpandButton";
import CreateButton from "./CreateButton";

/**
 * Right panel component for the AI visual generation interface
 * Handles code editing, parameter management, and preview functionality
 *
 * @param {object} props
 * @param {object} props.visualMetaAI - Visual metadata from AI
 * @param {boolean} props.isLoading - Whether the AI is currently generating
 * @param {boolean} props.isVerifying - Whether the code is being verified
 * @param {function} props.setError - Function to set error state
 */
function RightPannel({ visualMetaAI, isLoading, isVerifying, setError }) {
  const [currentTab, setCurrentTab] = useState("code");
  const [code, setCode] = useState(visualMetaAI?.code || "");
    useEffect(()=>{
    setCode(visualMetaAI?.code)
  }, [visualMetaAI?.code]);

  const [extensions, setExtensions] = useState([]);
  const isVerifyingRef = useRef(isVerifying);

  // Update ref when isVerifying changes
  useEffect(() => {
    isVerifyingRef.current = isVerifying;
    console.log("Verification state updated:", isVerifying);
  }, [isVerifying]);



  const [visInfo, setVisInfo] = useState({
    parameters: visualMetaAI?.parameters || [],
  });

  function changeParameters(newParams) {
    setVisInfo({ ...visInfo, parameters: newParams });
  }

  const hasValidParams =
    visInfo?.parameters &&
    visInfo?.parameters?.length > 0 &&
    visInfo?.parameters?.[0]?.name &&
    visInfo?.parameters?.[0]?.suggested;

  useEffect(() => {
    if (visualMetaAI?.code) setCode(visualMetaAI?.code);
    if (visualMetaAI?.parameters)
      setVisInfo({ parameters: visualMetaAI?.parameters });
  }, [visualMetaAI]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (hasValidParams) {
      dispatch({ type: "params/load", payload: visInfo?.parameters });
    }
  }, [visInfo]);

  /**
   * Automatically switch tabs when the AI has finished coding.
   * Switch back when it's coding.
   */
  useEffect(() => {
    if (!isLoading && isVerifying) {
      setTimeout(() => setCurrentTab("preview"), 1000);
    }
  }, [isLoading, isVerifying]);

  return (
    <div className="d-flex flex-column w-100 h-100">
      <div className="d-flex mb-0">
        <div className="me-n0-1">
          <AIExpandButton
            icon={"code"}
            text="Code"
            onClick={() => setCurrentTab("code")}
            className={clsx(
              isLoading ? "btn-outline-primary" : "btn-outline-light"
            )}
            active={currentTab === "code"}
            triggerHover={false}
          />
        </div>
        {hasValidParams && (
          <div className="me-n0-1">
            <AIExpandButton
              icon={"tune"}
              text="Dashboard"
              onClick={() => setCurrentTab("dashboard")}
              className={clsx(
                isLoading ? "btn-outline-primary" : "btn-outline-light"
              )}
              active={currentTab === "dashboard"}
              triggerHover={false}
            />
          </div>
        )}
        <AIExpandButton
          icon={"visibility"}
          text="Preview"
          onClick={() => setCurrentTab("preview")}
          className={clsx(
            isVerifying ? "btn-outline-primary" : "btn-outline-light"
          )}
          active={currentTab === "preview"}
          triggerHover={false}
        />
      </div>
      <div
        className={clsx(
          "w-100 h-100 position-relative",
          "bg-gray-500 text-white",
          "border border-primary"
        )}
      >
        <div
          className={`position-absolute top-0 w-100 pt-1 ${
            currentTab === "dashboard" ? "" : "d-none"
          }`}
        >
          <AIDataManagementWindow
            visInfo={visInfo}
            custom={true}
            changeParameters={changeParameters}
          />
        </div>
        <div className="w-100 h-100">
          {currentTab === "code" && (
            <CodePane
              visName={"AI-Generated Visual"}
              setCode={setCode}
              code={code}
              isEditable={!isLoading || !isVerifying}
              extensions={extensions}
              setExtensions={setExtensions}
            />
          )}
          {currentTab === "preview" && (
            <P5AISandbox
              setError={setError}
              code={code}
              isExecuting={!isLoading}
              isVerifyingRef={isVerifyingRef}
            />
          )}
        </div>
      </div>
      <div className="w-100 d-flex justify-content-between pb-2">
        {false && (
          <button
            className="btn btn-outline-warning h-48px d-flex align-items-center ps-3"
            disabled={true}
          >
            <span className="material-symbols-outlined m-0 me-1">
              prompt_suggestion
            </span>
            Review Changes
          </button>
        )}
        <CreateButton
          isDisabled={isLoading || isVerifying}
          visualMetaAI={visualMetaAI}
        />
      </div>
    </div>
  );
}

export default RightPannel;
