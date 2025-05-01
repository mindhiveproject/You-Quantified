import React from "react";
import clsx from "clsx";

/**
 * Component that renders a reference tag (visual or image)
 * 
 * @param {object} props
 * @param {object} props.reference - The reference object
 * @param {function} props.removeReference - Function to remove the reference
 */
function AdditionalReference({ reference, removeReference }) {
  return (
    <button
      className={clsx(
        "btn bg-gray-800 btn-outline-light text-white",
        "pt-0 pb-0 pe-2 ps-2 h-40px mb-1 me-1 max-width-ai-references",
        "d-flex align-items-center"
      )}
      onClick={() => removeReference(reference)}
    >
      {reference.type === "visual" && (
        <span className="material-symbols-outlined me-1">filter_vintage</span>
      )}
      {reference?.imgSrc && (
        <div className="d-flex h-100 me-2 ms-n2">
          <img src={reference.imgSrc} className="fit-cover square-ratio" alt={reference.name} />
        </div>
      )}
      <span className="truncate-text">{reference.name}</span>
      <span className="material-symbols-outlined ms-1">close_small</span>
    </button>
  );
}

export default AdditionalReference;