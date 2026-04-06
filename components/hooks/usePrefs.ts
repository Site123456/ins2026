"use client";
import { useState, useEffect } from "react";

export type Language = "English" | "Français" | "Español";
export type Timezone = "UTC" | "GMT+1" | "GMT-5";

export function usePrefs() {
  const [language, setLanguage] = useState<Language>("English");
  const [timezone, setTimezone] = useState<Timezone>("UTC");

  useEffect(() => {
    const storedLang = window.localStorage.getItem("prefs.language") as Language | null;
    const storedTz = window.localStorage.getItem("prefs.timezone") as Timezone | null;
    if (storedLang) setLanguage(storedLang);
    if (storedTz) setTimezone(storedTz);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("prefs.language", language);
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem("prefs.timezone", timezone);
  }, [timezone]);

  return { language, setLanguage, timezone, setTimezone } as const;
}
