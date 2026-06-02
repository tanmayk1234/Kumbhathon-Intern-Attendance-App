"use client";

import { motion, useReducedMotion } from "framer-motion";

type RadarState = "scanning" | "success" | "error";

interface LocationRadarProps {
  state: RadarState;
  size?: number;
}

export default function LocationRadar({
  state,
  size = 200,
}: LocationRadarProps) {
  const shouldReduceMotion = useReducedMotion();
  const center = size / 2;
  const rings = [0.3, 0.6, 0.9]; // Ring radius multipliers

  if (state === "success") {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
        role="status"
        aria-label="Location verified"
      >
        <motion.div
          className="rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--success-green)" }}
          initial={{ scale: shouldReduceMotion ? 1 : 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <svg
            width={size * 0.4}
            height={size * 0.4}
            viewBox="0 0 40 40"
            fill="none"
            style={{ padding: size * 0.1 }}
          >
            <motion.path
              d="M10 20 L17 27 L30 13"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            />
          </svg>
        </motion.div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
        role="status"
        aria-label="Location verification failed"
      >
        <motion.div
          className="rounded-full flex items-center justify-center"
          style={{
            backgroundColor: "var(--error-red)",
            width: size * 0.4,
            height: size * 0.4,
          }}
          initial={{ scale: shouldReduceMotion ? 1 : 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <svg
            width={size * 0.2}
            height={size * 0.2}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M6 6L18 18M6 18L18 6"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      </div>
    );
  }

  // Scanning state
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Scanning location"
    >
      {/* Pulsing concentric rings */}
      {rings.map((multiplier, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full border-2"
          style={{
            borderColor: "var(--primary-terracotta)",
            width: size * multiplier,
            height: size * multiplier,
          }}
          initial={{ opacity: 0.6, scale: shouldReduceMotion ? 1 : 0.8 }}
          animate={
            shouldReduceMotion
              ? { opacity: [0.3, 0.6, 0.3] }
              : {
                  opacity: [0.6, 0.15, 0.6],
                  scale: [0.8, 1.1, 0.8],
                }
          }
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: index * 0.4,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Center dot */}
      <motion.div
        className="absolute rounded-full"
        style={{
          backgroundColor: "var(--primary-terracotta)",
          width: 12,
          height: 12,
        }}
        animate={
          shouldReduceMotion
            ? {}
            : { scale: [1, 1.3, 1] }
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Sweep line */}
      {!shouldReduceMotion && (
        <motion.div
          className="absolute"
          style={{
            width: 2,
            height: center * 0.9,
            backgroundColor: "var(--primary-terracotta)",
            opacity: 0.4,
            transformOrigin: "bottom center",
            bottom: center,
            left: center - 1,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
    </div>
  );
}
