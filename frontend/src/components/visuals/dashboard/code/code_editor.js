import Editor from "@monaco-editor/react";
import downloadCode from "../../../../utility/code_download";
import { useOutsideAlerter } from "../../../../utility/outsideClickDetection";
import { useState, useRef, useEffect } from "react";

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
  setExtensions,
  setRemoteCode,
}) {
  // This is the component that contains the code pane
  const [showExtensions, setShowExtensions] = useState(false);
  const extensionsRef = useRef(null);
  useOutsideAlerter(extensionsRef, setShowExtensions);

  useEffect(() => {
    let codeUpdateInterval = setInterval(() => setRemoteCode(code), 30000);
    const handleKeyDown = (event) => {
      const isSaveShortcut =
        (event.metaKey || event.ctrlKey) && event.key === "s";
      if (isSaveShortcut) {
        event.preventDefault();
        setRemoteCode(code);
      }
    };
    window.addEventListener("beforeunload", () => setRemoteCode(code));
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(codeUpdateInterval);
      setRemoteCode(code);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", () => setRemoteCode(code));
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
        <CodeEditor code={code} setCode={setCode} isEditable={isEditable} />
      </div>
    </div>
  );
}

function ExtensionsModal({ setShowExtensions, setExtensions, extensions }) {
  const [newExtensionStatus, setNewExtensionStatus] = useState();

  async function onFormSubmit(e) {
    e.preventDefault();
    setNewExtensionStatus("loading");
    const formData = new FormData(e.target);
    const submittedExtension = formData.get("extension-input");

    if (extensions.some((extension) => extension.url === submittedExtension)) {
      setNewExtensionStatus("error");
      e.target.reset();
      return;
    }

    const packageInfo = await checkCDNPackage(submittedExtension).catch((e) =>
      console.log(e)
    );
    //const packageInfo = await simpleCheckPackage(submittedExtension)

    if (!packageInfo) {
      setNewExtensionStatus("error");
    } else {
      setNewExtensionStatus();
      if (extensions) {
        setExtensions([...extensions, packageInfo]);
      } else {
        setExtensions([packageInfo]);
      }
    }
    e.target.reset();
  }

  function deleteExtension(extension) {
    const newExtensions = extensions.filter((item) => item !== extension);
    setExtensions(newExtensions);
  }

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
          {extensions?.map((extension) => (
            <ExtensionDisplayItem
              extensionInfo={extension}
              deleteExtension={deleteExtension}
            />
          ))}
          {newExtensionStatus === "loading" && (
            <li className="list-group-item d-flex justify-content-between w-100 bg-transparent border-0 text-light ps-1 pe-1">
              <div className="spinner-grow text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </li>
          )}
          {newExtensionStatus === "error" && (
            <li className="list-group-item d-flex justify-content-between w-100 bg-transparent border-0 text-light ps-1 pe-1">
              <span className="text-danger">Error adding the extension!</span>
            </li>
          )}
        </ul>
        <form className="input-group mb-3" onSubmit={onFormSubmit}>
          <input
            type="text"
            className="form-control"
            name="extension-input"
            placeholder="i.e. https://cdn.jsdelivr.net/npm/p5@1.11.0/lib/p5.min.js"
            aria-label="Add new extensions"
          />
          <button
            className="btn btn-secondary text-dark border-grey btn-outline-light"
            type="submit"
          >
            +
          </button>
        </form>
      </div>
    </div>
  );
}

function ExtensionDisplayItem({ extensionInfo, deleteExtension }) {
  let displayImage;
  if (extensionInfo?.origin === "cdnjs") {
    displayImage = "https://avatars.githubusercontent.com/u/637362?s=280&v=4";
  } else if (extensionInfo?.origin === "jsdelivr") {
    displayImage =
      "https://pbs.twimg.com/profile_images/1285630920263966721/Uk6O1QGC_400x400.jpg";
  }

  console.log(extensionInfo);

  return (
    <li className="list-group-item d-flex justify-content-between w-100 bg-transparent border-0 text-light ps-1 pe-1">
      <div className="d-flex justify-content-start overflow-hidden h-100 w-100">
        <span className=" me-2">{extensionInfo.name}</span>
        <span className="pe-1 truncate-text align-self-start">
          {extensionInfo.extensionNames || extensionInfo.url}
        </span>
      </div>
      <button
        className="btn btn-link text-danger p-0"
        aria-label="Delete extension"
        onClick={() => deleteExtension(extensionInfo)}
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
  // Step 1: Validate the URL
  let packageURL;
  try {
    packageURL = new URL(inputURL);
  } catch {
    throw new Error("Input is not a valid URL");
  }

  const { hostname, pathname } = packageURL;

  // Step 2: Identify the CDN, parse name & version
  let apiEndpoint = "";
  let name = "";
  let origin;
  let version = "";
  let matched = null;
  let metaURL = "";

  if (hostname.includes("cdnjs")) {
    origin = "cdnjs";
    apiEndpoint = "https://api.cdnjs.com/libraries/";
    matched = pathname.match(/\/libs\/([^/]+)\/([\w.\-+]+)\//);
    if (!matched) {
      throw new Error(
        "Could not parse package name and version from cdnjs URL"
      );
    }
    [, name, version] = matched; // destructuring match groups
    metaURL = `${apiEndpoint}${name}/${version}`;
  } else if (hostname.includes("jsdelivr") && pathname.includes("npm")) {
    origin = "jsdelivr";
    apiEndpoint = "https://data.jsdelivr.com/v1/packages/npm/";
    matched = pathname.match(/\/npm\/([^@]+)@([\w.\-+]+)\//);
    if (!matched) {
      throw new Error(
        "Could not parse package name and version from jsDelivr URL"
      );
    }
    [, name, version] = matched;
    metaURL = `${apiEndpoint}${name}@${version}`;
  } else {
    throw new Error("Package not found in jsdelivr or cdnjs");
  }

  // Step 3: Fetch metadata
  console.log("metaURL", metaURL);
  const packageMetadataRaw = await fetch(metaURL, {
    method: "GET",
  });

  if (!packageMetadataRaw.ok) {
    throw new Error(
      `Metadata request failed with status ${packageMetadataRaw.status}`
    );
  }

  const packageMetadata = await packageMetadataRaw.json();

  if (packageMetadata?.status === 404) {
    throw new Error("Endpoint not found");
  }

  // Step 4: Extract filename from the path
  const filename = pathname.split("/").pop();

  // Step 5: Identify the list of files
  let packageFiles;
  if (hostname.includes("cdnjs")) {
    packageFiles = packageMetadata.files;
  } else {
    packageFiles = (packageMetadata.files || []).map(unpackageFileNames);
  }

  // Step 6: Prepare final info
  const packageInfo = {
    name: packageMetadata.name,
    version: packageMetadata.version,
    url: packageURL.href,
    origin,
    extensionNames: undefined,
  };

  // Step 7: Check if the given filename is in the list
  if (packageFiles.includes(filename)) {
    packageInfo.extensionNames = filename;
  }

  return packageInfo;
}

function unpackageFileNames(file) {
  if (file.type === "directory") {
    return unpackageFileNames(file.files);
  } else {
    return file.name;
  }
}
