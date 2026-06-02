"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface PunchButtonProps {
  type: "CHECK_IN" | "CHECK_OUT";
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function PunchButton({
  type,
  onClick,
  loading = false,
  disabled = false,
}: PunchButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const label = type === "CHECK_IN" ? "Punch In" : "Punch Out";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className="btn-primary text-xl px-12 py-5 min-w-[240px] relative overflow-hidden"
      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              boxShadow: "0 8px 24px rgba(200, 85, 61, 0.25)",
            }
      }
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: 0.3,
      }}
      aria-label={label}
      id="punch-button"
    >
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
      ) : (
        <span>{label}</span>
      )}
    </motion.button>
  );
}
