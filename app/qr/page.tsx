"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Download, QrCode } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function QRPage() {
  const shouldReduceMotion = useReducedMotion();
  const [deployedUrl] = useState(
    typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"
  );

  // Generate a simple QR code using a public API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    deployedUrl
  )}&bgcolor=FBF6EE&color=1F1410&format=svg`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kumbhathon-checkin-qr.svg";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(qrCodeUrl, "_blank");
    }
  };

  return (
    <AnimatedBackground>
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <QrCode className="w-6 h-6 text-primary-terracotta" aria-hidden="true" />
          <p
            className="text-muted-brown tracking-wider text-sm"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            KUMBHATHON CHECK-IN
          </p>
        </motion.div>

        <motion.h1
          className="text-4xl md:text-5xl text-charcoal text-center mb-4"
          style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 400 }}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Scan to Check In
        </motion.h1>

        <motion.p
          className="text-muted-brown text-center mb-10 max-w-md"
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Point your phone camera at this QR code to open the intern check-in
          portal.
        </motion.p>

        {/* QR Code */}
        <motion.div
          className="bg-white rounded-[16px] shadow-card p-8 mb-8"
          initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeUrl}
            alt="QR code for Kumbhathon Check-In Portal"
            width={300}
            height={300}
            className="w-[250px] h-[250px] md:w-[300px] md:h-[300px]"
          />
        </motion.div>

        {/* URL Display */}
        <motion.p
          className="text-xs text-muted-brown/60 mb-6"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {deployedUrl}
        </motion.p>

        {/* Download Button */}
        <motion.button
          onClick={handleDownload}
          className="btn-primary flex items-center gap-2"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
          id="download-qr-button"
        >
          <Download className="w-5 h-5" aria-hidden="true" />
          Download QR Code
        </motion.button>
      </main>
    </AnimatedBackground>
  );
}
