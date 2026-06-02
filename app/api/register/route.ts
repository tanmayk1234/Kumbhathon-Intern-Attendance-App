import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendIntern, getInternCount } from "@/lib/sheets";

const registerSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters"),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be 10 digits"),
  email: z.string().email("Invalid email address"),
  internshipTitle: z.string().min(1, "Internship title is required"),
  school: z.string().min(1, "School or college name is required"),
  internshipPeriod: z.string().min(1, "Internship period is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      fullName,
      phone,
      email,
      internshipTitle,
      school,
      internshipPeriod,
      joiningDate,
    } = parsed.data;

    // Generate Intern ID: KMB-2026-XXX
    const currentCount = await getInternCount();
    const idNumber = String(currentCount + 1).padStart(3, "0");
    const year = new Date().getFullYear();
    const internId = `KMB-${year}-${idNumber}`;

    // Registration timestamp
    const timestamp = new Date().toISOString();

    // Append to Interns tab
    // Headers: Intern ID, Full Name, Phone Number, Email, Internship Title,
    //          School or College Name, Internship Period, Joining Date, Registration Timestamp
    await appendIntern([
      internId,
      fullName,
      phone,
      email,
      internshipTitle,
      school,
      internshipPeriod,
      joiningDate,
      timestamp,
    ]);

    return NextResponse.json({
      success: true,
      internId,
      fullName,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register. Please try again." },
      { status: 500 }
    );
  }
}
