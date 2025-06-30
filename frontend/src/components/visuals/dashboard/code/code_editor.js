import Editor from "@monaco-editor/react";
import downloadCode from "../../../../utility/code_download";
import { useOutsideAlerter } from "../../../../utility/outsideClickDetection";
import { useState, useRef, useEffect } from "react";
import { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";

// Code Editor Made Using monaco-editor/react
// It has the advantage of using the same editor as VSCode
// Includes syntax highlighting and intellisense

export function CodeEditor({
  code,
  setCode,
  isEditable,
  collab,
  isDirty,
  setIsDirty,
}) {
  const settings = {
    minimap: {
      enabled: false,
    },
    readOnly: !isEditable,
    automaticLayout: true,
  };

  const [currentEditor, setCurrentEditor] = useState();
  const bindingRef = useRef();
  const saveTimeoutRef = useRef();

  const saveCode = () => {
    console.log("[Save Code] isDirty:", isDirty.current, "collab.root:", collab?.root, "isEditable:", isEditable);
    if (!isDirty.current || !collab?.root || !isEditable) return;

    const yText = collab.root.get("code");
    const currentText = yText.toString();

    console.log("[Save Code] Saving current text:", currentText);
    setCode(currentText);
    setIsDirty(false);
  };

  const handleEditorChange = () => {
    console.log("[Editor Change] Detected change in editor.");
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveCode, 2000);
  };

  // Initialize Monaco-Yjs binding for collaborative editing
  useEffect(() => {
    if (!currentEditor || !collab?.root) {
      console.log("[Initialize Binding] Editor or collab root not ready.");
      return;
    }

    const yText = collab.root.get("code");
    console.log("[Initialize Binding] Initial code:", code, "YText length:", yText.length);

    if (yText.length === 0 && code) {
      yText.insert(0, code);
    }

    bindingRef.current = new MonacoBinding(
      yText,
      currentEditor.getModel(),
      new Set([currentEditor]),
      collab.provider.awareness
    );
    console.log("[Initialize Binding] MonacoBinding initialized.");
  }, [collab?.root, currentEditor]);

  useEffect(() => {
    if (!collab?.root || !isEditable) {
      console.log("[Auto Save] Collab root or editor not editable.");
      return;
    }

    let updateInterval;

    // Backup save every 30 seconds
    updateInterval = setInterval(() => {
      if (isDirty) {
        console.log("[Auto Save] Performing periodic save.");
        saveCode();
      }
    }, 30000);

    // Save before page unload
    const handleBeforeUnload = () => {
      console.log("[Before Unload] Saving code before unload.");
      saveCode();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearTimeout(saveTimeoutRef.current);
      clearInterval(updateInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      console.log("[Cleanup] Final save and cleanup.");
      saveCode();
    };
  }, [collab?.root, isEditable, isDirty]);

  const handleMount = (editor) => {
    console.log("[Editor Mount] Editor mounted.");
    setCurrentEditor(editor);
  };

  return (
    <Editor
      onMount={handleMount}
      onChange={handleEditorChange}
      theme="vs-dark"
      defaultLanguage="javascript"
      options={settings}
    />
  );
}

export default function CodePane({
  code,
  setCode,
  visName,
  isEditable,
  extensions,
  setExtensions,
  collab,
  isDirty,
  setIsDirty,
}) {
  // This is the component that contains the code pane
  const [showExtensions, setShowExtensions] = useState(false);
  const extensionsRef = useRef(null);
  useOutsideAlerter(extensionsRef, setShowExtensions);

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
          <button
            className="btn btn-link small-bar-button-dark"
            onClick={() => setShowExtensions(true)}
          >
            <span className="material-symbols-outlined">extension</span>
          </button>
          {showExtensions && (
            <div ref={extensionsRef} className="extensions-popup">
              <ExtensionsModal
                extensions={extensions}
                setExtensions={setExtensions}
                setShowExtensions={setShowExtensions}
              />
            </div>
          )}
        </div>
      </div>
      <div className="h-100">
        <CodeEditor
          code={code}
          setCode={setCode}
          isEditable={isEditable}
          collab={collab}
          isDirty={isDirty}
          setIsDirty={setIsDirty}
        />
      </div>
    </div>
  );
}

