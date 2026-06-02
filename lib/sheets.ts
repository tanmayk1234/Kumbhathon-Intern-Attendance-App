import { google } from "googleapis";

function getSheetsClient() {
  // Use separate credentials for Vercel, fallback to keyFile for local Windows dev
  const authOptions: any = {
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  };

  if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CLIENT_EMAIL) {
    authOptions.credentials = {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      // Handle escaped newlines in the private key from Vercel env
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  } else {
    authOptions.keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  const auth = new google.auth.GoogleAuth(authOptions);
  return google.sheets({ version: "v4", auth });
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

// ── Simple in-memory cache to reduce Google Sheets API calls ──

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheEntry<unknown>> = {};
const CACHE_TTL_MS = 15_000; // 15 seconds

function getCached<T>(key: string): T | null {
  const entry = cache[key] as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache[key] = { data, timestamp: Date.now() };
}

function invalidateCache(prefix: string): void {
  for (const key of Object.keys(cache)) {
    if (key.startsWith(prefix)) {
      delete cache[key];
    }
  }
}

// ── Interns Tab ──

export async function getInterns(): Promise<string[][]> {
  const cached = getCached<string[][]>("interns");
  if (cached) return cached;

  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Interns!A:I",
  });
  const data = response.data.values || [];
  setCache("interns", data);
  return data;
}

export async function getInternById(
  internId: string
): Promise<string[] | null> {
  const rows = await getInterns();
  // Skip header row (index 0)
  const intern = rows.find((row, index) => index > 0 && row[0] === internId);
  return intern || null;
}

export async function getInternCount(): Promise<number> {
  const rows = await getInterns();
  // Subtract 1 for header row
  return Math.max(0, rows.length - 1);
}

export async function appendIntern(values: string[]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Interns!A:I",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [values],
    },
  });
  // Invalidate cache after write
  invalidateCache("interns");
}

// ── Attendance Tab ──

export async function getAttendance(): Promise<string[][]> {
  const cached = getCached<string[][]>("attendance");
  if (cached) return cached;

  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Attendance!A:J",
  });
  const data = response.data.values || [];
  setCache("attendance", data);
  return data;
}

export async function getAttendanceForIntern(
  internId: string
): Promise<string[][]> {
  const rows = await getAttendance();
  return rows.filter((row, index) => index > 0 && row[1] === internId);
}

export async function getTodayActions(
  internId: string
): Promise<{ type: string; time: string; date: string }[]> {
  const rows = await getAttendanceForIntern(internId);
  if (rows.length === 0) return [];

  // Get today's date in YYYY-MM-DD format (IST)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const today = istDate.toISOString().split("T")[0];

  // Filter to today's entries
  const todayRows = rows.filter((row) => row[4] === today);
  
  return todayRows.map(row => ({
    type: row[3], // CHECK_IN or CHECK_OUT
    time: row[5], // Time
    date: row[4], // Date
  }));
}

export async function appendAttendance(values: string[]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Attendance!A:J",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [values],
    },
  });
  // Invalidate cache after write
  invalidateCache("attendance");
}

// ── Stats Helpers ──

export async function getDashboardStats() {
  const [interns, attendance] = await Promise.all([
    getInterns(),
    getAttendance(),
  ]);

  // Use IST for today's date
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const today = istDate.toISOString().split("T")[0];

  const internRows = interns.slice(1); // Skip header
  const attendanceRows = attendance.slice(1); // Skip header

  // Today's entries
  const todayEntries = attendanceRows.filter((row) => row[4] === today);

  // Count today's check-ins
  const todayCheckIns = todayEntries.filter(
    (row) => row[3] === "CHECK_IN"
  ).length;

  // Currently inside: interns whose last action today is CHECK_IN
  const lastActionByIntern = new Map<string, string>();
  for (const row of todayEntries) {
    lastActionByIntern.set(row[1], row[3]);
  }
  const currentlyInside = Array.from(lastActionByIntern.values()).filter(
    (action) => action === "CHECK_IN"
  ).length;

  return {
    totalInterns: internRows.length,
    todayCheckIns,
    currentlyInside,
    interns: internRows,
    attendance: attendanceRows.reverse(), // Reverse chronological
    internHeaders: interns[0] || [],
    attendanceHeaders: attendance[0] || [],
  };
}
