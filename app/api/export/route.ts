import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getInterns, getAttendance } from "@/lib/sheets";

export async function GET() {
  try {
    const [internsData, attendanceData] = await Promise.all([
      getInterns(),
      getAttendance(),
    ]);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Interns sheet
    const internsSheet = XLSX.utils.aoa_to_sheet(internsData);
    XLSX.utils.book_append_sheet(workbook, internsSheet, "Interns");

    // Attendance sheet
    const attendanceSheet = XLSX.utils.aoa_to_sheet(attendanceData);
    XLSX.utils.book_append_sheet(workbook, attendanceSheet, "Attendance");

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Format filename with current date
    const date = new Date().toISOString().split("T")[0];
    const filename = `Kumbhathon_Attendance_${date}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
