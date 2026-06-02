"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";

export default function AnimatedBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldAnimate = mounted && !shouldReduceMotion;

  return (
    <div className="relative min-h-screen bg-cream overflow-hidden">
      {/* Decorative floating shapes — always rendered to avoid hydration mismatch */}
      <motion.div
        className="absolute top-[10%] right-[8%] w-[300px] h-[300px] rounded-full opacity-[0.04]"
        style={{ backgroundColor: "var(--primary-terracotta)" }}
        animate={
          shouldAnimate
            ? { y: [0, -20, 0], scale: [1, 1.05, 1] }
            : {}
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute bottom-[15%] left-[5%] w-[200px] h-[200px] rounded-full opacity-[0.03]"
        style={{ backgroundColor: "var(--muted-brown)" }}
        animate={
          shouldAnimate
            ? { y: [0, 15, 0], scale: [1, 1.03, 1] }
            : {}
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute top-[60%] right-[15%] w-[150px] h-[150px] rounded-full opacity-[0.03]"
        style={{ backgroundColor: "var(--warm-sand)" }}
        animate={
          shouldAnimate
            ? { y: [0, -12, 0] }
            : {}
        }
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

