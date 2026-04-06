"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const COOKIE_NAME = "theme";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    new RegExp("(^| )" + name + "=([^;]+)")
  );

  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=31536000; SameSite=Lax`;
}

function getSystemDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");
  const [hydrated, setHydrated] = useState(false);

  const [systemDark, setSystemDark] = useState(getSystemDark());

  // Read cookie on mount
  useEffect(() => {
    const stored = getCookie(COOKIE_NAME) as Theme | null;

    if (stored === "light" || stored === "dark" || stored === "system") {
      setTheme(stored);
    }

    setHydrated(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const listener = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };

    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, []);

  const resolvedDark =
    theme === "dark" || (theme === "system" && systemDark);

  // Apply theme
  useEffect(() => {
    if (!hydrated) return;

    document.documentElement.classList.toggle("dark", resolvedDark);

    setCookie(COOKIE_NAME, theme);
  }, [theme, resolvedDark, hydrated]);

  return {
    theme,
    setTheme,
    isDark: resolvedDark,
    hydrated,
  } as const;
}