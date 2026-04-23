"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/hooks/useTheme";
import { useAccentFromCookies } from "@/components/hooks/useAccentFromCookies";
import { MapPin, Clock, Utensils } from "lucide-react";

const SERVICE_WINDOWS = [
  { id: "lunch", open: { h: 11, m: 15 }, close: { h: 14, m: 45 }, label: { fr: "Déjeuner", en: "Lunch" } },
  { id: "dinner", open: { h: 18, m: 15 }, close: { h: 22, m: 45 }, label: { fr: "Dîner", en: "Dinner" } },
];

const SITES = [
  { name: "Paris 15 - Pasteur", active: true },
  { name: "Bordeaux", active: true },
  { name: "Courbevoie", active: true },
  { name: "Saint-Ouen", active: true },
  { name: "Aubervilliers", active: false, reason: "renovating" },
  { name: "Bagneux", active: true },
  { name: "Ivry", active: true },
];

function getParisNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function fmt(h: number, m: number) {
  return `${h}h${String(m).padStart(2, "0")}`;
}
function isNowInWindow(w: typeof SERVICE_WINDOWS[0], now: Date): boolean {
  const t = now.getHours() * 60 + now.getMinutes();
  return t >= w.open.h * 60 + w.open.m && t < w.close.h * 60 + w.close.m;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function progressInWindow(w: typeof SERVICE_WINDOWS[0], now: Date): number {
  const t = now.getHours() * 60 + now.getMinutes();
  const s = w.open.h * 60 + w.open.m, e = w.close.h * 60 + w.close.m;
  if (t < s || t >= e) return -1;
  return (t - s) / (e - s);
}

function getNextOpening(now: Date, isFr: boolean): string {
  const t = now.getHours() * 60 + now.getMinutes();
  for (const w of SERVICE_WINDOWS) {
    const openMins = w.open.h * 60 + w.open.m;
    if (t < openMins) {
      return isFr
        ? `Ouverture à ${fmt(w.open.h, w.open.m)}`
        : `Opening at ${fmt(w.open.h, w.open.m)}`;
    }
  }
  return isFr
    ? `Ouverture demain à ${fmt(SERVICE_WINDOWS[0].open.h, SERVICE_WINDOWS[0].open.m)}`
    : `Opening tomorrow at ${fmt(SERVICE_WINDOWS[0].open.h, SERVICE_WINDOWS[0].open.m)}`;
}

export default function EventsPage() {
  const { language } = useLanguage();
  const { isDark } = useTheme();
  const accent = useAccentFromCookies() || "#f65c5cff";
  const isFr = language === "fr";

  const [now, setNow] = useState(getParisNow);
  useEffect(() => { const id = setInterval(() => setNow(getParisNow()), 30000); return () => clearInterval(id); }, []);

  const days = useMemo(() => {
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, [now.toDateString()]);

  const dayNamesFull = isFr
    ? ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
    : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayNamesShort = isFr
    ? ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = isFr
    ? ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const activeWindow = SERVICE_WINDOWS.find(w => isNowInWindow(w, now));
  const nextOpeningStr = !activeWindow ? getNextOpening(now, isFr) : null;
  const activeSites = SITES.filter(s => s.active);
  const inactiveSites = SITES.filter(s => !s.active);

  return (
    <div className={`relative min-h-screen pt-24 px-3 sm:px-4 md:px-8 pb-16 sm:pb-20 transition-colors duration-700 ${isDark ? "bg-[#030305] text-white" : "bg-[#fafafa] text-slate-900"}`}>
      <div className="max-w-6xl w-full mx-auto relative z-10">
        {inactiveSites.length > 0 && (
          <div className={`w-full px-4 mb-8 border-b-2 ${isDark ? "border-slate-200/10" : "border-slate-200/40"}`}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative flex items-center justify-center px-4 w-full mb-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className={`
        relative w-full max-w-md rounded-2xl p-5 shadow-2xl
        ${isDark ? "bg-[#0a0a0f]/20" : "bg-white"}
      `}
              >
                <h3
                  className={`
          text-center text-sm sm:text-base font-black mb-4 tracking-tight
          ${isDark ? "text-white" : "text-slate-900"}
        `}
                >
                  {isFr
                    ? "Le(s) site(s) suivant(s) est/sont temporairement fermé(s) : "
                    : "The following site(s) is/are temporarily closed: "}
                </h3>

                <div className="grid gap-2.5">
                  {inactiveSites.map(s => (
                    <div
                      key={s.name}
                      className={`
              flex items-center gap-3 p-3.5 rounded-xl border
              ${isDark
                          ? "bg-rose-950/20 border-rose-900/30"
                          : "bg-rose-50 border-rose-200"
                        }
            `}
                    >
                      <MapPin
                        className={`
                w-4 h-4 flex-shrink-0
                ${isDark ? "text-rose-400" : "text-rose-600"}
              `}
                      />

                      <span
                        className={`
                text-xs font-semibold flex-1 truncate
                ${isDark ? "text-white/90" : "text-slate-900"}
              `}
                      >
                        {s.name}
                      </span>

                      <span
                        className={`
                text-[10px] font-black uppercase tracking-wider
                ${isDark ? "text-rose-400" : "text-rose-600"}
              `}
                      >
                        {isFr ? "Travaux" : "Renovating"}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-3">
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${accent}, ${isDark ? "#fff" : "#000"})` }}>
              {isFr ? "Horaires & Événements" : "Hours & Events"}
            </span>
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-4">
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border text-xs sm:text-sm font-bold ${isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: accent }} />
              <span>Paris · {currentTimeStr}</span>
            </div>
            {activeWindow ? (
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs sm:text-sm font-black">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {activeWindow.label[language as "fr" | "en"]} {isFr ? "en cours" : "in progress"}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs sm:text-sm font-black">
                {nextOpeningStr}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`hidden lg:block rounded-3xl overflow-hidden ${isDark ? "bg-[#0c0c10] border-white/10" : "bg-white border-slate-200"}`}>

          {/* Day Headers */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const isT = isSameDay(day, now);
              return (
                <div key={i} className={`text-center py-4 ${isDark ? "border-b border-white/10" : "border-b border-slate-100"} ${i > 0 ? (isDark ? "border-l border-white/10" : "border-l border-slate-100") : ""}`}>
                  <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isDark ? "text-zinc-500" : "text-slate-400"}`}>{dayNamesShort[day.getDay()]}</div>
                  <div className={`text-lg font-black inline-flex items-center justify-center w-9 h-9 rounded-full ${isT ? "text-white" : ""}`}
                    style={isT ? { backgroundColor: accent } : undefined}>
                    {day.getDate()}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isDark ? "text-zinc-600" : "text-slate-400"}`}>{monthNames[day.getMonth()]}</div>
                  {isT && <div className="text-[9px] font-black uppercase mt-1" style={{ color: accent }}>{isFr ? "Aujourd'hui" : "Today"}</div>}
                  {i === 1 && <div className={`text-[9px] font-black uppercase mt-1 ${isDark ? "text-zinc-500" : "text-slate-400"}`}>{isFr ? "Demain" : "Tomorrow"}</div>}
                </div>
              );
            })}
          </div>

          {/* Service Window Rows */}
          {SERVICE_WINDOWS.map(w => (
            <div key={w.id} className="grid grid-cols-7">
              {days.map((day, i) => {
                const isT = isSameDay(day, now);
                const isLive = isT && isNowInWindow(w, now);
                const progress = isT ? progressInWindow(w, now) : -1;
                return (
                  <div key={i} className={`p-2.5 min-h-[100px] ${isDark ? "border-white/5" : "border-slate-50"} ${i > 0 ? (isDark ? "border-l border-white/5" : "border-l border-slate-50") : ""} border-b`}>
                    <div className={`rounded-xl p-3 h-full relative overflow-hidden transition-all ${isDark ? "bg-white/5" : "bg-slate-50"}`}
                      style={isLive ? { boxShadow: `0 0 0 2px ${accent}` } : undefined}>
                      {isLive && progress >= 0 && (
                        <div className="absolute bottom-0 left-0 h-1 rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: accent }} />
                      )}
                      {isLive && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accent }} />}
                      <div className="flex items-center gap-1 mb-1.5">
                        <Utensils className="w-3 h-3" style={{ color: accent }} />
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: accent }}>
                          {w.label[language as "fr" | "en"]}
                        </span>
                      </div>
                      <div className={`text-sm font-bold ${isDark ? "text-zinc-200" : "text-slate-800"}`}>
                        {fmt(w.open.h, w.open.m)} – {fmt(w.close.h, w.close.m)}
                      </div>
                      {isLive && <div className="text-[9px] font-black uppercase mt-1.5" style={{ color: "#10b981" }}>{isFr ? "En service" : "Now serving"}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:hidden space-y-2 sm:space-y-3">
          {days.map((day, i) => {
            const isToday = isSameDay(day, now);
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className={`rounded-2xl border overflow-hidden transition-all ${isToday ? "shadow-lg" : ""} ${isDark ? "bg-[#0c0c10] border-white/10" : "bg-white border-slate-200"}`}
                style={isToday ? { boxShadow: `0 0 0 2px ${accent}30` } : undefined}>
                <div className={`flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-3 sm:py-3.5 ${isDark ? "border-b border-white/5" : "border-b border-slate-50"}`}>
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm flex-shrink-0 ${isToday ? "text-white" : isDark ? "bg-white/5" : "bg-slate-100"}`}
                    style={isToday ? { backgroundColor: accent } : undefined}>
                    {day.getDate()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-black truncate">{dayNamesFull[day.getDay()]}</div>
                    <div className={`text-[10px] sm:text-[11px] ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                      {day.getDate()} {monthNames[day.getMonth()]} {day.getFullYear()}
                    </div>
                  </div>
                  {isToday && (
                    <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex-shrink-0">
                      {isFr ? "Aujourd'hui" : "Today"}
                    </span>
                  )}
                  {i === 1 && (
                    <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex-shrink-0 ${isDark ? "bg-white/5 text-zinc-400 border border-white/10" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                      {isFr ? "Demain" : "Tomorrow"}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 p-3 sm:p-4">
                  {SERVICE_WINDOWS.map(w => {
                    const isLive = isToday && isNowInWindow(w, now);
                    const progress = isToday ? progressInWindow(w, now) : -1;
                    return (
                      <div key={w.id} className={`rounded-xl p-3 sm:p-4 relative overflow-hidden ${isDark ? "bg-white/5" : "bg-slate-50"}`}
                        style={isLive ? { boxShadow: `0 0 0 2px ${accent}` } : undefined}>
                        {isLive && progress >= 0 && (
                          <div className="absolute bottom-0 left-0 h-1 rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: accent }} />
                        )}
                        {isLive && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accent }} />}
                        <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                          <Utensils className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: accent }} />
                          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider" style={{ color: accent }}>
                            {w.label[language as "fr" | "en"]}
                          </span>
                        </div>
                        <div className={`text-sm sm:text-base font-bold ${isDark ? "text-zinc-200" : "text-slate-800"}`}>
                          {fmt(w.open.h, w.open.m)} – {fmt(w.close.h, w.close.m)}
                        </div>
                        {isLive && (
                          <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider mt-1.5 sm:mt-2" style={{ color: "#10b981" }}>
                            {isFr ? "En service" : "Now serving"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div >
  );
}
