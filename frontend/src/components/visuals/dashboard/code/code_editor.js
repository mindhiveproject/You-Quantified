import Editor from "@monaco-editor/react";
import downloadCode from "../../../../utility/code_download";
import { useOutsideAlerter } from "../../../../utility/outsideClickDetection";
import { useState, useRef } from "react";

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
      defaultPath="./viscards.js"
      theme="vs-dark"
      defaultLanguage="javascript"
      options={settings}
      onChange={(val) => setCode(val)}
    />
  );
}

export default function CodePane({ code, setCode, visName, isEditable }) {
  // This is the component that contains the code pane
  const [showExtensions, setShowExtensions] = useState(false);
  const extensionsRef = useRef(null);
  useOutsideAlerter(extensionsRef, setShowExtensions);

  return (
    <div className="h-100">
      <div className="menu-bar-code d-flex justify-content-between">
        <h6 className="ms-2 p-2 pt-3 align-self-center">script.js</h6>
        <div className="d-flex align-self-center">
          <button
            className="btn btn-link d-flex align-items-center justify-content-center"
            onClick={() => downloadCode(visName, code)}
          >
            <span className="material-symbols-outlined">download</span>
          </button>
          {/*<button className="btn btn-link" onClick={() => setShowPlugins(true)}>
            <span class="material-symbols-outlined">extension</span>
          </button>*/}
          {showExtensions && (
            <div ref={extensionsRef}>
              <ExtensionsModal />
            </div>
          )}
        </div>
      </div>
      <CodeEditor code={code} setCode={setCode} isEditable={isEditable} />
    </div>
  );
}

function ExtensionsModal() {
  return (
    <div>
      <p>Extensions</p>
      <p>
        Add the link to any additional JavaScript extensions your visual may
        require
      </p>
      <div>
        <div>
          <span></span>
          <button className="btn btn-link">
            <i className="bi bi-x"></i>
          </button>
        </div>
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="i.e. https://cdn.jsdelivr.net/npm/p5@1.11.0/lib/p5.min.js"
          />
          <button clasNames="btn btn-link" type="button" onClick={() => {}}>
            <i className="bi bi-plus"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
