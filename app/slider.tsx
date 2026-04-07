"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type SVGProps,
  useRef,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ToastHandle";
import {
  Home,
  Settings,
  HelpCircle,
  Menu,
  X,
  Check,
  PanelLeft,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Palette,
  Layout,
  Pipette,
  Copyright,
  Paintbrush,
  ArrowRight,
  Shuffle,
  Building2,
  Building,
  Search,
  BookOpen,
  ExternalLink,
  Boxes
} from "lucide-react";
import { useCinematic } from "@/components/CinematicProvider";
import { useTheme } from "@/components/hooks/useTheme";
import MiniToggle from "@/components/MiniToggle";
import AuthButtons from "@/components/AuthButtons";
import FooterDef from "@/components/Footerdef";
import { useLanguage } from "@/contexts/LanguageContext";
const PALETTE = [
  { hex: "#FF6B00", name: "Orange Safran" },
  { hex: "#FF4500", name: "Rouge Tandoori" },
  { hex: "#FF8C00", name: "Orange Profond" },
  { hex: "#FFB300", name: "Curcuma" },
  { hex: "#FFD000", name: "Jaune Doré" },
  { hex: "#FF3B30", name: "Rouge Piment" },
  { hex: "#FF5E3A", name: "Corail Épicé" },
  { hex: "#FFA726", name: "Mangue" },
  { hex: "#FFC107", name: "Ambre" }
];

const COLORS = [
  "#FF6B00", "#FF4500", "#FF8C00", "#FFB300",
  "#FFD000", "#FF3B30", "#FF5E3A", "#FFA726",
  "#FFC107"
];

const NAMES: Record<string, string> = {
  "#FF6B00": "Orange Safran",
  "#FF4500": "Rouge Tandoori",
  "#FF8C00": "Orange Profond",
  "#FFB300": "Curcuma",
  "#FFD000": "Jaune Doré",
  "#FF3B30": "Rouge Piment",
  "#FF5E3A": "Corail Épicé",
  "#FFA726": "Mangue",
  "#FFC107": "Ambre"
};

const ACCENT_PALETTE = [
  "#FF6B00", "#FF4500", "#FF8C00", "#FFB300",
  "#FFD000", "#FF3B30", "#FF5E3A", "#FFA726",
  "#FFC107"
];


