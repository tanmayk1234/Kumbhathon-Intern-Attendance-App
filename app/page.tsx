"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";
import { getInternId } from "@/lib/storage";

export default function LandingPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const handleContinue = () => {
    const internId = getInternId();
    if (internId) {
      router.push("/punch");
    } else {
      router.push("/register");
    }
  };

  const heading = "Welcome, Intern";
  const words = heading.split(" ");

  return (
    <AnimatedBackground>
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        {/* Wordmark */}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-12"
        >
          <p
            className="text-muted-brown font-medium tracking-wider"
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "16px",
              letterSpacing: "0.15em",
            }}
          >
            KUMBHATHON
          </p>
        </motion.div>

        {/* Hero Heading */}
        <h1 className="text-center mb-6">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block text-6xl md:text-7xl lg:text-8xl text-charcoal mr-[0.25em] last:mr-0"
              style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 400 }}
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: 0.2 + i * 0.06,
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subheading */}
        <motion.p
          className="text-xl text-muted-brown text-center mb-12 max-w-md"
          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
        >
          Check in to your day at Kumbhathon.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          onClick={handleContinue}
          className="btn-primary text-lg px-12 py-4"
          initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
            delay: 0.55,
          }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
          whileHover={
            shouldReduceMotion
              ? {}
              : { boxShadow: "0 8px 24px rgba(200, 85, 61, 0.25)" }
          }
          id="continue-button"
        >
          Continue
        </motion.button>

        {/* Footer */}
        <motion.footer
          className="absolute bottom-8 left-0 right-0 text-center"
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p
            className="text-muted-brown text-xs tracking-wide-custom"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            KUMBHATHON INNOVATION FOUNDATION
          </p>
        </motion.footer>
      </main>
    </AnimatedBackground>
  );
}
