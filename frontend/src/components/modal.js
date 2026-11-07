import { useEffect, useRef } from "react";
import { useOutsideAlerter } from "../utility/outsideClickDetection";

// A popup centered over the blurred page. Clicking outside it or pressing
// Escape closes it; anything else is up to its contents.
export function Modal({ onClose, children }) {
  const ref = useRef(null);
  useOutsideAlerter(ref, onClose);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="edit-background modal-backdrop-light">
      <div className="edit-popup" ref={ref} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

// The title row every modal starts with, with its close button.
export function ModalHeader({ title, onClose }) {
  return (
    <div className="modal-header-sticky d-flex justify-content-between align-items-center gap-3 mb-3">
      <h2 className="modal-title">{title}</h2>
      <button className="btn-icon" onClick={onClose} title="Close">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}