function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([.$?*|{}()\[\]\\\/+^])/g, "\\$1") +
        "=([^;]*)"
    )
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function writeCookie(name: string, value: string, days = 365) {
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${new Date(Date.now() + days * 864e5).toUTCString()}; path=/; SameSite=Lax`;
}

type ToastType = "success" | "error" | "info"

type Props = {
  accent?: string
  isDark?: boolean
  onAccentChange?: (accent: string) => void
  onVisibilityChange?: (visible: boolean) => void
  push?: (type: ToastType, message: string, duration?: number) => void
}



type Phase = "idle" | "in" | "show" | "out" | "gone";

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128;
}

export function CookieConsent({
  accent = "#8b5cf6",
  isDark = true,
  onAccentChange,
  onVisibilityChange,
  push,
}: Props) {
  const { introComplete } = useCinematic();
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("idle");
  const [color, setColor] = useState(accent);
  const [spinning, setSpinning] = useState(false);
  const [ripple, setRipple] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const themeName = NAMES[color] || "Custom";

  const year = new Date().getFullYear();
  const run = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  };

  const get = (k: string) => getCookie(k);
  const set = (k: string, v: string, d = 365) => writeCookie(k, v, d);
  const del = (k: string) => writeCookie(k, "", -1);

  useEffect(() => setColor(accent), [accent]);

  useEffect(() => {
    const msg = get("cs_pending_toast");
    if (msg) {
      push?.("info", msg);
      del("cs_pending_toast");
    }
  }, [push]);

  useEffect(() => {
    const termsShown = get("cs_terms_notice_shown") === "true";
    if (!termsShown) {
      push?.("info", "Nous utilisons des cookies!", 10000);
      set("cs_terms_notice_shown", "true");
    }
  }, [push]);

  useEffect(() => {
    if (!introComplete) return;

    const consent = get("cs_cookie_consent");
    const readyShown = get("cs_ready_toast_shown") === "true";

    if (consent) {
      setPhase("gone");
      if (!readyShown) {
        push?.("info", "Everything is ready! ✅");
        set("cs_ready_toast_shown", "true");
      }
      return;
    }

    run(() => setPhase("in"), 80);
    run(() => {
      setPhase("show");
      onVisibilityChange?.(true);
    }, 260);

    return () => timers.current.forEach(clearTimeout);
  }, [introComplete, onVisibilityChange, push]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "show") handleAccept();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const selectColor = useCallback(
    async (newColor: string) => {
      const oldColor = color; // current theme
      if (oldColor === newColor) {
        set("cs_pending_toast", "Cette palette est déjà appliquée.", 1);
        return;
      }

      const oldName = NAMES[oldColor] ?? "Ancienne palette";
      const newName = NAMES[newColor] ?? "Nouvelle palette";

      setColor(newColor);
      setRipple(true);

      await onAccentChange?.(newColor);

      set(
        "cs_pending_toast",
        `Palettage: ${oldName} -> ${newName}`,
        1
      );

      window.location.reload();
    },
    [color, onAccentChange]
  );



  const randomize = useCallback(() => {
    setSpinning(true);
    const pool = COLORS.filter((x) => x !== color);
    const next = pool[Math.floor(Math.random() * pool.length)];
    selectColor(next);
    run(() => setSpinning(false), 500);
  }, [color, selectColor]);

  const handleAccept = useCallback(() => {
    set("cs_cookie_consent", "accepted");
    onAccentChange?.(color);
    setPhase("out");
    run(() => {
      setPhase("gone");
      onVisibilityChange?.(false);
    }, 300);
  }, [color, onAccentChange, onVisibilityChange, push]);

  if (phase === "gone" || phase === "idle") return null;

  const isOut = phase === "out";
  const isReady = phase === "show";


  const ColorGrid = () => (
    <div className="mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[8px] font-bold uppercase tracking-wider"
          style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}
        >
          Palette INS
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); randomize(); }}
            className="flex items-center gap-1 text-[7px] font-semibold px-1.5 py-0.5 rounded-md transition-colors duration-200"
            style={{
              color,
              background: rgba(color, 0.08),
              border: `1px solid ${rgba(color, 0.12)}`
            }}
          >
            <Shuffle size={6} className={spinning ? "animate-spin" : ""} />
            Random
          </button>

          <span
            className="text-[9px] font-bold transition-colors duration-300"
            style={{ color }}
          >
            {themeName}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-9 gap-2">
        {COLORS.map((c) => {
          const sel = c === color;

          return (
            <button
              key={c}
              onClick={(e) => { e.stopPropagation(); selectColor(c); }}
              className="relative rounded-sm focus:outline-none"
              style={{
                aspectRatio: "1",
                background: c,
                boxShadow: sel
                  ? `0 0 0 1px ${isDark ? "#121218" : "#fff"}, 0 0 0 2px ${c}, 0 2px 6px -2px ${rgba(c, 0.45)}`
                  : `0 1px 4px -1px ${rgba(c, 0.18)}`,
                transform: sel ? "scale(1.12)" : "scale(1)",
                transition: "transform 0.18s ease, box-shadow 0.18s ease"
              }}
            >
              {sel && (
                <span
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ animation: "popIn 0.22s cubic-bezier(.34,1.56,.64,1)" }}
                >
                  <Check
                    size={7}
                    strokeWidth={3}
                    style={{ color: isLight(c) ? "#000" : "#fff" }}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );


  const Header = ({ logoSize, brandSize, themeSize }: { logoSize: string; brandSize: string; themeSize: string }) => (
    <div className="flex items-center gap-1.5">
      <div
        className="rounded-xl overflow-hidden relative shrink-0 transition-transform duration-300"
        style={{
          width: logoSize,
          height: logoSize,
          transform: ripple ? "scale(1.08)" : "scale(1)",
        }}
      >
        <Image src="/etc/android-chrome-512x512.png" alt="INDIAN NEPALI SWAD" fill className="object-cover" loading="eager" sizes={logoSize} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`m-0 font-semibold uppercase tracking-widest leading-tight ${isDark ? "text-white" : "text-black"}`}
          style={{ fontSize: brandSize }}
        >
          INDIAN NEPALI SWAD
        </p>
        <div className={`flex leading-none ${isDark ? "text-white" : "text-black"}`} style={{ fontSize: themeSize }}>La gastronomie indienne et népalaise
          <span
            className="block font-bold ps-1"
            style={{ fontSize: themeSize, color }}
          >
            &copy;2017-{year}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 z-99 cursor-pointer"
        style={{
          background: "rgba(0,0,0,0.4)",
          pointerEvents: isOut ? "none" : "auto",
          opacity: isOut ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}
        onClick={handleAccept}
      />

      <div
        className="sm:hidden fixed inset-x-0 bottom-0 z-100"
        style={{ pointerEvents: isOut ? "none" : "auto" }}
        role="dialog"
        aria-modal="true"
      >
        <div
          style={{
            opacity: isOut ? 0 : isReady ? 1 : 0,
            transform: isOut ? "translateY(100%)" : isReady ? "translateY(0)" : "translateY(100%)",
            transition: "all 0.4s cubic-bezier(.16,1,.3,1)",
          }}
        >
          <div
            className="relative overflow-hidden"
            style={{
              background: isDark ? "#0c0c10" : "#fafafa",
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              boxShadow: "0 -16px 50px -16px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-6 relative">
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
              </div>

              <Header logoSize="44px" brandSize="22px" themeSize="11px" />

              <div className="rounded-xl p-3.5 mb-4" style={{
                background: rgba(color, isDark ? 0.06 : 0.03),
                border: `1px solid ${rgba(color, 0.08)}`,
              }}>
                <p
                  className="text-[12px] leading-[1.7] m-0"
                  style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}
                >
                  {language === 'en' ? 'To offer you a better experience, ' : 'Pour vous offrir une meilleure expérience, '}
                  <span
                  className="px-1"
                    style={{
                      fontWeight: 700,
                      color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"
                    }}
                  >
                    INS
                  </span> {language === 'en' ? 'and its services use cookies.' : 'et ses services utilisent des cookies.'}{" "}
                  <Link
                    href="/terms"
                    className="relative inline-block"
                    style={{ color }}
                  >
                    <span className="relative z-10">{language === 'en' ? 'Learn more' : 'En savoir plus'}</span>
                  </Link>

                </p>
              </div>

              <ColorGrid />

              <button
                onClick={handleAccept}
                className="w-full py-3.5 rounded-xl text-[14px] font-bold text-white focus:outline-none transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${rgba(color, 0.85)})`,
                  boxShadow: `0 5px 20px -5px ${rgba(color, 0.55)}, inset 0 1px 0 ${rgba(color, 0.25)}`,
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  {language === 'en' ? 'Accept' : 'Accepter'}
                  <ArrowRight size={15} />
                </span>
              </button>

              <p className="text-center text-[9px] mt-3 m-0" style={{ color: isDark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.62)" }}>
                {language === 'en' ? 'Click "Accept" or anywhere outside to continue' : 'Cliquez sur “Accepter” ou n\'importe où en dehors pour continuer'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="hidden sm:block fixed bottom-6 left-6 z-100"
        style={{ pointerEvents: isOut ? "none" : "auto" }}
        role="dialog"
        aria-modal="true"
      >
        <div
          style={{
            opacity: isOut ? 0 : isReady ? 1 : 0,
            transform: isOut ? "translateY(16px) scale(0.96)" : isReady ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
            transition: "all 0.4s cubic-bezier(.16,1,.3,1)",
          }}
        >
          <div
            className="absolute -inset-8 rounded-2xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 15% 85%, ${rgba(color, 0.14)}, transparent 60%)`,
              filter: "blur(32px)",
              opacity: isOut ? 0 : 0.7,
              transition: "opacity 0.4s, background 0.4s",
            }}
          />

          <div
            className="relative w-100 rounded-[1.1rem] overflow-hidden"
            style={{
              background: isDark ? "linear-gradient(165deg, #121218 0%, #0a0a0e 100%)" : "linear-gradient(165deg, #fff 0%, #f8f8f6 100%)",
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}`,
              borderLeft: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}`,
              borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}`,
              boxShadow: isDark
                ? "0 20px 60px -16px rgba(0,0,0,0.55), 0 8px 24px -8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)"
                : "0 20px 60px -16px rgba(0,0,0,0.1), 0 8px 24px -8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 relative">
              <div className="flex items-start gap-3.5 mb-4">
                <div className="flex-1 min-w-0">
                  <Header logoSize="40px" brandSize="20px" themeSize="11px" />
                </div>
                <button
                  onClick={handleAccept}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 focus:outline-none"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                    color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
                  }}
                >
                  <X size={13} />
                </button>
              </div>

              <div className="rounded-xl p-3 mb-4" style={{
                background: rgba(color, isDark ? 0.06 : 0.03),
                border: `1px solid ${rgba(color, 0.08)}`,
              }}>
                <p
                  className="text-[12px] leading-[1.7] m-0"
                  style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}
                >
                  {language === 'en' ? 'To offer you a better experience, ' : 'Pour vous offrir une meilleure expérience, '}
                  <span
                  className="px-1"
                    style={{
                      fontWeight: 700,
                      color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"
                    }}
                  >
                    INS
                  </span> {language === 'en' ? 'and its services use cookies.' : 'et ses services utilisent des cookies.'}{" "}
                  <Link
                    href="/mentions-legales"
                    className="relative inline-block"
                    style={{ color }}
                  >
                    <span className="relative z-10">{language === 'en' ? 'Learn more' : 'En savoir plus'}</span>
                  </Link>

                </p>

              </div>

              <ColorGrid />

              <button
                onClick={handleAccept}
                className="w-full py-3 rounded-[0.85rem] text-[13px] font-bold text-white focus:outline-none transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${rgba(color, 0.85)})`,
                  boxShadow: `0 4px 16px -4px ${rgba(color, 0.5)}, inset 0 1px 0 ${rgba(color, 0.2)}`,
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  {language === 'en' ? 'Accept' : 'Accepter'}
                  <ArrowRight size={13} />
                </span>
              </button>

              <p className="text-center text-[9px] mt-3 m-0" style={{ color: isDark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.62)" }}>
                Cliquez sur “Accepter” ou n&apos;importe où en dehors pour continuer
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes popIn {
          0%   { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    const cookie = getCookie(`cs_${key}`);
    if (cookie === null) return defaultValue;
    try {
      return JSON.parse(cookie) as T;
    } catch {
      return cookie as unknown as T;
    }
  });

  const setPersisted = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next =
          typeof value === "function"
            ? (value as (p: T) => T)(prev)
            : value;
        setCookie(`cs_${key}`, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  return [state, setPersisted];
}

type IconComp = React.FC<SVGProps<SVGSVGElement>>;
type PanelTab = "appearance";

const TAB_CONFIG: { id: PanelTab; label: string; icon: IconComp }[] = [
  { id: "appearance", label: "Personnalisation", icon: Sparkles },
];

type NavLink = { href: string; label: string; icon?: IconComp };
type NavGroup = {
  key: string;
  label: string;
  icon?: IconComp;
  items: NavLink[];
};
type NavSection = {
  label: string;
  links?: NavLink[];
  groups?: NavGroup[];
};

const sections: NavSection[] = [
  
  {
    label: "Acceuil",
    links: [
      { href: "/", label: "Acceuil", icon: Home },
    ],
  },
  {
    label: "Liens utiles",
    links: [{ href: "/search", label: "Rechercher", icon: Search }],
    
    groups: [
      {
        key: "sites",
        label: "Nos Sites Deliveroo INS",
        icon: Building2,
        items: [
          {
            href: "https://deliveroo.fr/fr/menu/paris/Pasteur/bidit-risheb/",
            label: "Deliveroo Paris 15",
            icon: Building,
          },
          {
            href: "https://deliveroo.fr/fr/menu/bordeaux/bordeaux-editions-cour-du-medoc/indian-nepali-swad-editions-bordeaux/",
            label: "Deliveroo Bordeaux",
            icon: Building,
          },
          {
            href: "https://deliveroo.fr/fr/menu/paris/editions-courbevoie/indian-nepali-swad-editions-courbevoie/",
            label: "Deliveroo Courbevoie",
            icon: Building,
          },
          {
            href: "https://deliveroo.fr/fr/menu/paris/editions-saint-ouen/indian-nepali-swad-editions-aubervilliers/",
            label: "Deliveroo Saint-Ouen",
            icon: Building,
          },
          {
            href: "https://deliveroo.fr/fr/menu/paris/editions-site-bagneux/indian-nepali-swad-editions-bagneux/",
            label: "Deliveroo Bagneux",
            icon: Building,
          },
          {
            href: "https://deliveroo.fr/fr/menu/paris/editions-ivry/indian-nepali-swad-editions-ivry/",
            label: "Deliveroo Ivry",
            icon: Building,
          }
        ],
      },
    ],
  },
  {
    label: "Apps",
    links: [
      { href: "https://bktk.indian-nepaliswad.fr/", label: "BKTK InterSociété", icon: Boxes },
      { href: "/auth-demo", label: "Auth Demo", icon: Sparkles },
    ],
  },
];

function TabCarousel({
  activeTab,
  onTabChange,
  isDark,
  onClose,
  accent,
}: {
  activeTab: PanelTab;
  onTabChange: (t: PanelTab) => void;
  isDark: boolean;
  onClose: () => void;
  accent: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(
      el.scrollLeft < el.scrollWidth - el.clientWidth - 8
    );
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scrollBy = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 140, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <>
          <div
            className={`absolute left-6 top-0 bottom-0 w-12 z-10 pointer-events-none ${
              isDark
                ? "bg-linear-to-r from-[#08080c] to-transparent"
                : "bg-linear-to-r from-[#fefefe] to-transparent"
            }`}
          />
          <button
            onClick={() => scrollBy(-1)}
            className={`absolute left-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 ${
              isDark
                ? "bg-white/8 hover:bg-white/12 text-white/40"
                : "bg-black/8 hover:bg-black/12 text-black/40"
            }`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </>
      )}

      {canScrollRight && (
        <>
          <div
            className={`absolute right-16 top-0 bottom-0 w-12 z-10 pointer-events-none ${
              isDark
                ? "bg-linear-to-l from-[#08080c] to-transparent"
                : "bg-linear-to-l from-[#fefefe] to-transparent"
            }`}
          />
          <button
            onClick={() => scrollBy(1)}
            className={`absolute right-12 top-1/2 -translate-y-1/2 z-20 h-7 w-7 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 ${
              isDark
                ? "bg-white/8 hover:bg-white/12 text-white/40"
                : "bg-black/8 hover:bg-black/12 text-black/40"
            }`}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </>
      )}

      <button
        onClick={onClose}
        className={`absolute right-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 ${
          isDark
            ? "hover:bg-white/8 text-white/20 hover:text-white/50"
            : "hover:bg-black/8 text-black/20 hover:text-black/50"
        }`}
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-0.5 overflow-x-auto scrollbar-none px-1 py-2 ms-6 me-16"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {TAB_CONFIG.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all duration-300 shrink-0 ${
                active
                  ? "text-white border shadow-lg"
                  : isDark
                  ? "text-white/30 hover:text-white/60 hover:bg-white/4 border border-transparent"
                  : "text-black/30 hover:text-black/60 hover:bg-black/4 border border-transparent"
              }`}
              style={
                active
                  ? {
                      background: `linear-gradient(to right, ${accent}30, ${accent}15)`,
                      borderColor: `${accent}40`,
                      boxShadow: `0 4px 16px -4px ${accent}30`,
                    }
                  : {}
              }
            >
              <tab.icon
                className="h-3.5 w-3.5 transition-all duration-300"
                style={active ? { color: accent } : {}}
              />
              <span
                style={active ? { color: accent } : {}}
              >
                {tab.label}
              </span>
              {active && (
                <div
                  className="absolute -bottom-2.25 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                  style={{ backgroundColor: accent }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const DEFAULTS = {
  accent: "#8b5cf6",
  sidebarCollapsed: true,
  compactMode: false,
  fullWidth: false,
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ColorDot({
  color,
  isSelected,
  onSelect,
  size = 32,
}: {
  color: { hex: string; name: string };
  isSelected: boolean;
  onSelect: (hex: string) => void;
  size?: number;
}) {
  return (
    <button
      onClick={() => onSelect(color.hex)}
      className="group relative flex flex-col items-center gap-1.5 touch-manipulation shrink-0"
      title={color.name}
    >
      <div
        className={`relative rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isSelected ? "scale-110" : "hover:scale-105 active:scale-90"
        }`}
        style={{
          width: size,
          height: size,
          backgroundColor: color.hex,
          boxShadow: isSelected
            ? `0 0 0 2px ${isDarkBg(color.hex) ? "#08080c" : "#fafafa"}, 0 0 0 3.5px ${color.hex}, 0 4px 20px -2px ${hexToRgba(color.hex, 0.5)}`
            : `0 2px 8px -2px ${hexToRgba(color.hex, 0.3)}`,
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Check
              className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
              size={size * 0.45}
              strokeWidth={3}
            />
          </div>
        )}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-200"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 50%)`,
            opacity: isSelected ? 0.6 : 0,
          }}
        />
      </div>
      <span
        className={`text-[7px] font-semibold tracking-wide transition-all duration-200 whitespace-nowrap ${
          isSelected ? "opacity-70" : "opacity-0 group-hover:opacity-40 group-active:opacity-50"
        }`}
        style={{ color: color.hex }}
      >
        {color.name}
      </span>
    </button>
  );
}

