"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  velocityX: number;
  velocityY: number;
}

const COLORS = ["#C8553D", "#FBF6EE", "#F2E4D0", "#8B3A2A", "#6B4F3F"];

export default function ConfettiBurst({ duration = 2000 }: { duration?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisible(false);
      return;
    }

    // Generate particles
    const generated: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 40,
      size: Math.random() * 8 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      velocityX: (Math.random() - 0.5) * 60,
      velocityY: -(Math.random() * 40 + 20),
    }));

    setParticles(generated);

    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration, shouldReduceMotion]);

  if (!visible || shouldReduceMotion) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[60]"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          initial={{
            opacity: 1,
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
          }}
          animate={{
            opacity: 0,
            x: p.velocityX * 10,
            y: [0, p.velocityY * 10, Math.abs(p.velocityY) * 15],
            rotate: p.rotation * 3,
            scale: [1, 1.2, 0],
          }}
          transition={{
            duration: duration / 1000,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
