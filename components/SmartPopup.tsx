"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/hooks/useTheme";
import { useAccentFromCookies } from "@/components/hooks/useAccentFromCookies";
import { X, Clock, Sparkles, ChefHat } from "lucide-react";
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

// ── Types ─────────────────────────────────────────────────────────
type PopupStep = "aubervilliers" | "recommendation" | "closed" | null;

export default function SmartPopup() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState<PopupStep>(null);
  const [recommendation, setRecommendation] = useState<any>(null);

  const { language } = useLanguage();
  const { isDark } = useTheme();
  const accent = useAccentFromCookies();
  const isFr = language === "fr";

  // ── Determine what to show ────────────────────────────────────
  const initialize = useCallback(() => {
    const pariNow = getParisDate();
    const hours = pariNow.getHours();
    const minutes = pariNow.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    const closeTime = 23 * 60 + 30; // 23:30
    const openTime = 11 * 60 + 30;  // 11:30

    const currentlyClosed = timeInMinutes >= closeTime || timeInMinutes < openTime;

    // Priority 1: Global closed
    if (currentlyClosed) {
      // Only show once per hour
      if (getCk("ins_closed_popup") === "seen") return;
      setStep("closed");
      setTimeout(() => setIsVisible(true), 1500);
      return;
    }

    // Priority 2: Aubervilliers renovation notice (show until end of June 2026, Paris time)
    const isBeforeJune = pariNow.getFullYear() < 2026 ||
      (pariNow.getFullYear() === 2026 && pariNow.getMonth() <= 5); // month 5 = June

    if (isBeforeJune && getCk("ins_aubervilliers_seen") !== "seen") {
      // Prepare recommendation data too (for after aubervilliers)
      const popularItems = MENU_DATA.filter(item => item.id >= 10 && (item.popularity || 0) > 90);
      if (popularItems.length > 0) {
        setRecommendation(popularItems[Math.floor(Math.random() * popularItems.length)]);
      }
      setStep("aubervilliers");
      setTimeout(() => setIsVisible(true), 1500);
      return;
    }

    // Priority 3: Recommendation (every 1 hour)
    if (getCk("ins_recommendation_popup") === "seen") return;
    const popularItems = MENU_DATA.filter(item => item.id >= 10 && (item.popularity || 0) > 90);
    if (popularItems.length > 0) {
      const randomItem = popularItems[Math.floor(Math.random() * popularItems.length)];
      setRecommendation(randomItem);
      setStep("recommendation");
      setTimeout(() => setIsVisible(true), 1500);
    }
  }, []);

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
    // Set cookie based on current step
    if (step === "closed") {
      setCk("ins_closed_popup", "seen", 1 / 24); // 1 hour
    } else if (step === "recommendation") {
      setCk("ins_recommendation_popup", "seen", 1 / 24); // 1 hour
    }
  }, [step]);

  const handleAubervilliersNext = useCallback(() => {
    // Mark aubervilliers as seen permanently
    setCk("ins_aubervilliers_seen", "seen", 365);

    // Transition to recommendation if we have one and it hasn't been seen
    if (recommendation && getCk("ins_recommendation_popup") !== "seen") {
      setStep("recommendation");
    } else {
      setIsVisible(false);
    }
  }, [recommendation]);

  if (!isVisible || !step) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePopup}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
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
          className={`relative w-full max-w-md overflow-hidden rounded-[2.5rem] border shadow-2xl cursor-grab active:cursor-grabbing ${
            isDark ? "bg-[#0c0c10] border-white/10" : "bg-white border-slate-200"
          }`}
        >
          {/* Decorative Glow */}
          <div
            className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-50"
            style={{ backgroundColor: step === "aubervilliers" ? "#f43f5e" : accent }}
          />

          <button
            onClick={closePopup}
            className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-800"
              }`}
          >
            <X className="w-5 h-5" />
          </button>

          {step === "closed" ? (
            // ── SITE CLOSED STATE ──────────────────────────────────
            <div className="p-8 pt-12 text-center flex flex-col items-center">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl relative"
                style={{ backgroundColor: `${accent}15` }}
              >
                <div className="absolute inset-0 animate-pulse opacity-30 rounded-3xl" style={{ backgroundColor: accent }} />
                <Clock className="w-10 h-10 relative z-10" style={{ color: accent }} />
              </div>

              <h2 className={`text-2xl font-black mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                {isFr ? "Nous sommes fermés" : "We are closed"}
              </h2>
              <p className={`text-sm mb-8 leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                {isFr
                  ? "Le restaurant est actuellement fermé. Vous pouvez toujours consulter notre menu et revenir pendant nos heures d'ouverture (11h30 - 23h30)."
                  : "The restaurant is currently closed. You can still browse our menu and come back during our opening hours (11:30 AM - 11:30 PM)."}
              </p>

              <button
                onClick={closePopup}
                className="w-full py-4 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 text-white"
                style={{ backgroundColor: accent, boxShadow: `0 10px 25px ${accent}40` }}
              >
                {isFr ? "J'ai compris" : "Understood"}
              </button>
            </div>

          ) : step === "aubervilliers" ? (
            // ── AUBERVILLIERS CLOSED STATE ─────────────────────────
            <div className="p-8 pt-12 text-center flex flex-col items-center">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl relative bg-rose-500/10"
              >
                <div className="absolute inset-0 animate-pulse opacity-30 rounded-3xl bg-rose-500" />
                <span className="text-4xl relative z-10">⚠️</span>
              </div>

              <h2 className={`text-2xl font-black mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                INS Aubervilliers
              </h2>
              <p className={`text-sm mb-8 leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                {isFr
                  ? "INS Aubervilliers est actuellement fermé pour travaux. Réouverture prévue le mois prochain ! Nos autres sites restent ouverts."
                  : "INS Aubervilliers is currently closed for renovations. It will reopen next month! Our other sites remain open."}
              </p>

              <button
                onClick={handleAubervilliersNext}
                className="w-full py-4 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 text-white"
                style={{ backgroundColor: "#f43f5e", boxShadow: "0 10px 25px rgba(244,63,94,0.25)" }}
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

                <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />
                  {isFr ? "Notre Recommandation" : "Our Recommendation"}
                </div>
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
