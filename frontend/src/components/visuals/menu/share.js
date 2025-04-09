import { useState } from "react";

export function ShareMenu({ visURL, setShowShare }) {
  const [textCopied, setTextCopied] = useState(false);

  let textCopiedTimeout;
  function addURLParam() {
    const url = new URL(visURL);
    url.searchParams.set("dashboard", "false");
    return url.toString();
  }

  const nonDashboardURL = addURLParam();

  function copyURL(viewingLink) {
    if (textCopied && textCopiedTimeout) clearTimeout(textCopiedTimeout);
    setTextCopied(true);
    textCopiedTimeout = setTimeout(() => setTextCopied(false), 2000);
    const stringURL = viewingLink ? visURL : nonDashboardURL;
    navigator.clipboard.writeText(stringURL);
  }

  return (
    <div>
      <div className="d-flex justify-content-between">
        <button
          className="devices-close-btn h4 text-end"
          onClick={() => setShowShare(false)}
        >
          <i className="bi bi-x"></i>
        </button>
        <h5 className="mb-3">Share</h5>
      </div>
      <div className="input-group mb-2">
        <button className="btn btn-outline-dark" onClick={() => copyURL(true)}>
          Copy link
        </button>
        <input disabled value={visURL} className="form-control"></input>
      </div>

      {/*<div className="input-group mb-2">
        <button className="btn btn-outline-dark" onClick={() => copyURL(false)}>
          Visual only
        </button>
        <input disabled value={nonDashboardURL} className="form-control">
        </input>
      </div>*/}
      {textCopied && (
        <span className="text-body-tertiary">Link copied to clipboard!</span>
      )}
    </div>
  );
}
