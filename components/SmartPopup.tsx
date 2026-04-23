"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/hooks/useTheme";
import { useAccentFromCookies } from "@/components/hooks/useAccentFromCookies";
import { X, Clock, Sparkles, ChefHat, MapPin } from "lucide-react";
import Link from "next/link";
import { MENU_DATA } from "@/data/menu";

// ── Cookie helpers ────────────────────────────────────────────────
function getCk(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}
function setCk(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// ── Paris time helper ─────────────────────────────────────────────
function getParisDate(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
}

// ── Service windows (same for all active sites, every day) ────────
const SERVICE_WINDOWS = [
  { open: 11 * 60 + 15, close: 14 * 60 + 45 }, // 11:15 - 14:45
  { open: 18 * 60 + 15, close: 22 * 60 + 45 }, // 18:15 - 22:45
];

function isCurrentlyOpen(): boolean {
  const now = getParisDate();
  const totalMins = now.getHours() * 60 + now.getMinutes();
  return SERVICE_WINDOWS.some(w => totalMins >= w.open && totalMins < w.close);
}

// ── Types ─────────────────────────────────────────────────────────
type PopupStep = "status" | "recommendation" | null;

export default function SmartPopup() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState<PopupStep>(null);
  const [recommendation, setRecommendation] = useState<any>(null);

  const { language } = useLanguage();
  const { isDark } = useTheme();
  const accent = useAccentFromCookies();
  const isFr = language === "fr";

  const showRecommendation = useCallback(() => {
    if (getCk("ins_recommendation_popup") === "seen") return;

    const isLuckyMenu = Math.random() < 0.8;
    const menuItems = MENU_DATA.filter(item => item.id >= 10 && item.category === "Menus");
    const otherPopularItems = MENU_DATA.filter(item => item.id >= 10 && item.category !== "Menus" && (item.popularity || 0) > 90);

    let pool = isLuckyMenu && menuItems.length > 0 ? menuItems : otherPopularItems;
    if (pool.length === 0) pool = otherPopularItems;

    if (pool.length > 0) {
      const randomItem = pool[Math.floor(Math.random() * pool.length)];
      setRecommendation(randomItem);
      setStep("recommendation");
      setTimeout(() => setIsVisible(true), 1500);
    }
  }, []);

  const initialize = useCallback(() => {
    const pariNow = getParisDate();
    const currentlyClosed = !isCurrentlyOpen();
    const isBeforeJune = pariNow.getFullYear() < 2026 || (pariNow.getFullYear() === 2026 && pariNow.getMonth() <= 5);

    // Priority 1: Status (Closed or Aubervilliers renovation)
    if ((currentlyClosed && getCk("ins_status_popup") !== "seen") ||
      (isBeforeJune && getCk("ins_aubervilliers_seen") !== "seen")) {

      setStep("status");
      setTimeout(() => setIsVisible(true), 1500);
      return;
    }

    // Priority 2: Recommendation
    showRecommendation();
  }, [showRecommendation]);

  useEffect(() => {
    // Don't show on search page
    if (pathname === "/search") return;

    const hasConsent = document.cookie.includes("cs_cookie_consent=accepted");

    if (hasConsent) {
      initialize();
    } else {
      const handleConsent = () => initialize();
      window.addEventListener("cookieConsentAccepted", handleConsent);
      return () => window.removeEventListener("cookieConsentAccepted", handleConsent);
    }
  }, [pathname, initialize]);

  // ── Close handlers ────────────────────────────────────────────
  const closePopup = useCallback(() => {
    setIsVisible(false);

    if (step === "status") {
      setCk("ins_status_popup", "seen", 1 / 24); // 1 hour
      setCk("ins_aubervilliers_seen", "seen", 365); // 1 year

      // Transition to recommendation if applicable
      setTimeout(() => {
        showRecommendation();
      }, 500); // Wait for modal to close first
    } else if (step === "recommendation") {
      setCk("ins_recommendation_popup", "seen", 1 / 24); // 1 hour
    }
  }, [step, showRecommendation]);

  if (!isVisible || !step) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 pb-0 md:p-4 pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePopup}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        />

        {/* Modal */}
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.4}
          onDragEnd={(_, info) => { if (info.offset.y > 80) closePopup(); }}
          className={`relative w-full max-w-md overflow-hidden pointer-events-auto rounded-t-[2.5rem] rounded-b-none md:rounded-[2.5rem] border shadow-2xl cursor-grab active:cursor-grabbing ${isDark ? "bg-[#0c0c10] border-white/10" : "bg-white border-slate-200"
            }`}
        >
          {/* MOBILE DRAG HANDLE */}
          <div className="absolute w-full flex justify-center pt-3 pb-2 z-50 md:hidden">
            <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }} />
          </div>

          {/* Decorative Glow */}
          <div
            className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-50 pointer-events-none"
            style={{ backgroundColor: accent }}
          />

          <button
            onClick={closePopup}
            className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-800"
              }`}
          >
            <X className="w-5 h-5" />
          </button>

          {step === "status" ? (
            // ── RESTAURANT STATUS STATE ──────────────────────────────────
            <div className="p-8 pt-12 text-center flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl relative"
                style={{ backgroundColor: `${accent}15` }}
              >
                <div className="absolute inset-0 animate-pulse opacity-30 rounded-2xl" style={{ backgroundColor: accent }} />
                <Clock className="w-8 h-8 relative z-10" style={{ color: accent }} />
              </div>

              <h2 className={`text-2xl font-black mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                {isFr ? "Horaires & Statuts" : "Hours & Status"}
              </h2>
              <p className={`text-sm mb-6 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                {isFr ? "Vérifiez la disponibilité de nos restaurants" : "Check the availability of our restaurants"}
              </p>

              <div className="w-full space-y-3 mb-8 text-left max-h-[40vh] overflow-y-auto premium-scrollbar pr-2">
                {(() => {
                  const hoursLabel = "11h15-14h45, 18h15-22h45";
                  const renovatingLabel = isFr ? "Fermé pour travaux" : "Closed for renovations";
                  const sites = [
                    { name: "Paris 15 - Pasteur", hours: hoursLabel, status: "active" as const },
                    { name: "Bordeaux – Cour du Médoc", hours: hoursLabel, status: "active" as const },
                    { name: "Courbevoie – La Défense", hours: hoursLabel, status: "active" as const },
                    { name: "Saint-Ouen", hours: hoursLabel, status: "active" as const },
                    { name: "Aubervilliers", hours: renovatingLabel, status: "renovating" as const },
                    { name: "Bagneux", hours: hoursLabel, status: "active" as const },
                    { name: "Ivry", hours: hoursLabel, status: "active" as const },
                  ];

                  const open = isCurrentlyOpen();

                  // Group sites by computed status & hours
                  const groups: { names: string[], hours: string, status: string }[] = [];

                  sites.forEach(site => {
                    const currentStatus = site.status === "renovating" ? "renovating" : (open ? "open" : "closed");
                    const existingGroup = groups.find(g => g.hours === site.hours && g.status === currentStatus);
                    if (existingGroup) {
                      existingGroup.names.push(site.name);
                    } else {
                      groups.push({ names: [site.name], hours: site.hours, status: currentStatus });
                    }
                  });

                  return groups.map((g, i) => (
                    <div key={i} className={`p-4 rounded-xl flex flex-col gap-3 border transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${isDark ? "text-zinc-500" : "text-slate-400"}`} />
                          <span className={`text-[11px] font-bold ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                            {g.names.length > 1 ? `${g.names.length} ${isFr ? 'Sites' : 'Locations'}` : '1 Site'}
                          </span>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${g.status === "renovating" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                          g.status === "closed" ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                            "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          }`}>
                          {g.status === "renovating" ? (isFr ? "Travaux" : "Renovating") :
                            g.status === "closed" ? (isFr ? "Fermé" : "Closed") :
                              (isFr ? "Ouvert" : "Open")}
                        </div>
                      </div>
                      <div>
                        <p className={`text-[13px] font-bold leading-relaxed ${isDark ? "text-white" : "text-slate-900"}`}>
                          {g.names.map(name => name.split(" - ")[0]).join(", ")}
                        </p>
                        <p className={`text-[11px] mt-1.5 font-semibold ${isDark ? "text-zinc-500" : "text-slate-500"}`}>{g.hours}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <button
                onClick={closePopup}
                className="w-full py-4 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 text-white"
                style={{ backgroundColor: accent, boxShadow: `0 10px 25px ${accent}40` }}
              >
                {isFr ? "Compris" : "Understood"}
              </button>
            </div>

          ) : step === "recommendation" && recommendation ? (
            // ── PRODUCT RECOMMENDATION STATE ──────────────────────
            <div className="relative">
              <div className="h-48 w-full relative">
                <img src={recommendation.image} alt={recommendation.name[language]} className="w-full h-full object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#0c0c10]' : 'from-white'} to-transparent`} />
              </div>

              <div className="p-8 pt-2 text-center flex flex-col items-center">
                <h3 className={`text-2xl font-black mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  {recommendation.name[language]}
                </h3>
                <p className={`text-sm mb-6 line-clamp-2 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  {recommendation.description[language]}
                </p>

                <div className="flex items-center justify-between w-full gap-4">
                  <div className="text-left">
                    <span className={`block text-xs font-bold uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                      {isFr ? "À partir de" : "Starting at"}
                    </span>
                    <span className="text-2xl font-black" style={{ color: accent }}>
                      {recommendation.prices[0].toFixed(2)}€
                    </span>
                  </div>

                  <Link href={`/search?item=${recommendation.id}`} onClick={closePopup}
                    className="flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 text-white shadow-xl"
                    style={{ backgroundColor: accent, boxShadow: `0 10px 25px ${accent}40` }}
                  >
                    <ChefHat className="w-5 h-5" />
                    {isFr ? "Découvrir" : "Discover"}
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
