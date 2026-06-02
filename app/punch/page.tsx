"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Check, X, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import AnimatedBackground from "@/components/AnimatedBackground";
import LocationRadar from "@/components/LocationRadar";
import PunchButton from "@/components/PunchButton";
import { getInternId } from "@/lib/storage";
import { generateFingerprint } from "@/lib/fingerprint";
import { haversineDistance } from "@/lib/geo";

type GeoState = "idle" | "scanning" | "success" | "error" | "too-far";
type GeoError = "denied" | "unavailable" | "timeout" | null;

interface StatusData {
  fullName: string;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  lastAction: { type: string; time: string; date: string } | null;
}

export default function PunchPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [internId, setLocalInternId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [geoError, setGeoError] = useState<GeoError>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Office coords from env (exposed via next.config.ts)
  // These are stable values — no need to recalculate on every render
  const OFFICE_LAT = parseFloat(process.env.NEXT_PUBLIC_OFFICE_LATITUDE || "18.5204");
  const OFFICE_LNG = parseFloat(process.env.NEXT_PUBLIC_OFFICE_LONGITUDE || "73.8567");
  const OFFICE_RADIUS = parseFloat(process.env.NEXT_PUBLIC_OFFICE_RADIUS_METERS || "200");

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Read intern ID from localStorage
  useEffect(() => {
    const id = getInternId();
    if (!id) {
      router.push("/register");
      return;
    }
    setLocalInternId(id);
  }, [router]);

  // Fetch status
  useEffect(() => {
    if (!internId) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/status?internId=${encodeURIComponent(internId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStatus({ 
          fullName: data.fullName, 
          hasCheckedIn: data.hasCheckedIn,
          hasCheckedOut: data.hasCheckedOut,
          lastAction: data.lastAction 
        });
      } catch (error) {
        toast.error("Failed to load your status");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [internId]);

  // Start geolocation
  const requestLocation = useCallback(() => {
    setGeoState("scanning");
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoState("error");
      setGeoError("unavailable");
      return;
    }

    const handlePosition = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setCoords({ lat: latitude, lng: longitude });

      const dist = haversineDistance(latitude, longitude, OFFICE_LAT, OFFICE_LNG);
      const roundedDist = Math.round(dist);
      setDistance(roundedDist);

      if (roundedDist <= OFFICE_RADIUS) {
        setGeoState("success");
      } else {
        setGeoState("too-far");
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      // On timeout with high accuracy, retry with low accuracy
      if (error.code === error.TIMEOUT) {
        navigator.geolocation.getCurrentPosition(
          handlePosition,
          () => {
            setGeoState("error");
            setGeoError("timeout");
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 30000,
          }
        );
        return;
      }

      setGeoState("error");
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setGeoError("denied");
          break;
        case error.POSITION_UNAVAILABLE:
          setGeoError("unavailable");
          break;
        default:
          setGeoError("timeout");
          break;
      }
    };

    navigator.geolocation.getCurrentPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [OFFICE_LAT, OFFICE_LNG, OFFICE_RADIUS]);

  // Auto-start geolocation after status loads
  useEffect(() => {
    if (status && !loading) {
      requestLocation();
    }
  }, [status, loading, requestLocation]);

  // Determine next punch type and completion status
  const isDoneForDay = status?.hasCheckedOut;
  const nextPunchType: "CHECK_IN" | "CHECK_OUT" = status?.hasCheckedIn ? "CHECK_OUT" : "CHECK_IN";

  // Handle punch
  const handlePunch = async () => {
    if (!internId || !coords || distance === null) return;

    setPunching(true);
    try {
      const fingerprint = generateFingerprint();

      const res = await fetch("/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internId,
          type: nextPunchType,
          latitude: coords.lat,
          longitude: coords.lng,
          distance,
          fingerprint,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      router.push(
        `/success?type=punch&action=${nextPunchType}&name=${encodeURIComponent(
          result.fullName
        )}&time=${encodeURIComponent(result.time)}`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Punch failed. Please try again."
      );
    } finally {
      setPunching(false);
    }
  };

  const firstName = status?.fullName?.split(" ")[0] || "";

  // Loading state
  if (loading) {
    return (
      <AnimatedBackground>
        <main className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="skeleton w-64 h-12 mb-4" />
          <div className="skeleton w-48 h-6 mb-12" />
          <div className="skeleton w-48 h-48 rounded-full" />
        </main>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      {/* Offline banner */}
      {!isOnline && (
        <div className="offline-banner flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" aria-hidden="true" />
          <span>You are offline. Reconnect to punch in.</span>
        </div>
      )}

      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        {/* Greeting */}
        <motion.h1
          className="text-4xl md:text-5xl text-charcoal text-center mb-3"
          style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 400 }}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          Hello, {firstName}
        </motion.h1>

        {/* Last action */}
        <motion.p
          className="text-muted-brown text-center mb-12"
          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        >
          {status?.lastAction
            ? `Last action: ${status.lastAction.type.replace("_", " ")} at ${status.lastAction.time}`
            : "No punches logged yet today"}
        </motion.p>        {/* Location Radar or Done Message */}
        {isDoneForDay ? (
          <motion.div
            className="mb-8 text-center"
            initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="w-48 h-48 mx-auto rounded-full bg-success-green/10 flex flex-col items-center justify-center text-success-green border-2 border-success-green/20">
              <Check className="w-16 h-16 mb-2" />
              <p className="font-medium text-lg">Done for today!</p>
            </div>
            <p className="mt-6 text-muted-brown max-w-sm mx-auto">
              You have successfully completed your attendance for today. Have a great rest of your day!
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              className="mb-8"
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <LocationRadar
                state={
                  geoState === "scanning" || geoState === "idle"
                    ? "scanning"
                    : geoState === "success"
                    ? "success"
                    : "error"
                }
                size={200}
              />
            </motion.div>

            {/* Location Status Text */}
            <motion.div
              className="text-center mb-10"
              initial={shouldReduceMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {geoState === "scanning" && (
                <p className="text-muted-brown flex items-center gap-2 justify-center">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  Verifying your location at the office...
                </p>
              )}

              {geoState === "success" && (
                <div>
                  <p className="text-success-green flex items-center gap-2 justify-center font-medium">
                    <Check className="w-5 h-5" aria-hidden="true" />
                    You are at the office
                  </p>
                  {distance !== null && (
                    <p className="text-muted-brown text-sm mt-1">
                      {distance}m from office center
                    </p>
                  )}
                </div>
              )}

              {geoState === "too-far" && (
                <div>
                  <p className="text-error-red flex items-center gap-2 justify-center font-medium">
                    <X className="w-5 h-5" aria-hidden="true" />
                    You are {distance}m away from the office
                  </p>
                  <p className="text-muted-brown text-sm mt-1">
                    Move closer to punch in.
                  </p>
                  <button
                    onClick={requestLocation}
                    className="mt-3 text-primary-terracotta underline text-sm flex items-center gap-1 mx-auto"
                    id="retry-location-button"
                  >
                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                    Retry
                  </button>
                </div>
              )}

              {geoState === "error" && (
                <div>
                  {geoError === "denied" && (
                    <>
                      <p className="text-error-red font-medium">Location access denied</p>
                      <p className="text-muted-brown text-sm mt-1 max-w-sm mx-auto">
                        Please enable location access in your browser settings, then
                        refresh this page.
                      </p>
                    </>
                  )}
                  {geoError === "unavailable" && (
                    <p className="text-error-red font-medium">
                      Location unavailable
                    </p>
                  )}
                  {geoError === "timeout" && (
                    <p className="text-error-red font-medium">
                      Location request timed out
                    </p>
                  )}
                  <button
                    onClick={requestLocation}
                    className="mt-3 btn-primary text-sm px-6 py-2"
                    id="retry-geo-button"
                  >
                    {geoError === "timeout" ? (
                      <>
                        <RefreshCw className="w-4 h-4 inline mr-1" aria-hidden="true" />
                        Refresh
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 inline mr-1" aria-hidden="true" />
                        Try Again
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>

            {/* Punch Button */}
            {geoState === "success" && (
              <PunchButton
                type={nextPunchType}
                onClick={handlePunch}
                loading={punching}
                disabled={!isOnline}
              />
            )}
          </>
        )}

        {/* Intern ID */}
        {internId && (
          <motion.p
            className="mt-8 text-xs text-muted-brown/60"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            initial={shouldReduceMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {internId}
          </motion.p>
        )}
      </main>
    </AnimatedBackground>
  );
}
