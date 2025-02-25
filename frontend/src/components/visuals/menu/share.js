import { useState } from "react"

export function ShareMenu({visURL}) {

    const [textCopied, setTextCopied] = useState(false);

    function copyURL() {
        navigator.clipboard.write(visURL)
    }

    return (
        <div className="d-flex">
            <h5>
                Share
            </h5>
            <button className="btn btn-outline-dark" onClick={copyURL}>
                Editing Link
            </button>
            <button className="btn btn-outline-dark" onClick={copyURL}>
                Viewing Link
            </button>
        </div>
    )
}