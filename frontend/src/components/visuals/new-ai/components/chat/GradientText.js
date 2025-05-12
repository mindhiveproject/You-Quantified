import React from "react";
import { motion, useTime, useTransform } from "motion/react";

function GradientVerifyingText({ children }) {
  const time = useTime();
  const rotate = useTransform(time, (t) => Math.sin(t / 1000) * 25 + 25);
  const movingBg = useTransform(rotate, (r) => {
    const val = Math.round(r);
    return `-webkit-linear-gradient(0deg, #1BD29A -${val}%, #9747FF ${
      50-val
    }%)`;
  });

  return (
    <motion.p
      className="gradient-text-clip"
      style={{
        background: movingBg,
      }}
    >
      {children}
    </motion.p>
  );
}

export default GradientVerifyingText;
