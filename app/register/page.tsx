"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import AnimatedBackground from "@/components/AnimatedBackground";
import { setInternId, getFormDraft, setFormDraft, clearFormDraft } from "@/lib/storage";

const registerSchema = z
  .object({
    fullName: z.string().min(3, "Name must be at least 3 characters"),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
    email: z.string().email("Invalid email address"),
    internshipTitle: z.string().min(1, "Internship title is required"),
    school: z.string().min(1, "School or college name is required"),
    internshipPeriod: z.string().min(1, "Please select an internship period"),
    customPeriod: z.string().optional(),
    joiningDate: z.string().min(1, "Joining date is required"),
  })
  .refine(
    (data) => {
      if (data.internshipPeriod === "Custom") {
        return !!data.customPeriod && data.customPeriod.length > 0;
      }
      return true;
    },
    {
      message: "Please specify the custom period",
      path: ["customPeriod"],
    }
  );

type RegisterForm = z.infer<typeof registerSchema>;

const periodOptions = [
  "1 month",
  "2 months",
  "3 months",
  "6 months",
  "Custom",
];

const formFields = [
  { name: "fullName" as const, label: "Full Name", type: "text", placeholder: "Enter your full name" },
  { name: "phone" as const, label: "Phone Number", type: "tel", placeholder: "10-digit phone number" },
  { name: "email" as const, label: "Email Address", type: "email", placeholder: "your@email.com" },
  { name: "internshipTitle" as const, label: "Internship Title", type: "text", placeholder: "e.g. Software Development Intern" },
  { name: "school" as const, label: "School or College Name", type: "text", placeholder: "Your institution name" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      joiningDate: new Date().toISOString().split("T")[0],
    },
  });

  const selectedPeriod = watch("internshipPeriod");
  const watchedValues = watch();

  // Restore form draft from sessionStorage
  useEffect(() => {
    const draft = getFormDraft();
    if (draft) {
      Object.entries(draft).forEach(([key, value]) => {
        setValue(key as keyof RegisterForm, value);
      });
    }
  }, [setValue]);

  // Save form draft to sessionStorage
  useEffect(() => {
    const values: Record<string, string> = {};
    Object.entries(watchedValues).forEach(([key, value]) => {
      if (value) values[key] = value;
    });
    setFormDraft(values);
  }, [watchedValues]);

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const period =
        data.internshipPeriod === "Custom"
          ? data.customPeriod || ""
          : data.internshipPeriod;

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          internshipTitle: data.internshipTitle,
          school: data.school,
          internshipPeriod: period,
          joiningDate: data.joiningDate,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Registration failed");
      }

      // Save intern ID
      setInternId(result.internId);
      clearFormDraft();

      // Navigate to success
      router.push(
        `/success?type=registration&name=${encodeURIComponent(
          result.fullName
        )}&id=${encodeURIComponent(result.internId)}`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const containerAnim = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.06 },
    },
  };

  const itemAnim = {
    hidden: shouldReduceMotion ? {} : { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  };

  return (
    <AnimatedBackground>
      <main className="min-h-screen py-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <motion.button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-muted-brown hover:text-charcoal transition-colors mb-8"
            initial={shouldReduceMotion ? {} : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            aria-label="Go back to home"
            id="back-button"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">Back</span>
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left Column - Text */}
            <motion.div
              className="lg:sticky lg:top-12"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h1
                className="text-5xl md:text-6xl lg:text-7xl text-charcoal mb-6"
                style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 400 }}
              >
                Let us know you
              </h1>
              <p
                className="text-lg text-muted-brown leading-relaxed max-w-md"
                style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
              >
                Fill in your details to generate your unique Kumbhathon intern
                ID. You&apos;ll use this ID every time you check in and out at the
                office.
              </p>
            </motion.div>

            {/* Right Column - Form */}
            <motion.div
              className="bg-cream rounded-[16px] p-8 shadow-card"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            >
              <form onSubmit={handleSubmit(onSubmit)}>
                <motion.div
                  className="space-y-5"
                  variants={containerAnim}
                  initial="hidden"
                  animate="show"
                >
                  {/* Text fields */}
                  {formFields.map((field) => (
                    <motion.div key={field.name} variants={itemAnim}>
                      <label
                        htmlFor={field.name}
                        className="block text-sm font-medium text-charcoal mb-2"
                      >
                        {field.label}
                      </label>
                      <input
                        id={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        className={`input-field ${
                          errors[field.name] ? "error" : ""
                        }`}
                        {...register(field.name)}
                      />
                      {errors[field.name] && (
                        <p className="text-error-red text-sm mt-1.5" role="alert">
                          {errors[field.name]?.message}
                        </p>
                      )}
                    </motion.div>
                  ))}

                  {/* Internship Period */}
                  <motion.div variants={itemAnim}>
                    <label
                      htmlFor="internshipPeriod"
                      className="block text-sm font-medium text-charcoal mb-2"
                    >
                      Internship Period
                    </label>
                    <select
                      id="internshipPeriod"
                      className={`input-field select-field ${
                        errors.internshipPeriod ? "error" : ""
                      }`}
                      {...register("internshipPeriod")}
                    >
                      <option value="">Select a period</option>
                      {periodOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errors.internshipPeriod && (
                      <p className="text-error-red text-sm mt-1.5" role="alert">
                        {errors.internshipPeriod.message}
                      </p>
                    )}
                  </motion.div>

                  {/* Custom Period (conditional) */}
                  {selectedPeriod === "Custom" && (
                    <motion.div
                      initial={shouldReduceMotion ? {} : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={shouldReduceMotion ? {} : { opacity: 0, height: 0 }}
                    >
                      <label
                        htmlFor="customPeriod"
                        className="block text-sm font-medium text-charcoal mb-2"
                      >
                        Custom Period
                      </label>
                      <input
                        id="customPeriod"
                        type="text"
                        placeholder="e.g. 4.5 months"
                        className={`input-field ${
                          errors.customPeriod ? "error" : ""
                        }`}
                        {...register("customPeriod")}
                      />
                      {errors.customPeriod && (
                        <p className="text-error-red text-sm mt-1.5" role="alert">
                          {errors.customPeriod.message}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Joining Date */}
                  <motion.div variants={itemAnim}>
                    <label
                      htmlFor="joiningDate"
                      className="block text-sm font-medium text-charcoal mb-2"
                    >
                      Joining Date
                    </label>
                    <input
                      id="joiningDate"
                      type="date"
                      className={`input-field ${
                        errors.joiningDate ? "error" : ""
                      }`}
                      {...register("joiningDate")}
                    />
                    {errors.joiningDate && (
                      <p className="text-error-red text-sm mt-1.5" role="alert">
                        {errors.joiningDate.message}
                      </p>
                    )}
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div variants={itemAnim} className="pt-2">
                    <motion.button
                      type="submit"
                      disabled={!isValid || loading}
                      className="btn-primary w-full lg:w-auto"
                      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                      animate={
                        isValid && !loading && !shouldReduceMotion
                          ? {
                              boxShadow: [
                                "0 2px 12px rgba(200, 85, 61, 0.15)",
                                "0 4px 20px rgba(200, 85, 61, 0.25)",
                                "0 2px 12px rgba(200, 85, 61, 0.15)",
                              ],
                            }
                          : {}
                      }
                      transition={
                        isValid && !loading
                          ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                          : {}
                      }
                      id="submit-button"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                          <span>Registering...</span>
                        </>
                      ) : (
                        "Generate My Intern ID"
                      )}
                    </motion.button>
                  </motion.div>
                </motion.div>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
    </AnimatedBackground>
  );
}
