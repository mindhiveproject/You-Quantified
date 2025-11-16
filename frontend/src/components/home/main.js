import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react"

export default function HomePage() {
  return (
    <div>
      <div className="row h-95 align-items-center">
        <div className="col-6 ps-15 foreground">
          <Reveal>
            <h1 className="text-start fw-light mb-0">You:</h1>
          </Reveal>
          <Reveal>
            <h1 className="text-start">Quantified</h1>
          </Reveal>
          <Reveal>
            <p>
            A platform to bridge the gap between data and creativity, allowing you to connect biosensing devices to interactive and customizable real-time visuals.
            </p>
          </Reveal>
        </div>
        <div className="col-6 text-start foreground">
          <div className="mb-0 ps-5">
            <Link className="btn btn-dark w-btn me-3" to="/visuals">
              Explore Visuals
            </Link>
            <a
              className="btn btn-outline-dark w-btn me-3"
              href="https://docs.youquantified.com"
              target="_blank"
            >
              Docs
            </a>
          </div>
        </div>

        <HomeAnimations />
      </div>
      <motion.div
        className="git-btn"
        variants={{
          hidden: { opacity: 0, x: 75 },
          visible: { opacity: 1, x: 0 },
        }}
        initial="hidden"
        animate="visible"
        transition={{ delay: 1, duration: 0.8, type: "tween" }}
      >
        <a
          className="btn btn-primary btn-outline-dark btn-square text-light"
          href="https://github.com/esromerog/You-Quantified"
          target="_blank"
        >
          <i className="bi bi-github h5 margin-auto"></i>
        </a>
      </motion.div>
    </div>
  );
}

function Reveal({ children }) {
  return (
    <div className="overflow-hidden">
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 75 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5, duration: 0.8, type: "tween" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function HomeAnimations() {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i) => {
      //const delay = 1 + i * 0.5;
      const delay = 1;
      return {
        pathLength: 1,
        opacity: 1,
        transition: {
          pathLength: { delay, type: "spring", duration: 1.5, bounce: 0 },
          opacity: { delay, duration: 0.01 },
        },
      };
    },
  };
  return (
    <div className="main-background d-md-none d-lg-block">
      <motion.svg width="100%" height="100%" initial="hidden" animate="visible">
        <motion.line
          x1="calc(50vw + 31rem - 4.5px)"
          y1="0%"
          x2="calc(50vw + 31rem - 4.5px)"
          y2="calc(50% + 1.5rem + 1px)"
          stroke="#1A1A1A"
          strokeWidth={1}
          variants={draw}
          custom={2}
        />
        <motion.line
          x1="52vw"
          y1="calc(50% + 1.5rem + 0.5px)"
          x2="100vw"
          y2="calc(50% + 1.5rem + 0.5px)"
          stroke="#1A1A1A"
          strokeWidth={1}
          variants={draw}
          custom={2}
        />
        <motion.line
          x1="100vw"
          y1="calc(100vh - 60px - 3rem)"
          x2="calc(100vw - 3rem - 50px)"
          y2="calc(100vh - 60px - 3rem)"
          stroke="#1A1A1A"
          strokeWidth={1}
          variants={draw}
          custom={2}
        />
        <motion.line
          x1="calc(100vw - 3rem)"
          y1="100vh"
          x2="calc(100vw - 3rem)"
          y2="calc(100vh - 110px - 3rem)"
          stroke="#1A1A1A"
          strokeWidth={1}
          variants={draw}
          custom={2}
        />
      </motion.svg>
    </div>
  );
}
