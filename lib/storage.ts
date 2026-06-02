"use client";

const INTERN_ID_KEY = "kumbhathon_intern_id";
const DEVICE_UUID_KEY = "kumbhathon_device_uuid";
const FORM_DRAFT_KEY = "kumbhathon_form_draft";

// ── Intern ID ──

export function getInternId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(INTERN_ID_KEY);
}

export function setInternId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(INTERN_ID_KEY, id);
}

export function clearInternId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(INTERN_ID_KEY);
}

// ── Device UUID ──

export function getDeviceUuid(): string {
  if (typeof window === "undefined") return "";

  let uuid = localStorage.getItem(DEVICE_UUID_KEY);
  if (!uuid) {
    uuid = crypto.randomUUID();
    localStorage.setItem(DEVICE_UUID_KEY, uuid);
  }
  return uuid;
}

// ── Form Draft (sessionStorage) ──

export function getFormDraft(): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  try {
    const draft = sessionStorage.getItem(FORM_DRAFT_KEY);
    return draft ? JSON.parse(draft) : null;
  } catch {
    return null;
  }
}

export function setFormDraft(data: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage might be full or unavailable
  }
}

export function clearFormDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(FORM_DRAFT_KEY);
}
