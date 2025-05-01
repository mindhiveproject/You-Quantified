import React, { act, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import useMeasure from "react-use-measure";

/**
 * An expandable button that shows text when hovered or active
 * 
 * @param {object} props
 * @param {string} props.icon - Material icon name
 * @param {string} props.text - Text to display when expanded
 * @param {function} props.onClick - Click handler function
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.active - Whether the button is in active state
 */
function AIExpandButton({ icon, text, onClick, className = "btn-outline-light", active, triggerHover = true }) {
  const [isHovering, setIsHovering] = useState(false);
  const [ref, { width }] = useMeasure();

  const isExpanded = (triggerHover && isHovering) || active

  return (
    <motion.button
      className={clsx(
        "btn",
        "d-flex justify-content-start align-items-center",
        "p-0 h-48px",
        "overflow-hidden",
        className,
        active && "active"
      )}
      animate={{ width }}
      transition={{ duration: 0.15 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
    >
      <div className="input-btn-layout" ref={ref}>
        <span className="material-symbols-outlined m-0">{icon}</span>
        <AnimatePresence>
          {(isExpanded) && (
            <motion.span
              key={"txt-" + text}
              className="ms-1 text-nowrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {text}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

export default AIExpandButton;