function isDarkBg(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

// ── Theme Card ──
function ThemeCard({
  value,
  icon: Icon,
  label,
  isActive,
  accent,
  isDark,
  onClick,
}: {
  value: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  accent: string;
  isDark: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex-1 rounded-2xl border p-3 transition-all duration-500 ease-out overflow-hidden touch-manipulation"
      style={{
        borderColor: isActive
          ? hexToRgba(accent, 0.35)
          : isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(0,0,0,0.06)",
        backgroundColor: isActive
          ? hexToRgba(accent, 0.06)
          : isDark
          ? "rgba(255,255,255,0.02)"
          : "rgba(0,0,0,0.015)",
        boxShadow: isActive ? `0 4px 24px -8px ${hexToRgba(accent, 0.25)}` : "none",
      }}
    >
      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${hexToRgba(accent, 0.08)}, transparent 70%)`,
          }}
        />
      )}

      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-1.5">
          <Icon
            className="h-3 w-3 transition-colors duration-300"
            style={{ color: isActive ? accent : isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)" }}
            strokeWidth={isActive ? 2 : 1.5}
          />
          <span
            className="text-[10px] font-semibold transition-colors duration-300"
            style={{ color: isActive ? accent : isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)" }}
          >
            {label}
          </span>
        </div>
        {isActive && (
          <div
            className="h-2 w-2 rounded-full animate-scaleIn"
            style={{ backgroundColor: accent, boxShadow: `0 0 8px ${hexToRgba(accent, 0.6)}` }}
          />
        )}
      </div>
    </button>
  );
}

function AppearancePanel({
  isDark,
  theme,
  setTheme,
  settings,
  setSettings,
  push
}: {
  isDark: boolean;
  theme: string;
  setTheme: (t: "light" | "dark" | "system") => void;
  settings: any;
  setSettings: (key: string, value: any) => void;
  push: (type: "success" | "error" | "info", message: string) => void;
}) {
  const [accent, setAccent] = useState(settings.accent || DEFAULTS.accent);
  const [resetting, setResetting] = useState(false);
  const [showCustomHex, setShowCustomHex] = useState(true);
  const [hexInput, setHexInput] = useState("");
  const [hoveredHex, setHoveredHex] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = selectedRef.current;
      const offset = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
      container.scrollTo({ left: offset, behavior: "instant" });
    }
  }, []);

  const selectAccent = (color: string) => {
    setAccent(color);
    setSettings("accent", color);
  };

  const applyCustomHex = () => {
    const cleaned = hexInput.trim().toLowerCase();

    if (!/^#?[0-9a-f]{6}$/.test(cleaned)) {
      push("error", "Invalid HEX color");
      return;
    }

    const hex = cleaned.startsWith("#") ? cleaned : `#${cleaned}`;

    const hexToRgb = (h: string) => ({
      r: parseInt(h.slice(1, 3), 16),
      g: parseInt(h.slice(3, 5), 16),
      b: parseInt(h.slice(5, 7), 16),
    });

    const brightness = (() => {
      const { r, g, b } = hexToRgb(hex);
      return 0.299 * r + 0.587 * g + 0.114 * b;
    })();

    const colorDistance = (a: string, b: string) => {
      const c1 = hexToRgb(a);
      const c2 = hexToRgb(b);
      return Math.sqrt(
        (c1.r - c2.r) ** 2 +
        (c1.g - c2.g) ** 2 +
        (c1.b - c2.b) ** 2
      );
    };

    const MIN_BRIGHTNESS = 40;
    const MAX_BRIGHTNESS = 220;
    const MAX_DISTANCE = 180;

    if (brightness < MIN_BRIGHTNESS) {
      push("error", "Color too dark");
      return;
    }

    if (brightness > MAX_BRIGHTNESS) {
      push("error", "Color too light");
      return;
    }

    // ❌ not matching theme
    const isClose = COLORS.some(c => colorDistance(hex, c) < MAX_DISTANCE);
    if (!isClose) {
      push("error", "Color not matching theme");
      return;
    }

    const closest = COLORS.reduce((prev, curr) =>
      colorDistance(hex, curr) < colorDistance(hex, prev) ? curr : prev
    );

    selectAccent(closest);
    setShowCustomHex(false);
    setHexInput("");

    push("success", "Accent color applied ✨");
  };

  const handleReset = useCallback(() => {
    setResetting(true);
    setTimeout(() => {
      setAccent(DEFAULTS.accent);
      setSettings("accent", DEFAULTS.accent);
      setSettings("sidebarCollapsed", DEFAULTS.sidebarCollapsed);
      setSettings("compactMode", DEFAULTS.compactMode);
      setSettings("fullWidth", DEFAULTS.fullWidth);
      setResetting(false);
    }, 400);
  }, [setSettings]);

  const themes = [
    {
      value: "light" as const,
      icon: Sun,
      label: "Light",
    },
    {
      value: "dark" as const,
      icon: Moon,
      label: "Dark",
    },
    {
      value: "system" as const,
      icon: Monitor,
      label: "Auto",
    },
  ];

  const activeAccent = hoveredHex || accent;

  return (
    <div className="space-y-7">
      <section className="space-y-2.5">
        <SectionHeader label="Theme" icon={Palette} isDark={isDark} accent={accent} />
        <div className="grid grid-cols-3 gap-2">
          {themes.map(({ value, icon: Icon, label }) => (
            <ThemeCard
              key={value}
              value={value}
              icon={Icon}
              label={label}
              isActive={theme === value}
              accent={accent}
              isDark={isDark}
              onClick={() => {
                if (theme !== value) {
                  setTheme(value);
                  window.location.reload();
                }
              }}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <SectionHeader label="Accent" icon={Paintbrush} isDark={isDark} accent={accent} />
          <button
            onClick={() => setShowCustomHex(!showCustomHex)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all duration-200 touch-manipulation"
            style={{
              color: showCustomHex ? accent : isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.22)",
              backgroundColor: showCustomHex ? hexToRgba(accent, 0.08) : "transparent",
            }}
          >
            <Pipette className="h-2.5 w-2.5" />
            HEX
          </button>
        </div>

        <div
          className="h-1.5 rounded-full mx-0.5 mb-1"
          style={{
            background: `linear-gradient(to right, ${PALETTE.map((c) => c.hex).join(", ")})`,
            opacity: 0.7,
          }}
        />

        <div
          className="rounded-2xl p-3 border"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)",
            backgroundColor: isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.01)",
          }}
        >
          <div className="grid grid-cols-9 gap-x-2 gap-y-3">
            {PALETTE.map((color) => {
              const isSelected = accent === color.hex;
              return (
                <div key={color.hex} ref={isSelected ? selectedRef : undefined} className="flex justify-center">
                  <ColorDot color={color} isSelected={isSelected} onSelect={selectAccent} size={28} />
                </div>
              );
            })}
          </div>
        </div>
        <div
          className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            maxHeight: showCustomHex ? 48 : 0,
            opacity: showCustomHex ? 1 : 0,
          }}
        >
          <div className="flex items-center gap-1.5 pt-1">
            <div className="relative flex-1">
              <div
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-md pointer-events-none transition-all duration-200"
                style={{
                  backgroundColor: /^#?[0-9a-f]{6}$/i.test(hexInput.trim())
                    ? (hexInput.trim().startsWith("#") ? hexInput.trim() : `#${hexInput.trim()}`)
                    : "transparent",
                  boxShadow: /^#?[0-9a-f]{6}$/i.test(hexInput.trim())
                    ? `0 0 0 1px ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`
                    : "none",
                }}
              />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyCustomHex()}
                placeholder="#8b5cf6"
                className="w-full h-8 pl-8 pr-2 rounded-xl text-[11px] font-mono outline-none transition-all duration-200"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  color: isDark ? "white" : "black",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = hexToRgba(accent, 0.35);
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(accent, 0.08)}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <button
              onClick={applyCustomHex}
              disabled={!/^#?[0-9a-f]{6}$/i.test(hexInput.trim())}
              className="h-8 px-3 rounded-xl text-[10px] font-bold transition-all duration-200 disabled:opacity-20 active:scale-95 touch-manipulation"
              style={{
                backgroundColor: accent,
                color: "white",
                boxShadow: `0 2px 8px -2px ${hexToRgba(accent, 0.4)}`,
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-2.5">
        <SectionHeader label="Layout" icon={Layout} isDark={isDark} accent={accent} />
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)",
            backgroundColor: isDark ? "rgba(255,255,255,0.015)" : "white",
          }}
        >
          <SetRow icon={PanelLeft} title="Sidebar Collapsed" desc="Start minimized" isDark={isDark} border accent={accent}>
            <MiniToggle dark={isDark} initialOn={settings.sidebarCollapsed} onChange={(v: boolean) => setSettings("sidebarCollapsed", v)} accent={accent} />
          </SetRow>
        </div>
      </section>
    </div>
  );
}

