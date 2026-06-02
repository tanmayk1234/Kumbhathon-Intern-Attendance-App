"use client";

import { getDeviceUuid } from "./storage";

/**
 * Generate a lightweight device fingerprint from:
 * - userAgent string
 * - screen dimensions
 * - stored UUID (persistent per device)
 *
 * Returns a deterministic hash string.
 */
export function generateFingerprint(): string {
  if (typeof window === "undefined") return "server";

  const components = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    `${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    getDeviceUuid(),
  ];

  const raw = components.join("|");
  return simpleHash(raw);
}

/**
 * Simple string hash (djb2 algorithm).
 * Not cryptographic, but sufficient for device fingerprinting.
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Convert to unsigned 32-bit hex
  return (hash >>> 0).toString(16).padStart(8, "0");
}
