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
    <div className="edit-background">
      <div className="edit-popup" ref={ref} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

// The title row every modal starts with, with its close button.
export function ModalHeader({ title, onClose }) {
  return (
    <div className="d-flex justify-content-between">
      <button className="devices-close-btn h4 text-end" onClick={onClose} title="Close">
        <i className="bi bi-x"></i>
      </button>
      <h3 className="mb-3">{title}</h3>
    </div>
  );
}
