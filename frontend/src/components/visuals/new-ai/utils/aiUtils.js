import { useEffect, useRef } from "react";

/**
 * Format date to a long format (e.g., "May 01 2025")
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
export function formatDateToLong(dateString) {
  const date = new Date(dateString);
  const options = { month: "short", day: "2-digit", year: "numeric" };
  return date.toLocaleDateString("en-US", options).replace(",", "");
}

/**
 * Hook that automatically positions a popup based on available space
 * @param {boolean} open - Whether the popup is open
 * @param {function} setPosition - Function to set the position
 * @param {React.RefObject} popupRef - Reference to the popup element
 */
export function useAutoPositionPopup(open, setPosition, popupRef) {
  const lastPosition = useRef(null);

  useEffect(() => {
    if (!open || !popupRef.current) return;

    const rect = popupRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const canFitTop = spaceAbove > rect.height;
    const canFitBottom = spaceBelow > rect.height;

    // If we have a previous position and it still fits, keep it
    if (lastPosition.current === "top" && canFitTop) {
      setPosition("top");
      return;
    }
    if (lastPosition.current === "bottom" && canFitBottom) {
      setPosition("bottom");
      return;
    }

    // Otherwise, pick a new position
    let newPosition = "bottom";
    if (!canFitBottom && canFitTop) {
      newPosition = "top";
    }
    lastPosition.current = newPosition;
    setPosition(newPosition);
  }, [open, popupRef, setPosition]);
}