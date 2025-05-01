import React from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

/**
 * A navigation button that returns to the Visuals page
 */
function BackButton() {
  return (
    <Link
      className="btn btn-ai-back m-0 ms-3 p-0 h5 d-flex align-items-center"
      transition={{ type: "tween", ease: "easeIn" }}
      to='/visuals'
    >
      <span className="material-symbols-outlined">keyboard_arrow_left</span>
      <span className="fw-normal">
        You: <span className="fw-bold">Quantified</span>
      </span>
    </Link>
  );
}

export default BackButton;