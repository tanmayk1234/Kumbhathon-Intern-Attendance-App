import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getInternById, getTodayActions, logCheckIn, logCheckOut } from "@/lib/sheets";

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
    const todayActions = await getTodayActions(intern);
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

    // Get current time in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    
    // Generate Log ID: LOG-YYYYMMDD-XXXXXX
    const date = istDate.toISOString().split("T")[0];
    const dateStr = date.replace(/-/g, "");
    const logId = `LOG-${dateStr}-${nanoid(6)}`;

    // Format time in IST
    const time = now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const tabName = `${intern[1]} (${internId})`;
    const gps = `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${Math.round(distance)}m)`;

    if (type === "CHECK_IN") {
      await logCheckIn(tabName, date, time, gps);
    } else {
      // Find check-in time to calculate hours
      const checkInAction = todayActions.find((a) => a.type === "CHECK_IN");
      let totalHours = "Unknown";
      if (checkInAction && checkInAction.time) {
        const parseTime = (str: string) => {
          const parts = str.trim().split(" ");
          const timeStr = parts[0];
          const modifier = parts[1] || "";
          
          let [hours, minutes, seconds] = timeStr.split(":").map(Number);
          if (hours === 12) {
            hours = modifier.toUpperCase() === "AM" ? 0 : 12;
          } else if (modifier.toUpperCase() === "PM") {
            hours += 12;
          }
          return (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
        };
        const inSeconds = parseTime(checkInAction.time);
        const outSeconds = parseTime(time);
        const diffHours = (outSeconds - inSeconds) / 3600;
        totalHours = diffHours.toFixed(2) + " hrs";
      }
      
      await logCheckOut(tabName, date, time, gps, totalHours);
    }

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
