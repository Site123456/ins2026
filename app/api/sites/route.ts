import { NextResponse } from "next/server";

// ── Real restaurant hours (Paris timezone) ───────────────────────
// All sites share the same schedule: two service windows per day
const SERVICE_WINDOWS = [
  { open: { h: 11, m: 15 }, close: { h: 14, m: 45 } },
  { open: { h: 18, m: 15 }, close: { h: 22, m: 45 } },
];

const SITES = [
  { id: "paris15", name: "Paris 15 - Pasteur", status: "active" },
  { id: "bordeaux", name: "Bordeaux – Cour du Médoc", status: "active" },
  { id: "courbevoie", name: "Courbevoie – La Défense", status: "active" },
  { id: "saint-ouen", name: "Saint-Ouen", status: "active" },
  { id: "aubervilliers", name: "Aubervilliers", status: "renovating" },
  { id: "bagneux", name: "Bagneux", status: "active" },
  { id: "ivry", name: "Ivry", status: "active" },
];

function getParisDate(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
}

function isWithinServiceWindow(now: Date): { isOpen: boolean; currentWindow: string | null; nextWindow: string | null } {
  const h = now.getHours();
  const m = now.getMinutes();
  const totalMins = h * 60 + m;

  for (const w of SERVICE_WINDOWS) {
    const openMins = w.open.h * 60 + w.open.m;
    const closeMins = w.close.h * 60 + w.close.m;
    if (totalMins >= openMins && totalMins < closeMins) {
      return {
        isOpen: true,
        currentWindow: `${String(w.open.h).padStart(2, "0")}:${String(w.open.m).padStart(2, "0")} - ${String(w.close.h).padStart(2, "0")}:${String(w.close.m).padStart(2, "0")}`,
        nextWindow: null,
      };
    }
  }

  // Find next window
  let nextWindow: string | null = null;
  for (const w of SERVICE_WINDOWS) {
    const openMins = w.open.h * 60 + w.open.m;
    if (totalMins < openMins) {
      nextWindow = `${String(w.open.h).padStart(2, "0")}:${String(w.open.m).padStart(2, "0")} - ${String(w.close.h).padStart(2, "0")}:${String(w.close.m).padStart(2, "0")}`;
      break;
    }
  }
  // If no future window today, next is tomorrow's first
  if (!nextWindow) {
    const w = SERVICE_WINDOWS[0];
    nextWindow = `${String(w.open.h).padStart(2, "0")}:${String(w.open.m).padStart(2, "0")} - ${String(w.close.h).padStart(2, "0")}:${String(w.close.m).padStart(2, "0")} (tomorrow)`;
  }

  return { isOpen: false, currentWindow: null, nextWindow };
}

export async function GET() {
  const now = getParisDate();
  const { isOpen, currentWindow, nextWindow } = isWithinServiceWindow(now);

  const sites = SITES.map((site) => {
    if (site.status === "renovating") {
      return {
        ...site,
        currentlyOpen: false,
        reason: "renovating",
        currentWindow: null,
        nextWindow: null,
      };
    }
    return {
      ...site,
      currentlyOpen: isOpen,
      reason: isOpen ? "open" : "closed",
      currentWindow,
      nextWindow,
    };
  });

  return NextResponse.json({
    parisTime: now.toISOString(),
    serviceWindows: SERVICE_WINDOWS.map(
      (w) =>
        `${String(w.open.h).padStart(2, "0")}:${String(w.open.m).padStart(2, "0")} - ${String(w.close.h).padStart(2, "0")}:${String(w.close.m).padStart(2, "0")}`
    ),
    globallyOpen: isOpen,
    sites,
  });
}
