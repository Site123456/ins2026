"use client";
import React, {
  useEffect,
  useState,
} from "react";
// Read accent from cookies (or fallback)
function getAccentFromCookies() {
  try {
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith("cs_settings="));

    if (!raw) return "#8b5cf6"; // fallback

    const settings = JSON.parse(decodeURIComponent(raw.split("=")[1]));
    return settings.accent || "#8b5cf6";
  } catch {
    return "#8b5cf6";
  }
}
export function useAccentFromCookies() {
  const [accent, setAccent] = useState<string>("#8b5cf6");

  // Load accent on mount
  useEffect(() => {
    const a = getAccentFromCookies();
    setAccent(a);
  }, []);

  // Apply CSS variables
  useEffect(() => {
    if (!accent) return;

    const hex = accent;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const root = document.documentElement;

    root.style.setProperty("--accent", hex);
    root.style.setProperty("--accent-dim", `rgba(${r},${g},${b},0.20)`);
    root.style.setProperty("--accent-glow", `rgba(${r},${g},${b},0.25)`);
    root.style.setProperty("--accent-strong", `rgba(${r},${g},${b},0.4)`);
    root.style.setProperty("--accent-text", `rgba(${r},${g},${b},0.9)`);

    // Legacy aliases
    root.style.setProperty("--accent-purple", hex);
    root.style.setProperty("--accent-purple-dim", `rgba(${r},${g},${b},0.15)`);
  }, [accent]);

  return accent;
}