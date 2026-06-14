import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export default function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{
        scaleX,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        originX: 0,
        zIndex: 100,
        background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)",
      }}
    />
  );
}
