import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getInternById, getTodayActions, appendAttendance } from "@/lib/sheets";

const punchSchema = z.object({
  internId: z.string().min(1, "Intern ID is required"),
  type: z.enum(["CHECK_IN", "CHECK_OUT"]),
  latitude: z.number(),
  longitude: z.number(),
  distance: z.number(),
  fingerprint: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = punchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { internId, type, latitude, longitude, distance, fingerprint } =
      parsed.data;

    // Verify intern exists
    const intern = await getInternById(internId);
    if (!intern) {
      return NextResponse.json(
        { error: "Intern not found" },
        { status: 404 }
      );
    }

    // Verify no duplicate daily actions
    const todayActions = await getTodayActions(internId);
    const hasCheckedIn = todayActions.some(a => a.type === "CHECK_IN");
    const hasCheckedOut = todayActions.some(a => a.type === "CHECK_OUT");

    if (type === "CHECK_IN" && hasCheckedIn) {
      return NextResponse.json(
        { error: "You have already checked in today." },
        { status: 400 }
      );
    }

    if (type === "CHECK_OUT") {
      if (!hasCheckedIn) {
        return NextResponse.json(
          { error: "Please check in first." },
          { status: 400 }
        );
      }
      if (hasCheckedOut) {
        return NextResponse.json(
          { error: "You have already checked out today." },
          { status: 400 }
        );
      }
    }

    // Generate Log ID: LOG-YYYYMMDD-XXXXXX
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    const logId = `LOG-${dateStr}-${nanoid(6)}`;

    // Format date and time
    const date = now.toISOString().split("T")[0];
    const time = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Append to Attendance tab
    // Headers: Log ID, Intern ID, Full Name, Type, Date, Time,
    //          Latitude, Longitude, Distance from Office, Device Fingerprint
    await appendAttendance([
      logId,
      internId,
      intern[1], // Full Name
      type,
      date,
      time,
      latitude.toString(),
      longitude.toString(),
      `${Math.round(distance)}m`,
      fingerprint,
    ]);

    return NextResponse.json({
      success: true,
      logId,
      type,
      time,
      fullName: intern[1],
    });
  } catch (error) {
    console.error("Punch error:", error);
    return NextResponse.json(
      { error: "Failed to record punch. Please try again." },
      { status: 500 }
    );
  }
}