// ── Shared helpers ──
function SectionHeader({ label, icon: Icon, isDark, accent }: {
  label: string; icon?: React.ElementType; isDark: boolean; accent?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-0.5">
      {Icon && <Icon className="h-3 w-3" style={{ color: accent ? hexToRgba(accent, 0.5) : "rgba(255,255,255,0.25)" }} />}
      <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-white/25" : "text-black/25"}`}>
        {label}
      </span>
    </div>
  );
}

function SetRow({ icon: Icon, title, desc, isDark, children, border = false, accent }: {
  icon?: React.ElementType; title: string; desc?: string; isDark: boolean;
  children?: React.ReactNode; border?: boolean; accent?: string;
}) {
  return (
    <div className={`flex items-center gap-3 py-3 px-4 ${border ? `border-b ${isDark ? "border-white/4" : "border-zinc-100"}` : ""}`}>
      {Icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: accent ? hexToRgba(accent, 0.08) : "rgba(255,255,255,0.04)" }}>
          <Icon className="h-3.5 w-3.5" style={{ color: accent || "#a78bfa" }} strokeWidth={1.5} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-[11px] font-medium ${isDark ? "text-white/60" : "text-zinc-700"}`}>{title}</div>
        {desc && <div className={`text-[9px] mt-0.5 ${isDark ? "text-white/20" : "text-zinc-400"}`}>{desc}</div>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isDesktop;
}
function getRandomAccent(): string {
  return ACCENT_PALETTE[Math.floor(Math.random() * ACCENT_PALETTE.length)];
}

function initializeAccent(): string {
  if (typeof document === "undefined") return "#8b5cf6";

  const hasCookie = document.cookie.includes("cs_settings=");
  if (hasCookie) return "#8b5cf6";

  // First visit — pick random and persist immediately
  const accent = getRandomAccent();
  const settings = {
    accent,
    sidebarCollapsed: true,
    compactMode: false,
    fullWidth: false,
    keyboardShortcuts: true,
    localCache: true,
    pushNotifications: true,
    notificationSound: true,
    weeklyDigest: true,
    productNews: true,
    marketingEmails: true,
    doNotDisturb: false,
    analytics: false,
    telemetry: true,
    privateMode: false,
  };
  document.cookie = `cs_settings=${encodeURIComponent(JSON.stringify(settings))};path=/;max-age=31536000;SameSite=Lax`;
  return accent;
}

export default function SliderLayout({
  children,
}: {
  children?: ReactNode;
}) {
  const { theme, setTheme, isDark } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>("appearance");
  const [openGroup, setOpenGroup] = useState<string | null>("sites");
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(
    new Set(["pro"])
  );
  const [scrolled, setScrolled] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const { push } = useToast();
  const isDesktop = useIsDesktop();

  const [settings, setSettingsState] = usePersistedState("settings", {
    accent: initializeAccent(),
    sidebarCollapsed: true,
    compactMode: false,
    fullWidth: false,
    keyboardShortcuts: true,
    localCache: true,
    pushNotifications: true,
    notificationSound: true,
    weeklyDigest: true,
    productNews: true,
    marketingEmails: true,
    doNotDisturb: false,
    analytics: false,
    telemetry: true,
    privateMode: false,
  });
  const [consentOpen, setConsentOpen] = useState(false);
  const accent = settings.accent || "#8b5cf6";
  useEffect(() => {
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
  const setSetting = useCallback(
    (key: string, value: any) => {
      setSettingsState((prev: any) => ({ ...prev, [key]: value }));
    },
    [setSettingsState]
  );

  const year = new Date().getFullYear();

  useEffect(() => {
    setPageTitle(document.title);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen || panelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, panelOpen]);

  const toggleGroup = useCallback(
    (k: string) => setOpenGroup((g) => (g === k ? null : k)),
    []
  );

  const openPanel = useCallback((tab: PanelTab) => {
    setActiveTab(tab);
    setPanelOpen(true);
  }, []);

  const switchTab = useCallback((tab: PanelTab) => {
    setActiveTab(tab);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePanel();
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [closePanel]);

  const sw = settings.sidebarCollapsed ? "w-[68px]" : "w-[264px]";

  return (
    <div
      className={`min-h-screen  ${consentOpen ? "h-screen overflow-hidden pointer-events-none" : ""} transition-colors duration-500 ${
        isDark ? "bg-[#060609]" : "bg-[#faf9f7]"
      }`}
    >
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full flex-col border-r ${sw} backdrop-blur-2xl transition-all duration-300 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: isDark
            ? "rgba(10,10,15,0.98)"
            : "rgba(253,252,251,0.98)",
          borderColor: isDark
            ? `${accent}08`
            : "rgba(0,0,0,0.04)",
        }}
      >
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(to right, transparent, ${accent}30, transparent)`,
          }}
        />

        <div
          className={`flex h-14 items-center px-4 ${
            settings.sidebarCollapsed
              ? "justify-center"
              : "justify-between"
          }`}
        >
          {!settings.sidebarCollapsed ? (
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div
                  className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-lg"
                  style={{ backgroundColor: `${accent}30` }}
                />
                <Image
                  src="/etc/android-chrome-512x512.png"
                  width={30}
                  height={30}
                  alt=""
                  loading="eager"
                  className="relative rounded-lg group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="animate-fadeIn flex flex-col pt-2">
                <span
                  className={`text-[14px] font-bold ${
                    isDark ? "text-white" : "text-zinc-900"
                  }`}
                >
                  INDIAN NEPALI SWAD
                </span>
                <span
                  className={`text-[9px] font-medium ${
                    isDark ? "text-white/60" : "text-zinc-500"
                  }`}
                >
                  Gastronomie Indienne et Nepalaise
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/" className="relative group">
              <div
                className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-lg"
                style={{ backgroundColor: `${accent}30` }}
              />
              <Image
                src="/etc/android-chrome-512x512.png"
                width={30}
                height={30}
                alt=""
                loading="eager"
                className="relative rounded-lg group-hover:scale-110 transition-transform duration-300"
              />
            </Link>
          )}

          {!settings.sidebarCollapsed && (
            <button
              onClick={() => setSetting("sidebarCollapsed", true)}
              className={`hidden md:flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                isDark
                  ? "bg-white/4 hover:bg-white/6 text-white/40"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-400"
              }`}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
          )}
        </div>

        {settings.sidebarCollapsed && (
          <div className="hidden md:flex justify-center pb-2">
            <button
              onClick={() => setSetting("sidebarCollapsed", false)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                isDark
                  ? "bg-white/4 hover:bg-white/6 text-white/40"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-400"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2.5 py-4 custom-scrollbar">
          {settings.sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-1.5">
              {sections.flatMap((s) => [
                ...(s.links || []).map((l) => {
                  const isActive = pathname === l.href;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      title={l.label}
                      className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
                        isDark
                          ? "text-white/40 hover:bg-white/6"
                          : "text-zinc-400 hover:bg-zinc-100"
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: accent,
                              color: "white",
                              boxShadow: `0 4px 16px ${accent}40`,
                            }
                          : {}
                      }
                    >
                      {l.icon && (
                        <l.icon
                          className={`relative z-10 h-4.5 w-4.5 transition-transform duration-300 ${
                            isActive
                              ? "scale-110"
                              : "group-hover:scale-105"
                          }`}
                          style={
                            !isActive
                              ? { color: `${accent}80` }
                              : {}
                          }
                        />
                      )}
                    </Link>
                  );
                }),
                ...(s.groups || []).map((g) => {
                  const isGroupActive = g.items?.some(
                    (item) => pathname === item.href
                  );
                  return (
                    <div
                      key={g.key}
                      className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 cursor-pointer ${
                        isDark
                          ? "text-white/40 hover:bg-white/6"
                          : "text-zinc-400 hover:bg-zinc-100"
                      }`}
                      style={
                        isGroupActive
                          ? {
                              backgroundColor: `${accent}20`,
                              color: accent,
                              boxShadow: `0 2px 8px ${accent}20`,
                            }
                          : {}
                      }
                      onClick={() => {
                        setSetting("sidebarCollapsed", false);
                        setOpenGroup(g.key);
                      }}
                      title={g.label}
                    >
                      {g.icon && (
                        <g.icon
                          className={`relative z-10 h-4.5 w-4.5 transition-transform duration-300 ${
                            isGroupActive
                              ? "scale-105"
                              : "group-hover:scale-105"
                          }`}
                          style={
                            !isGroupActive
                              ? { color: `${accent}80` }
                              : {}
                          }
                        />
                      )}
                    </div>
                  );
                }),
              ])}
            </div>
          ) : (
            <>
              {sections.map((section) => (
                <React.Fragment key={section.label}>
                  <div className="mb-1 mt-2 first:mt-0 px-2.5">
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-[0.15em] ${
                        isDark ? "text-zinc-500" : "text-zinc-400"
                      }`}
                    >
                      {section.label}
                    </span>
                  </div>

                  {section.links?.map((l) => {
                    const isActive = pathname === l.href;
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] font-medium transition-all duration-300 mb-1 ${
                          isDark
                            ? "text-zinc-400 hover:text-white hover:bg-white/4"
                            : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                        }`}
                        style={
                          isActive
                            ? {
                                background: `linear-gradient(to right, ${accent}dd, ${accent}bb)`,
                                color: "white",
                                boxShadow: `0 4px 16px ${accent}30`,
                              }
                            : {}
                        }
                      >
                        {isActive && (
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-4 bg-white/60 rounded-r-full"
                          />
                        )}
                        {l.icon && (
                          <l.icon
                            className={`h-4.5 w-4.5 shrink-0 transition-all duration-300 ${
                              isActive
                                ? "text-white scale-105"
                                : ""
                            }`}
                            style={
                              !isActive
                                ? { color: `${accent}80` }
                                : {}
                            }
                          />
                        )}
                        <span className="truncate">{l.label}</span>
                      </Link>
                    );
                  })}

                  {section.groups?.map((g) => {
                    const isGroupActive = g.items?.some(
                      (item) => pathname === item.href
                    );
                    const isExpanded = openGroup === g.key;


                    return (
                      <div key={g.key} className="mb-1">
                        <button
                          onClick={() => toggleGroup(g.key)}
                          className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] font-medium transition-all duration-300`}
                          style={
                            isGroupActive
                              ? {
                                  backgroundColor: `${accent}12`,
                                  color: accent,
                                  borderColor: `${accent}25`,
                                  borderWidth: 1,
                                }
                              : {
                                  color: isDark
                                    ? "#a1a1aa"
                                    : "#52525b",
                                }
                          }
                        >
                          {isGroupActive && (
                            <div
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-4 rounded-r-full"
                              style={{ backgroundColor: accent }}
                            />
                          )}
                          {g.icon && (
                            <g.icon
                              className={`h-4.5 w-4.5 shrink-0 transition-all duration-300`}
                              style={{
                                color: isGroupActive
                                  ? accent
                                  : `${accent}80`,
                              }}
                            />
                          )}
                          <span
                            className={`flex-1 text-left truncate ${
                              isGroupActive ? "font-semibold" : ""
                            }`}
                          >
                            {g.label}
                          </span>
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 transition-all duration-300 ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                            style={{
                              color: isGroupActive
                                ? accent
                                : isDark
                                ? "#71717a"
                                : "#a1a1aa",
                            }}
                          />
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                            isExpanded
                              ? "max-h-125 opacity-100"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <div
                            className={`ml-3.5 space-y-0.5 border-l pl-3 mt-1 mb-1`}
                            style={{
                              borderColor: isDark
                                ? `${accent}20`
                                : `${accent}15`,
                            }}
                          >
                            {g.items.map((i) => {
                              const isSubActive =
                                pathname === i.href;
                              return (
                                <Link
                                  key={i.href}
                                  href={i.href}
                                  className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11.5px] transition-all duration-300`}
                                  style={
                                    isSubActive
                                      ? {
                                          backgroundColor: `${accent}15`,
                                          color: accent,
                                          fontWeight: 500,
                                        }
                                      : {
                                          color: isDark
                                            ? "#71717a"
                                            : "#71717a",
                                        }
                                  }
                                >
                                  {i.icon && (
                                    <i.icon
                                      className="h-3.5 w-3.5 transition-colors duration-300"
                                      style={{
                                        color: isSubActive
                                          ? accent
                                          : isDark
                                          ? "#52525b"
                                          : "#a1a1aa",
                                      }}
                                    />
                                  )}
                                  <span className="truncate">
                                    {i.label}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </>
          )}
        </nav>
        <div
          className={`border-t px-2 py-3 ${
            isDark ? "border-white/5" : "border-zinc-200"
          }`}
        >
          {settings.sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">

              {/* PRIMARY */}
              <div className="relative group">
                <Link
                  href="https://reservations.indian-nepaliswad.fr/"
                  title="Mes Réservations"
                  className={`
                    relative flex h-10 w-10 items-center justify-center rounded-xl
                    transition-all duration-200
                    focus:outline-none
                    ${isDark
                      ? "bg-white text-black"
                      : "bg-zinc-900 text-white"
                    }
                  `}
                >
                  <BookOpen className="h-4 w-4" />

                  {/* accent dot */}
                  <span
                    className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                </Link>

                {/* tooltip */}
                <div
                  className={`
                    pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2
                    rounded-md px-2 py-1 text-xs opacity-0 transition-all duration-150
                    group-hover:opacity-100 group-hover:translate-x-0 translate-x-1 text-nowrap
                    ${isDark
                      ? "bg-white text-black"
                      : "bg-zinc-900 text-white"
                    }
                  `}
                >
                  Mes Réservations
                </div>
              </div>

              {/* SECONDARY */}
              <div className="relative group">
                <button
                  onClick={() => openPanel("appearance")}
                  title="Personnalisation"
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-xl
                    transition-all duration-200
                    focus:outline-none
                    ${isDark
                      ? "text-zinc-400 hover:bg-white/5"
                      : "text-zinc-500 hover:bg-zinc-100"
                    }
                  `}
                >
                  <Sparkles className="h-4 w-4" />
                </button>

                {/* tooltip */}
                <div
                  className={`
                    pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2
                    rounded-md px-2 py-1 text-xs opacity-0 transition-all duration-150
                    group-hover:opacity-100 group-hover:translate-x-0 translate-x-1
                    ${isDark
                      ? "bg-white text-black"
                      : "bg-zinc-900 text-white"
                    }
                  `}
                >
                  Personnalisation
                </div>
              </div>

            </div>
          ) : (
            <div
              className={`
                flex flex-col gap-2 rounded-2xl p-2
                ${isDark ? "bg-white/5" : "bg-zinc-100/70"}
              `}
            >
              <Link
                href="https://reservations.indian-nepaliswad.fr"
                className={`
                  group relative flex items-center gap-4 rounded-xl px-3 py-2
                  text-sm font-semibold transition-all duration-200
                  focus:outline-none
                  ${isDark
                    ? "bg-white text-black"
                    : "bg-zinc-900 text-white"
                  }
                `}
              >
                {/* accent bar (thicker + smoother) */}
                <span
                  className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: accent }}
                />

                {/* icon container */}
                <div
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-lg
                    ${isDark ? "bg-black/10" : "bg-white/10"}
                  `}
                >
                  <BookOpen className="h-4 w-4" />
                </div>

                {/* text */}
                <div className="flex flex-col items-start">
                  <span>Mes Réservations</span>
                </div>
              </Link>
              <button
                onClick={() => openPanel("appearance")}
                className={`
                  group relative flex items-center gap-4 rounded-xl px-3 py-2
                  text-sm transition-all duration-200
                  focus:outline-none
                  ${isDark
                    ? "text-zinc-300 hover:bg-white/5"
                    : "text-zinc-700 hover:bg-white"
                  }
                `}
              >
                {/* subtle accent hover layer */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition"
                  style={{ backgroundColor: `${accent}10` }}
                />

                {/* icon container */}
                <div
                  className={`
                    relative z-10 flex h-8 w-8 items-center justify-center rounded-lg
                    ${isDark ? "bg-white/5" : "bg-zinc-200"}
                  `}
                >
                  <Sparkles className="h-4 w-4 opacity-80" />
                </div>

                {/* text */}
                <div className="relative z-10 flex flex-col items-start">
                  <span className="font-medium">Personnalisation</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </aside>
      {!isDesktop && (
        <div
          className={`
            fixed inset-x-0 top-0 z-30 flex items-center justify-between
            h-14 px-3 sm:px-4 backdrop-blur-2xl transition-all duration-300 md:hidden
            ${
              isDark
                ? scrolled
                  ? "bg-[#0a0a0f]/60 border-b border-white/10 shadow-lg shadow-black/20"
                  : "bg-transparent border-b border-transparent"
                : scrolled
                ? "bg-white/70 border-b border-zinc-200 shadow-lg shadow-black/5"
                : "bg-white border-b border-transparent"
            }
          `}
        >
          {/* Left: Menu */}
          <button
            onClick={() => {
              setSetting("sidebarCollapsed", false);
              setMobileOpen(true);
            }}
            className={`
              flex items-center justify-center rounded-xl
              transition-all duration-200 h-9 w-9 sm:h-10 sm:w-10
              ${
                isDark
                  ? "text-white bg-black/60 hover:bg-black border border-white/10"
                  : "text-zinc-900 bg-white/70 hover:bg-white border border-zinc-200"
              }
            `}
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Title */}
          <div
            className={`
              flex-1 ml-3 truncate text-[11px] xs:text-xs sm:text-sm font-medium
              ${isDark ? "text-white/80" : "text-zinc-800"}
            `}
          >
            {pageTitle}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <AuthButtons isDark={isDark} accent={accent} />

            <button
              onClick={() => openPanel("appearance")}
              className={`
                flex items-center justify-center rounded-xl
                transition-all duration-200 h-9 w-9 sm:h-10 sm:w-10
                ${
                  isDark
                    ? "text-white bg-black/60 hover:bg-black border border-white/10"
                    : "text-zinc-900 bg-white/70 hover:bg-white border border-zinc-200"
                }
              `}
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      )}
      {isDesktop && (
        <div
          className="
            fixed top-8 right-4 z-40 hidden md:block
            animate-in slide-in-from-top-2 duration-700 delay-300
          "
        >
          <AuthButtons isDark={isDark} accent={accent} />
        </div>
      )}



      <main
        className={`
          min-h-screen transition-all duration-500 ease-out animate-in fade-in-0 slide-in-from-bottom-4
          ${settings.sidebarCollapsed
            ? "md:ml-17"
            : "md:ml-66"
          }
        `}
      >
        <CookieConsent
          accent={accent}
          isDark={isDark}
          onAccentChange={(hex) => setSetting("accent", hex)}
          onVisibilityChange={setConsentOpen}
          push={push}
        />
        {children}
        <FooterDef isDark={isDark} />
      </main>

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="flex-1 bg-black/20 backdrop-blur-[2px]"
            onClick={closePanel}
          />

          <div
            className={`relative flex w-full flex-col shadow-2xl backdrop-blur-3xl sm:w-100 lg:w-105 max-w-[100vw]`}
            style={{
              backgroundColor: isDark
                ? "rgba(8,8,12,0.98)"
                : "rgba(254,254,254,0.98)",
              borderLeft: `1px solid ${
                isDark ? "rgba(255,255,255,0.04)" : "#e4e4e7"
              }`,
            }}
          >
            <div
              className="h-px w-full"
              style={{
                background: `linear-gradient(to right, transparent, ${accent}40, transparent)`,
              }}
            />

            <div
              className={`border-b px-3 pt-2 pb-0`}
              style={{
                borderColor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "#e4e4e7",
              }}
            >
              <TabCarousel
                activeTab={activeTab}
                onTabChange={switchTab}
                isDark={isDark}
                onClose={closePanel}
                accent={accent}
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-5">
                {activeTab === "appearance" && (
                  <AppearancePanel
                    isDark={isDark}
                    theme={theme}
                    setTheme={setTheme}
                    settings={settings}
                    setSettings={setSetting}
                    push={push}
                  />
                )}
              </div>
            </div>

            <div
              className={`border-t px-5 py-3 flex items-center justify-between ${
                isDark ? "border-white/4" : "border-zinc-200"
              }`}
            >
              <Link
                href="https://www.indian-nepaliswad.fr"
                className={`flex items-center gap-1.5 text-[10px] font-medium transition-all duration-200 ${
                  isDark
                    ? "text-white/40 hover:text-white/60"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <Copyright className="h-3 w-3" />
                2017-{year} indian-nepaliswad.fr
              </Link>
              <span
                className={`text-[9px] ${
                  isDark ? "text-white/25" : "text-zinc-300"
                }`}
              >
                <Link href="https://docs.corsprite.com/">Alpha search, AI can make mistakes!</Link>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}