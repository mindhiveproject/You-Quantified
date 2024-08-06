import React, { useRef, useEffect, useState } from "react";

export function DragElement({
  dragType,
  dragData,
  customDragImage,
  dragImageXOffset = 0,
  dragImageYOffset = 0,
  ...props
}) {
  const dragElementRef = useRef(null);

  useEffect(() => {
    const element = dragElementRef.current;

    const handleDragStart = (event) => {
      event.dataTransfer.setData(dragType, dragData);
      if (customDragImage) {
        event.dataTransfer.setDragImage(
          customDragImage,
          dragImageXOffset,
          dragImageYOffset
        );
      }
    };

    element.addEventListener("dragstart", handleDragStart);

    return () => {
      element.removeEventListener("dragstart", handleDragStart);
    };
  }, [dragType, dragData, customDragImage, dragImageXOffset, dragImageYOffset]);

  return <div {...props} draggable="true" ref={dragElementRef} />;
}

export function DropTarget({
  isDropAccepted,
  handleDragEnter,
  handleDrop,
  ...props
}) {
  const dropElementRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const element = dropElementRef.current;

    const handleDragEnterEvent = (event) => {
      if (isDropAccepted?.(event)) {
        event.preventDefault();
        setIsActive(true);
        handleDragEnter?.(event);
      }
    };

    const handleDragOverEvent = (event) => {
      if (isDropAccepted?.(event)) {
        event.preventDefault();
      }
    };

    const handleDragLeaveEvent = () => {
      if (isActive) {
        setIsActive(false);
      }
    };

    const handleDropEvent = (event) => {
      handleDrop?.(event);
      setIsActive(false);
    };

    element.addEventListener("dragenter", handleDragEnterEvent);
    element.addEventListener("dragover", handleDragOverEvent);
    element.addEventListener("dragleave", handleDragLeaveEvent);
    element.addEventListener("drop", handleDropEvent);

    return () => {
      element.removeEventListener("dragenter", handleDragEnterEvent);
      element.removeEventListener("dragover", handleDragOverEvent);
      element.removeEventListener("dragleave", handleDragLeaveEvent);
      element.removeEventListener("drop", handleDropEvent);
    };
  }, [isDropAccepted, handleDragEnter, handleDrop, isActive]);

  return (
    <div
      {...props}
      ref={dropElementRef}
      className={`drop-target ${isActive ? "active" : ""}`}
    />
  );
}
