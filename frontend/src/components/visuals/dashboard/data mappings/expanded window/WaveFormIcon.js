import { motion } from "framer-motion";

export function WaveFormIcon({ active = true, fill = "currentColor" }) {
  const bars = 5;
  const barWidth = 1.5;
  const gap = 2;
  const height = 16;
  const totalWidth = bars * barWidth + (bars - 1) * gap;

  const minHeight = 3;
  const maxHeight = 14;

  return (
    <svg
      width={totalWidth}
      height={height}
      viewBox={`0 0 ${totalWidth} ${height}`}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <motion.rect
          key={i}
          x={i * (barWidth + gap)}
          width={barWidth}
          fill={fill}
          initial={{
            height: minHeight,
            y: (height - minHeight) / 2,
          }}
          animate={
            active
              ? {
                  height: [minHeight, maxHeight, minHeight],
                  y: [
                    (height - minHeight) / 2,
                    (height - maxHeight) / 2,
                    (height - minHeight) / 2,
                  ],
                }
              : {
                  height: minHeight,
                  y: (height - minHeight) / 2,
                }
          }
          transition={
            active
              ? {
                  duration: 1.2 + i * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }
              : {
                  duration: 0.3,
                  ease: "easeOut",
                }
          }
        />
      ))}
    </svg>
  );
}
