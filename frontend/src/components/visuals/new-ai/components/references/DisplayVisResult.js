import React from "react";
import { formatDateToLong } from "../../utils/aiUtils";

/**
 * Component that displays a search result for a visual
 *
 * @param {object} props
 * @param {object} props.visInfo - Information about the visual
 * @param {function} props.addReference - Function to add a reference
 * @param {function} props.setShowModal - Function to control modal visibility
 * @param {boolean} props.hasBeenAdded - Whether the visual has already been added as a reference
 */
function DisplayVisResult({
  visInfo,
  addReference,
  setShowModal,
  hasBeenAdded,
  showImage,
}) {

  function handleClick() {
    
    addReference({
      name: visInfo?.title,
      id: visInfo?.id,
      type: "visual",
      codeURL: visInfo?.code?.url,
      visParameters: visInfo?.parameters,
    });

    if (setShowModal) {
      setShowModal(false);
    }
  }

  return (
    <button
      className="btn btn-outline-light btn-hover-primary bg-gray-800 w-100 text-white p-0 mb-1 text-start"
      onClick={handleClick}
      disabled={hasBeenAdded}
    >
      {showImage && visInfo?.cover?.url && (
        <img
          src={visInfo?.cover?.url}
          className="d-flex w-100 mb-1 fit-cover square-ratio"
        />
      )}
      <div className="p-2">
        <div className="d-flex p-0 pb-1 justify-content-between align-items-center">
          <h5 className="m-0">{visInfo?.title}</h5>
          {hasBeenAdded && (
            <span className="material-symbols-outlined">check_small</span>
          )}
        </div>
        <div className="d-flex w-100 justify-content-between">
          <span className="truncate-text text-gray-600">
            {visInfo?.author?.name}
          </span>
          <span className="truncate-text text-gray-600">
            {formatDateToLong(visInfo?.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

export default DisplayVisResult;
