import { NextRequest, NextResponse } from "next/server";
import { getInternById, getTodayActions } from "@/lib/sheets";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const internId = searchParams.get("internId");

    if (!internId) {
      return NextResponse.json(
        { error: "internId query parameter is required" },
        { status: 400 }
      );
    }

    // Fetch intern info
    const intern = await getInternById(internId);
    if (!intern) {
      return NextResponse.json(
        { error: "Intern not found" },
        { status: 404 }
      );
    }

    // Fetch today's actions
    const todayActions = await getTodayActions(intern);
    const hasCheckedIn = todayActions.some(a => a.type === "CHECK_IN");
    const hasCheckedOut = todayActions.some(a => a.type === "CHECK_OUT");
    const lastAction = todayActions.length > 0 ? todayActions[todayActions.length - 1] : null;

    return NextResponse.json({
      success: true,
      internId: intern[0],
      fullName: intern[1],
      email: intern[3],
      hasCheckedIn,
      hasCheckedOut,
      lastAction: lastAction
        ? {
            type: lastAction.type,
            time: lastAction.time,
            date: lastAction.date,
          }
        : null,
    });
  } catch (error) {
    console.error("Status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
