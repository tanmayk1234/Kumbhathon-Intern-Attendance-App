"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Lock, Loader2, Users, LogIn, Building2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import AdminTable from "@/components/AdminTable";

interface DashboardData {
  totalInterns: number;
  todayCheckIns: number;
  currentlyInside: number;
  interns: string[][];
  attendance: string[][];
  internHeaders: string[];
  attendanceHeaders: string[];
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<"interns" | "attendance">("interns");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const shouldReduceMotion = useReducedMotion();

  // Check sessionStorage for existing auth
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = sessionStorage.getItem("kumbhathon_admin");
      if (isAuth === "true") {
        setAuthenticated(true);
      }
    }
  }, []);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setData(result);
      setLastUpdated(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!authenticated) return;

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [authenticated, fetchData]);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      sessionStorage.setItem("kumbhathon_admin", "true");
      setAuthenticated(true);
    } catch {
      toast.error("Incorrect password");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().split("T")[0];
      a.download = `Kumbhathon_Attendance_${date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Export downloaded!");
    } catch {
      toast.error("Failed to export data");
    }
  };

  // Password gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <motion.div
          className="bg-white rounded-[16px] shadow-card p-8 w-full max-w-md"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--warm-sand)" }}
            >
              <Lock className="w-7 h-7 text-muted-brown" aria-hidden="true" />
            </div>
          </div>

          <h1
            className="text-2xl text-center text-charcoal mb-2"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Admin Access
          </h1>
          <p className="text-center text-muted-brown text-sm mb-8">
            Enter the admin password to view the dashboard.
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="input-field mb-4"
              autoFocus
              aria-label="Admin password"
              id="admin-password-input"
            />
            <button
              type="submit"
              disabled={!password || authLoading}
              className="btn-primary w-full"
              id="admin-unlock-button"
            >
              {authLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                "Unlock"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-cream px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="skeleton w-64 h-10 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="skeleton h-24 rounded-[16px]" />
            <div className="skeleton h-24 rounded-[16px]" />
            <div className="skeleton h-24 rounded-[16px]" />
          </div>
          <div className="skeleton h-96 rounded-[16px]" />
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const stats = [
    {
      label: "Total Interns",
      value: data.totalInterns,
      icon: Users,
      color: "var(--primary-terracotta)",
    },
    {
      label: "Today Check-Ins",
      value: data.todayCheckIns,
      icon: LogIn,
      color: "var(--success-green)",
    },
    {
      label: "Currently Inside",
      value: data.currentlyInside,
      icon: Building2,
      color: "var(--muted-brown)",
    },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Top Bar */}
      <header className="border-b border-warm-sand bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p
              className="text-muted-brown text-sm tracking-wider"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              KUMBHATHON
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p
              className="text-xs text-muted-brown/60"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Last updated: {lastUpdated}
            </p>
            <button
              onClick={fetchData}
              className="p-2 rounded-lg hover:bg-warm-sand transition-colors"
              aria-label="Refresh data"
              id="refresh-button"
            >
              <RefreshCw className="w-4 h-4 text-muted-brown" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Date */}
        <motion.h1
          className="text-2xl md:text-3xl text-charcoal mb-8"
          style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 400 }}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {today}
        </motion.h1>

        {/* Stat Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-white rounded-[16px] shadow-card p-6 flex items-center gap-4"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon
                  className="w-6 h-6"
                  style={{ color: stat.color }}
                  aria-hidden="true"
                />
              </div>
              <div>
                <motion.p
                  className="text-3xl font-semibold text-charcoal"
                  initial={shouldReduceMotion ? {} : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  {stat.value}
                </motion.p>
                <p className="text-sm text-muted-brown">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-warm-sand/50 rounded-full p-1 w-fit">
          {(["interns", "attendance"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-primary-terracotta text-cream shadow-button"
                  : "text-muted-brown hover:text-charcoal"
              }`}
              id={`tab-${tab}`}
            >
              {tab === "interns" ? "Interns" : "Attendance Log"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={shouldReduceMotion ? {} : { opacity: 0, x: activeTab === "interns" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, x: activeTab === "interns" ? 20 : -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <AdminTable
              activeTab={activeTab}
              interns={data.interns}
              attendance={data.attendance}
              internHeaders={data.internHeaders}
              attendanceHeaders={data.attendanceHeaders}
              onExport={handleExport}
            />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
