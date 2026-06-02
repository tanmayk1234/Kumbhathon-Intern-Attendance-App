"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import AnimatedBackground from "@/components/AnimatedBackground";
import ConfettiBurst from "@/components/ConfettiBurst";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const type = searchParams.get("type") || "punch";
  const name = searchParams.get("name") || "";
  const internId = searchParams.get("id") || "";
  const action = searchParams.get("action") || "";
  const time = searchParams.get("time") || "";

  const firstName = name.split(" ")[0];

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(internId);
      setCopied(true);
      toast.success("Intern ID copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <AnimatedBackground>
      <ConfettiBurst duration={2500} />

      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        {/* Animated Check Circle */}
        <motion.div
          className="relative w-[200px] h-[200px] flex items-center justify-center mb-10"
          initial={shouldReduceMotion ? {} : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 15, delay: 0.2 }}
        >
          {/* Background Circle */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: "var(--primary-terracotta)" }}
          />

          {/* Check SVG */}
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            className="relative z-10"
            aria-label="Success"
          >
            <motion.path
              d="M20 40 L33 53 L60 26"
              stroke="var(--cream)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            />
          </svg>
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="text-3xl md:text-4xl lg:text-5xl text-charcoal text-center mb-4 max-w-lg"
          style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 400 }}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          {type === "registration"
            ? `Welcome to Kumbhathon, ${firstName}`
            : action === "CHECK_IN"
            ? `Checked in at ${time}`
            : `Checked out at ${time}`}
        </motion.h1>

        {/* Subtext */}
        <motion.div
          className="text-center mb-10"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.0 }}
        >
          {type === "registration" ? (
            <>
              {/* Intern ID Display */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <p
                  className="text-2xl md:text-3xl text-charcoal"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {internId}
                </p>
                <button
                  onClick={copyId}
                  className="p-2 rounded-lg hover:bg-warm-sand transition-colors"
                  aria-label="Copy intern ID"
                  id="copy-id-button"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-success-green" />
                  ) : (
                    <Copy className="w-5 h-5 text-muted-brown" />
                  )}
                </button>
              </div>
              <p className="text-muted-brown">
                Save this ID. You&apos;ll use the same ID for every check-in.
              </p>
            </>
          ) : (
            <p className="text-muted-brown text-lg">
              {action === "CHECK_IN"
                ? "Have a great day!"
                : "See you tomorrow!"}
            </p>
          )}
        </motion.div>

        {/* Done Button */}
        <motion.button
          onClick={() => router.push("/")}
          className="btn-primary px-10 py-4"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
          id="done-button"
        >
          Done
        </motion.button>
      </main>
    </AnimatedBackground>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="skeleton w-48 h-48 rounded-full" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