function ExtensionsModal({ setShowExtensions, setExtensions, extensions }) {
  const [newExtensionStatus, setNewExtensionStatus] = useState();

  const handleFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setNewExtensionStatus("loading");

      const formData = new FormData(e.target);
      const submittedExtension = formData.get("extension-input")?.trim();

      if (!submittedExtension) {
        setNewExtensionStatus("error");
        return;
      }

      // Check for duplicate extensions
      if (
        extensions?.some((extension) => extension.url === submittedExtension)
      ) {
        setNewExtensionStatus("error");
        e.target.reset();
        return;
      }

      try {
        const packageInfo = await checkCDNPackage(submittedExtension);

        setNewExtensionStatus("success");
        setExtensions((prevExtensions) =>
          prevExtensions ? [...prevExtensions, packageInfo] : [packageInfo]
        );

        // Auto-hide success status after 2 seconds
        setTimeout(() => setNewExtensionStatus(null), 2000);
      } catch (error) {
        console.error("Extension validation error:", error);
        setNewExtensionStatus("error");
      }

      e.target.reset();
    },
    [extensions, setExtensions]
  );

  const deleteExtension = useCallback(
    (extensionToDelete) => {
      setExtensions((prevExtensions) =>
        prevExtensions.filter((extension) => extension !== extensionToDelete)
      );
    },
    [setExtensions]
  );

  return (
    <div>
      <div className="d-flex justify-content-end mt-n3">
        <button
          className="btn btn-link text-light p-0"
          onClick={() => setShowExtensions(false)}
          aria-label="Close modal"
        >
          <i className="bi bi-x fs-5"></i>
        </button>
      </div>
      <h4>Extensions</h4>
      <p>Link any additional JavaScript or P5.js extensions</p>
      <div>
        <ul className="list-group">
          {extensions?.map((extension, index) => (
            <ExtensionDisplayItem
              key={`${extension.url}-${index}`}
              extensionInfo={extension}
              deleteExtension={deleteExtension}
            />
          ))}

          {newExtensionStatus === "loading" && (
            <li className="list-group-item d-flex justify-content-between w-100 bg-transparent border-0 text-light ps-1 pe-1">
              <div
                className="spinner-border spinner-border-sm text-light"
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="ms-2">Validating extension...</span>
            </li>
          )}

          {newExtensionStatus === "error" && (
            <li className="list-group-item d-flex justify-content-between w-100 bg-transparent border-0 text-light ps-1 pe-1">
              <span className="text-danger">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Error adding the extension!
              </span>
            </li>
          )}

          {newExtensionStatus === "success" && (
            <li className="list-group-item d-flex justify-content-between w-100 bg-transparent border-0 text-light ps-1 pe-1">
              <span className="text-success">
                <i className="bi bi-check-circle me-1"></i>
                Extension added successfully!
              </span>
            </li>
          )}
        </ul>

        <form className="input-group mb-3 mt-3" onSubmit={handleFormSubmit}>
          <input
            type="text"
            className="form-control"
            name="extension-input"
            placeholder="e.g., https://cdn.jsdelivr.net/npm/p5@1.11.0/lib/p5.min.js"
            aria-label="Add new extensions"
            disabled={newExtensionStatus === "loading"}
          />
          <button
            className="btn btn-secondary text-dark border-grey btn-outline-light"
            type="submit"
            disabled={newExtensionStatus === "loading"}
          >
            {newExtensionStatus === "loading" ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              "+"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function ExtensionDisplayItem({ extensionInfo, deleteExtension }) {
  const cdnImageMap = {
    cdnjs: "https://avatars.githubusercontent.com/u/637362?s=280&v=4",
    jsdelivr:
      "https://pbs.twimg.com/profile_images/1285630920263966721/Uk6O1QGC_400x400.jpg",
  };

  const displayImage = cdnImageMap[extensionInfo?.origin];

  return (
    <li className="list-group-item d-flex justify-content-between w-100 bg-transparent border-0 text-light ps-1 pe-1">
      <div className="d-flex justify-content-start overflow-hidden h-100 w-100 align-items-center">
        {displayImage && (
          <img
            src={displayImage}
            alt={`${extensionInfo.origin} logo`}
            className="me-2"
            style={{ width: "20px", height: "20px", borderRadius: "4px" }}
          />
        )}
        <span className="me-2 fw-medium">{extensionInfo.name}</span>
        <span className="pe-1 truncate-text align-self-start text-muted small">
          {extensionInfo.extensionNames || extensionInfo.url}
        </span>
      </div>
      <button
        className="btn btn-link text-danger p-0 ms-2"
        aria-label={`Delete ${extensionInfo.name} extension`}
        onClick={() => deleteExtension(extensionInfo)}
        title="Remove extension"
      >
        <i className="bi bi-x"></i>
      </button>
    </li>
  );
}

// https://cdn.jsdelivr.net/npm/p5@1.11.0/lib/p5.min.js
//       "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/addons/p5.sound.js",
//      "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.35/Tone.min.js"

async function checkCDNPackage(inputURL) {
  // Validate URL format
  let packageURL;
  try {
    packageURL = new URL(inputURL);
  } catch {
    throw new Error("Input is not a valid URL");
  }

  const { hostname, pathname } = packageURL;

  // CDN configuration mapping
  const cdnConfigs = {
    cdnjs: {
      hostCheck: (host) => host.includes("cdnjs"),
      apiEndpoint: "https://api.cdnjs.com/libraries/",
      pathRegex: /\/libs\/([^/]+)\/([\w.\-+]+)\//,
      buildMetaURL: (endpoint, name, version) =>
        `${endpoint}${name}/${version}`,
      getFiles: (metadata) => metadata.files,
    },
    jsdelivr: {
      hostCheck: (host) => host.includes("jsdelivr"),
      apiEndpoint: "https://data.jsdelivr.com/v1/packages/npm/",
      pathRegex: /\/npm\/([^@]+)@([\w.\-+]+)\//,
      buildMetaURL: (endpoint, name, version) =>
        `${endpoint}${name}@${version}`,
      getFiles: (metadata) =>
        (metadata.files || []).map(unpackageFileNames).flat(),
    },
  };

  // Determine CDN type and extract package info
  let cdnConfig, name, version, origin;

  for (const [cdnName, config] of Object.entries(cdnConfigs)) {
    if (
      config.hostCheck(hostname) &&
      pathname.includes(cdnName === "jsdelivr" ? "npm" : "libs")
    ) {
      const matched = pathname.match(config.pathRegex);
      if (matched) {
        [, name, version] = matched;
        origin = cdnName;
        cdnConfig = config;
        break;
      }
    }
  }

  if (!cdnConfig) {
    throw new Error("Package not found in supported CDNs (jsdelivr or cdnjs)");
  }

  // Fetch package metadata
  const metaURL = cdnConfig.buildMetaURL(cdnConfig.apiEndpoint, name, version);

  try {
    const response = await fetch(metaURL);

    if (!response.ok) {
      throw new Error(`Metadata request failed with status ${response.status}`);
    }

    const packageMetadata = await response.json();

    if (packageMetadata?.status === 404) {
      throw new Error("Package not found");
    }

    // Extract filename and validate
    const filename = pathname.split("/").pop();
    const packageFiles = cdnConfig.getFiles(packageMetadata);

    return {
      name: packageMetadata.name,
      version: packageMetadata.version,
      url: packageURL.href,
      origin,
      extensionNames: packageFiles.includes(filename) ? filename : undefined,
    };
  } catch (error) {
    throw new Error(`Failed to fetch package metadata: ${error.message}`);
  }
}

function unpackageFileNames(file) {
  if (file.type === "directory") {
    return file.files ? file.files.map(unpackageFileNames).flat() : [];
  }
  return [file.name];
}
