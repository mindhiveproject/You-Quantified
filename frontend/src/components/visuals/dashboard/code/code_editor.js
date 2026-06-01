import Editor from "@monaco-editor/react";
import downloadCode from "../../../../utility/code_download";
import { useOutsideAlerter } from "../../../../utility/outsideClickDetection";
import { useState, useRef, useEffect } from "react";
import { ExtensionsModal } from "./extensions_modal";

// Code Editor Made Using monaco-editor/react
// It has the advantage of using the same editor as VSCode
// Includes syntax highlighting and intellisense

export function CodeEditor({ code, setCode, isEditable }) {
  const settings = {
    minimap: {
      enabled: false,
    },
  };

  if (!isEditable) {
    settings["readOnly"] = true;
  } else {
    settings["readOnly"] = false;
  }

  return (
    <Editor
      value={code}
      theme="vs-dark"
      defaultLanguage="javascript"
      options={settings}
      onChange={(val) => setCode(val)}
    />
  );
}

export default function CodePane({
  code,
  setCode,
  visName,
  isEditable,
  extensions,
  errors,
  setErrors,
  setExtensions,
  setRemoteCode,
}) {
  // This is the component that contains the code pane
  const [showExtensions, setShowExtensions] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const extensionsRef = useRef(null);
  const errorsRef = useRef(null);

  useOutsideAlerter(extensionsRef, setShowExtensions);
  useOutsideAlerter(errorsRef, setShowErrors);

  const codeRef = useRef(code);
  const setCodeRef = (val) => {
    setCode(val);
    codeRef.current = val;
  };

  useEffect(() => {
    let codeUpdateInterval = setInterval(
      () => setRemoteCode(codeRef.current),
      30000,
    );

    const handleKeyDown = (event) => {
      const isSaveShortcut =
        (event.metaKey || event.ctrlKey) && event.key === "s";
      if (isSaveShortcut) {
        event.preventDefault();
        setRemoteCode(codeRef.current);
      }
    };

    window.addEventListener("beforeunload", () =>
      setRemoteCode(codeRef.current),
    );
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(codeUpdateInterval);
      setRemoteCode(codeRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", () =>
        setRemoteCode(codeRef.current),
      );
    };
  }, []);

  return (
    <div className="h-100 d-flex flex-column">
      <div className="menu-bar-code d-flex justify-content-between">
        <h6 className="ms-2 p-2 pt-3 align-self-center">script.js</h6>
        <div className="d-flex align-self-center position-relative">
          <button
            className="btn btn-link small-bar-button-dark"
            onClick={() => downloadCode(visName, code)}
          >
            <span className="material-symbols-outlined">download</span>
          </button>
          {isEditable &&
            <div className="d-flex">
              <button
                className="btn btn-link small-bar-button-dark"
                onClick={() => setShowExtensions(true)}
              >
                <span className="material-symbols-outlined">extension</span>
              </button>
              <button
                className="btn btn-link small-bar-button-dark position-relative"
                onClick={() => setShowErrors(true)}
              >
                <span
                  className={`material-symbols-outlined ${errors.some((e) => e?.type === "error") ? "text-danger" : ""}`}
                >
                  bug_report
                </span>
                {errors.length > 0 && (
                  <span
                    className={`position-absolute top-50 start-0 translate-middle badge rounded-pill ${errors.some((e) => e?.type === "error") ? "bg-danger" : "bg-secondary"}`}
                    style={{ fontSize: "9px" }}
                  >
                    {errors.length == 50 ? "50+" : errors.length}
                  </span>
                )}
              </button>
            </div>
          }
          {showExtensions && (
            <div ref={extensionsRef} className="extensions-popup">
              <ExtensionsModal
                extensions={extensions}
                setExtensions={setExtensions}
                setShowExtensions={setShowExtensions}
              />
            </div>
          )}
          {showErrors && (
            <div ref={errorsRef} className="extensions-popup">
              <ErrorsModal
                setShowErrors={setShowErrors}
                errors={errors}
                setErrors={setErrors}
              />
            </div>
          )}
        </div>
      </div>
      <div className="h-100">
        <CodeEditor code={code} setCode={setCodeRef} isEditable={isEditable} />
      </div>
    </div>
  );
}

function ErrorsModal({ setShowErrors, errors, setErrors }) {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mt-n3">
        <h5 className="mb-0">Console</h5>
        <div>
          {errors.length > 0 && (
            <button
              className="btn text-light btn-link p-0 me-2"
              onClick={() => setErrors([])}
              aria-label="Clear errors"
              title="Clear"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          )}
          <button
            className="btn text-light btn-link p-0"
            onClick={() => setShowErrors(false)}
            aria-label="Close modal"
          >
            <i className="bi bi-x fs-5"></i>
          </button>
        </div>
      </div>
      <div className="mt-2" style={{ maxHeight: "300px", overflowY: "auto" }}>
        {errors.length === 0 ? (
          <p className="text-light">No logs</p>
        ) : (
          <div className="d-flex flex-column gap-1">
            {errors.toReversed().map((log, index) => (
              <LogItem key={index} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogItem({ log }) {
  const isError = log?.type === "error";

  if (isError) {
    // Detect Safari in the code editor
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    const errorMessage = log?.message || "Unknown error";
    const errorStack = log?.stack || "";

    const lineno = log?.lineno;
    const colno = log?.colno;
    const lineInfo = lineno
      ? ` (Line ${lineno}${colno ? `:${colno}` : ""})`
      : "";

    const isMaskedError =
      errorMessage === "Script error" ||
      errorMessage === "Script error." ||
      errorMessage === "Unknown error";

    return (
      <div className="text-danger small py-1">
        {isSafari && isMaskedError && (
          <div className="text-warning mb-1 small">
            <strong>Safari:</strong> Error details may be limited. Check browser
            console.
          </div>
        )}
        <div className="d-flex align-items-start">
          <span
            className="material-symbols-outlined me-2"
            style={{ fontSize: "16px" }}
          >
            error
          </span>
          <div className="flex-grow-1">
            <div>
              <strong>{errorMessage}</strong>
              {lineInfo && (
                <span className="text-warning ms-1">{lineInfo}</span>
              )}
            </div>
            {errorStack && (
              <details className="mt-1">
                <summary className="text-white small">Stack trace</summary>
                <pre className="text-white mt-1 mb-0 small">{errorStack}</pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  const logMessage = log?.message || String(log);
  return (
    <div className="text-light small py-1 d-flex align-items-start">
      <span
        className="material-symbols-outlined me-2"
        style={{ fontSize: "16px" }}
      >
        terminal
      </span>
      <div className="flex-grow-1">{logMessage}</div>
    </div>
  );
}
