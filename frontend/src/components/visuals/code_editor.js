import Editor from "@monaco-editor/react";
import downloadCode from "../../utility/code_download";

// Code Editor Made Using monaco-editor/react
// It has the advantage of using the same editor as VSCode
// Includes syntax highlighting and intellisense

export function CodeEditor({ code, setCode, isEditable }) {
  const settings = {
    minimap: {
      enabled: false,
    },
  };

  console.log(isEditable);

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
  return (
    <div className="h-100" style={{ backgroundColor: "#1A1A1A" }}>
      <div className="d-flex justify-content-between align-items-center">
        <h5
          className="ms-2 p-2 pt-3 align-self-center"
          style={{ color: "white", backgroundColor: "#1A1A1A" }}
        >
          Code
        </h5>
        <button
          className="btn btn-link"
          onClick={() => downloadCode(visName, code)}
        >
          <i className="bi bi-download code-download"></i>
        </button>
      </div>
      <CodeEditor code={code} setCode={setCode} isEditable={isEditable} />
    </div>
  );
}
