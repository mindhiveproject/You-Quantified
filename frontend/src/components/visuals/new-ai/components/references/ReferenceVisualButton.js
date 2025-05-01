import React, { useRef, useState } from "react";
import clsx from "clsx";
import { useOutsideAlerter } from "../../../../../utility/outsideClickDetection";
import { AIExpandButton } from "../ui";
import ReferenceVisualModal from "./ReferenceVisualModal";
import { useAutoPositionPopup } from "../../utils/aiUtils";

/**
 * Button that opens a modal to search and select visual references
 * 
 * @param {object} props
 * @param {function} props.addReference - Function to add a new reference
 * @param {Array} props.additionalReferences - Array of currently added references
 */

function ReferenceVisualButton({ addReference, additionalReferences }) {
  const refModalRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [position, setPosition] = useState("top");

  // useAutoPositionPopup(showModal, setPosition, refModalRef);
  useOutsideAlerter(refModalRef, setShowModal);

  return (
    <div className="position-relative">
      <AIExpandButton
        icon={"filter_vintage"}
        text={"Link a visual"}
        onClick={() => setShowModal(true)}
        active={showModal}
      />
      {showModal && (
        <div
          className={clsx(
            "bg-black border-light",
            "position-absolute w-300px z-3",
            {
              "popup-bottom": position === "bottom",
              "popup-top": position === "top",
              "popup-left": position === "left",
              "popup-right": position === "right",
            }
          )}
          ref={refModalRef}
        >
          <ReferenceVisualModal
            addReference={addReference}
            setShowModal={setShowModal}
            additionalReferences={additionalReferences}
          />
        </div>
      )}
    </div>
  );
}

export default ReferenceVisualButton;