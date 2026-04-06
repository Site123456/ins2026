"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  type PanInfo,
  type Variants,
} from "framer-motion";
import type { Map as LeafletMap } from "leaflet";
import StableMap from "@/components/StableMap";
import ReserverSites from "./reserver/page"

import {
  ChevronDown,
  MapPin,
  Search
} from "lucide-react";
import Image from "next/image";

import { useTheme } from "@/components/hooks/useTheme";
import { useAccentFromCookies } from "@/components/hooks/useAccentFromCookies";
type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const horaires: Record<DayIndex, [string, string]> = {
  1: ["11:15-14:45", "18:15-22:45"],
  2: ["11:15-14:45", "18:15-22:45"],
  3: ["11:15-14:45", "18:15-22:45"],
  4: ["11:15-14:45", "18:15-22:45"],
  5: ["11:15-14:45", "18:15-22:45"],
  6: ["11:15-14:45", "18:15-22:45"],
  0: ["11:15-14:45", "18:15-22:45"],
};

type ZoneId =
  | "paris"
  | "aubervilliers"
  | "courbevoie"
  | "saintouen"
  | "bagneux"
  | "ivry"
  | "bordeaux";

type Zone = {
  id: ZoneId;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  deliverooLabel: string;
  address: string;
  eta: string;
  distance: string;
  deliverooUrl: string;
};
const zones: Zone[] = [
  {
    id: "paris",
    name: "Paris 15eme",
    lat: 48.84063,
    lng: 2.30602,
    radiusKm: 15,
    deliverooLabel: "Indian Nepali Swad - Paris 15",
    address: "4 Rue Bargue, 75015 Paris",
    eta: "Livré ~ 5-15 min",
    distance: "Jusqu'à 15 km",
    deliverooUrl: "https://deliveroo.fr/fr/menu/paris/Pasteur/bidit-risheb/",
  },
  {
    id: "aubervilliers",
    name: "Aubervilliers",
    lat: 48.9151567,
    lng: 2.3668222,
    radiusKm: 15,
    deliverooLabel: "Indian Nepali Swad - Aubervilliers",
    address: "79 Rue du Landy, 93300 Aubervilliers",
    eta: "Livré ~ 5-15 min",
    distance: "Jusqu'à 15 km",
    deliverooUrl: "#",
  },
  {
    id: "courbevoie",
    name: "Courbevoie",
    lat: 48.90518,
    lng: 2.25269,
    radiusKm: 10,
    deliverooLabel: "INS Courbevoie",
    address: "Ouest parisien · La Défense",
    eta: "Livré ~ 10-20 min",
    distance: "Jusqu'à 10 km",
    deliverooUrl: "https://deliveroo.fr/fr/menu/paris/editions-courbevoie/indian-nepali-swad-editions-courbevoie/",
  },
  {
    id: "saintouen",
    name: "Saint‑Ouen",
    lat: 48.90469,
    lng: 2.32766,
    radiusKm: 10,
    deliverooLabel: "INS Saint‑Ouen",
    address: "Nord parisien · Aubervilliers",
    eta: "Livré ~ 10-20 min",
    distance: "Jusqu'à 10 km",
    deliverooUrl: "https://deliveroo.fr/fr/menu/paris/editions-saint-ouen/indian-nepali-swad-editions-aubervilliers/",
  },
  {
    id: "bagneux",
    name: "Bagneux",
    lat: 48.80033,
    lng: 2.30524,
    radiusKm: 10,
    deliverooLabel: "INS Bagneux",
    address: "Éditions Bagneux",
    eta: "Livré ~ 5-15 min",
    distance: "Jusqu'à 10 km",
    deliverooUrl: "https://deliveroo.fr/fr/menu/paris/editions-site-bagneux/indian-nepali-swad-editions-bagneux/",
  },
  {
    id: "ivry",
    name: "Ivry",
    lat: 48.8181,
    lng: 2.40196,
    radiusKm: 10,
    deliverooLabel: "INS Ivry",
    address: "Éditions Ivry",
    eta: "Livré ~ 5-15 min",
    distance: "Jusqu'à 10 km",
    deliverooUrl: "https://deliveroo.fr/fr/menu/paris/editions-ivry/indian-nepali-swad-editions-ivry/",
  },
  {
    id: "bordeaux",
    name: "Bordeaux",
    lat: 44.86313,
    lng: -0.57288,
    radiusKm: 20,
    deliverooLabel: "INS Bordeaux",
    address: "Éditions Cour du Médoc",
    eta: "Livré ~ 5-15 min",
    distance: "Jusqu'à 20 km",
    deliverooUrl: "https://deliveroo.fr/fr/menu/bordeaux/bordeaux-editions-cour-du-medoc/indian-nepali-swad-editions-bordeaux/",
  },
];

type ZoneStatus = "OPEN" | "CLOSED";

type ZoneWithStatus = Zone & {
  status: ZoneStatus;
  openingLabel: string;
};

// ---------- Utils ----------
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  return h * 60 + m;
}

function isOpenNow(date: Date): { open: boolean; label: string } {
  const day = date.getDay() as DayIndex;
  const ranges = horaires[day];
  const nowMinutes = date.getHours() * 60 + date.getMinutes();

  const windows = ranges
    .map((r) => {
      const [start, end] = r.split("-");
      return {
        start: parseTimeToMinutes(start),
        end: parseTimeToMinutes(end),
      };
    })
    .filter((w) => !Number.isNaN(w.start) && !Number.isNaN(w.end));

  const open = windows.some(
    (w) => nowMinutes >= w.start && nowMinutes <= w.end
  );

  const label = open
    ? "Ouvert maintenant"
    : `Ouvre aujourd’hui ${ranges[0].split("-")[0]}`;

  return { open, label };
}

function buildZoneStatus(now: Date): ZoneWithStatus[] {
  const { open, label } = isOpenNow(now);
  return zones.map((z) => ({
    ...z,
    status: open ? "OPEN" : "CLOSED",
    openingLabel: label,
  }));
}

function useViewportHeight(): number {
  const [vh, setVh] = useState<number>(800);
  useEffect(() => {
    const update = () => setVh(window.innerHeight || 800);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return vh;
}

function useIsSmallScreen(): boolean {
  const [small, setSmall] = useState<boolean>(false);
  useEffect(() => {
    const update = () => setSmall(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return small;
}
// ---------- Animations ----------
const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

const panelFade: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.5, 
      ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for premium feel
      staggerChildren: 0.1
    } 
  },
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.3 } },
};

const itemFade: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};



const Page: React.FC = () => {
  const router = useRouter();
  const viewportHeight = useViewportHeight();
  const isSmallScreen = useIsSmallScreen();

  const { isDark, hydrated } = useTheme();
  const accent = useAccentFromCookies();

  // Accent CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const hex = accent;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    root.style.setProperty("--accent", hex);
    root.style.setProperty("--accent-dim", `rgba(${r},${g},${b},0.20)`);
    root.style.setProperty("--accent-strong", `rgba(${r},${g},${b},0.4)`);
    root.style.setProperty("--accent-text", `rgba(${r},${g},${b},0.9)`);
  }, [accent]);
  const [now, setNow] = useState<Date>(() => new Date());
  const [selectedZoneId, setSelectedZoneId] = useState<ZoneId>("paris");
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [userInteracted, setUserInteracted] = useState<boolean>(false);
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState<boolean>(false);
  const [introStarted, setIntroStarted] = useState<boolean>(false);

  // ---------- REFS ----------
  const mapRef = useRef<LeafletMap | null>(null);

  // ---------- EFFECTS ----------
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ---------- MEMOS ----------
  const zonesWithStatus = useMemo(() => buildZoneStatus(now), [now]);

  const selectedZone = useMemo(
    () =>
      zonesWithStatus.find((z) => z.id === selectedZoneId) ??
      zonesWithStatus[0],
    [zonesWithStatus, selectedZoneId]
  );

  const rotatingTexts = [
    "nos plats",
    "Indian Nepali Swad",
    "nos spécialités",
    "l'Inde & le Népal",
    "l'authenticité de nos saveurs",
    "nos recettes maison",
    "nos plats signatures",
    "nos traditions culinaires",
    "nos épices et arômes",
    "nos inspirations du chef",
    "nos spécialités indiennes",
    "nos spécialités népalaises",
    "la richesse de nos cuisines",
    "la finesse de nos épices",
    "la chaleur de nos plats",
    "la diversité de nos saveurs",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % rotatingTexts.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const markInteraction = useCallback(() => {
    setUserInteracted(true);
  }, []);
  const handlePanelSwipe = useCallback(
    (_: unknown, info: PanInfo) => {
      const threshold = 80;

      if (info.offset.x > threshold || info.offset.x < -threshold) {
        const list = zonesWithStatus;
        if (!list.length) return;

        const currentIndex = list.findIndex((z) => z.id === selectedZone.id);
        const nextIndex =
          info.offset.x < 0
            ? (currentIndex + 1) % list.length
            : (currentIndex - 1 + list.length) % list.length;

        const nextZone = list[nextIndex];

        markInteraction();
        setSelectedZoneId(nextZone.id);
      }
    },
    [zonesWithStatus, selectedZone.id, markInteraction]
  );
  const handleSelectZone = useCallback(
    (id: ZoneId) => {
      markInteraction();
      setSelectedZoneId(id);
      setZoneDropdownOpen(false);

      const zone = zones.find((z) => z.id === id);
      if (!zone || !mapRef.current) return;

      const offsetLat = zone.radiusKm > 10 ? 0.32 : 0.18;

      mapRef.current.flyTo(
        [zone.lat - offsetLat, zone.lng],
        zone.radiusKm > 10 ? 8.6 : 9.4,
        {
          duration: 0.9,
          easeLinearity: 0.25,
        }
      );
    },
    [markInteraction]
  );
  useEffect(() => {
    if (userInteracted || zonesWithStatus.length === 0) return;
    let index = zonesWithStatus.findIndex((z) => z.id === selectedZone.id);
    if (index < 0) index = 0;

    const interval = setInterval(() => {
      // Next zone
      index = (index + 1) % zonesWithStatus.length;
      const nextId = zonesWithStatus[index].id;

      // Update UI
      setSelectedZoneId(nextId);

      // Animate map
      const zone = zones.find((z) => z.id === nextId);
      if (zone && mapRef.current) {
        const offsetLat = zone.radiusKm > 10 ? 0.32 : 0.18;

        mapRef.current.flyTo(
          [zone.lat - offsetLat, zone.lng],
          zone.radiusKm > 10 ? 8.6 : 9.4,
          {
            duration: 0.6,
            easeLinearity: 0.4,
          }
        );
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [zonesWithStatus, selectedZone.id, userInteracted]);


  const mapTileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const isOpen = selectedZone.status === "OPEN";
  
  const handleScroll = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!mapLoaded) return;
    const id = setTimeout(() => setIntroStarted(true), 900);
    return () => clearTimeout(id);
  }, [mapLoaded]);

  // ---------- HYDRATION CHECK ----------
  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-slate-700 border-t-(--accent) animate-spin" />
          <p className="text-sm text-slate-400">
            Préparation de la carte Indian Nepali Swad…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <motion.div
        className={`relative min-h-screen w-full overflow-hidden ${
          isDark ? "bg-black text-slate-50" : "bg-white text-slate-900"
        }`}
        variants={pageFade}
        initial="initial"
        animate="animate"
      >
        <style jsx global>{`
          .leaflet-control-attribution,
          .leaflet-bottom.leaflet-right {
            display: none !important;
          }
        `}</style>

        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: isDark
              ? "radial-gradient(circle at top, rgba(0,0,0,0.9), transparent 60%), radial-gradient(circle at bottom, var(--accent-dim), transparent 55%)"
              : "radial-gradient(circle at top, rgba(255,255,255,0.9), transparent 60%), radial-gradient(circle at bottom, var(--accent-dim), transparent 55%)",
          }}
        />

        {/* MAP */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence>
            {!mapLoaded && (
              <motion.div
                className={`absolute inset-0 flex items-center justify-center ${
                  isDark ? "bg-black" : "bg-slate-100"
                }`}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 rounded-full border-2 border-slate-500/40 border-t-(--accent) animate-spin" />
                  <p
                    className={`text-sm ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Chargement de la carte INS…
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: mapLoaded ? 1 : 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <StableMap
              mapTileUrl={mapTileUrl}
              mapRef={mapRef}
              zonesWithStatus={zonesWithStatus}
              selectedZone={selectedZone}
              accent={accent}
              isDark={isDark}
              onMapReady={() => setMapLoaded(true)}
            />


          </motion.div>
        </div>
        <AnimatePresence>
          {introStarted && (
            <motion.button
              onClick={() => router.push("/search")}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={`
                group pointer-events-auto absolute z-3 flex items-center gap-3
                rounded-2xl shadow-lg backdrop-blur-xl border-3
                px-4 py-1.5 text-[11px] font-medium
                active:scale-[0.97] transition-all
                left-4 top-18 md:top-6 md:px-5 md:py-3 md:gap-4 md:text-sm
                w-60 md:w-96
                ${isDark
                  ? "bg-[#050505]/90 border-white/10 text-white"
                  : "bg-white/95 border-black/10 text-black"}
              `}
            >
              <div
                className={`
                  h-8 w-8 flex items-center justify-center rounded-xl transition-all shrink-0
                  ${isDark ? "bg-white/10" : "bg-black/10"}
                `}
              >
                <Search size={14} />
              </div>
              <div className="flex items-center gap-1 w-full overflow-hidden">
                <span className="shrink-0 leading-none">Découvrir</span>

                {/* Animated text with ellipsis */}
                <div className="relative flex-1 overflow-hidden h-5 flex items-center">
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className={`
                      absolute left-0 top-1/2 -translate-y-1/2
                      whitespace-nowrap font-semibold text-(--accent)
                      overflow-hidden text-ellipsis block max-w-full leading-none
                    `}
                  >
                    {rotatingTexts[index]}...
                  </motion.span>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 0.25, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`
                  absolute inset-0 rounded-2xl pointer-events-none
                  ${isDark ? "bg-white/5" : "bg-black/5"}
                `}
              />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {introStarted && (
            <motion.div
              className="
                pointer-events-none absolute z-2
                right-4 top-18
                md:top-6
              "
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={`
                  pointer-events-auto px-3 py-2 text-[11px] rounded-2xl border-3 shadow-lg backdrop-blur-xl
                  ${isDark ? "bg-[#050505]/90 border-white/10 text-white" : "bg-white/95 border-black/10 text-black"}
                `}
              >
                <div className="flex items-center flex-col md:flex-row gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span>Site ouverte</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span>Site fermée</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {introStarted && (
            <motion.section
              variants={panelFade}
              initial="initial"
              animate="animate"
              exit="exit"
              drag="x"
              dragElastic={0.12}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handlePanelSwipe}
              className={`
                pointer-events-auto absolute z-1 rounded-3xl shadow-xl
                ${isDark
                  ? "bg-[#050505]/92 backdrop-blur-2xl border border-white/10"
                  : "bg-white/95 backdrop-blur-2xl border border-black/10"}
              `}
              style={{
                bottom: 48,
                ...(isSmallScreen && {
                  left: "5%",
                  transform: "translateX(-50%)",
                  width: "90%",
                }),
                ...(!isSmallScreen && {
                  right: 24,
                  width: "min(500px, 92vw)",
                }),
                maxHeight: isSmallScreen ? viewportHeight * 0.6 : viewportHeight * 0.5,
              }}
            >
              <div className="flex flex-col gap-4 p-3">

                {/* HEADER */}
                <motion.div variants={itemFade} className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold tracking-tight">
                      INDIAN NEPALI SWAD
                    </h2>
                    <p className="text-[11px] opacity-60">
                      Gastronomie indienne & népalaise
                    </p>
                  </div>

                  <div
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium
                      border backdrop-blur-md
                      ${isOpen
                        ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                        : "text-rose-400 border-rose-400/30 bg-rose-400/10"}
                    `}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isOpen ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    {isOpen ? "Ouvert" : "Fermé"}
                  </div>
                </motion.div>
                <motion.div variants={itemFade} className="relative">
                  <button
                    type="button"
                    onClick={() => setZoneDropdownOpen((o) => !o)}
                    className={`
                      flex w-full items-center justify-between px-2.5 py-1.5
                      rounded-2xl border-3 text-sm font-medium transition-all
                      ${isDark
                        ? "border-(--accent)/10 bg-(--accent)/10 hover:bg-white/5"
                        : "border-(--accent)/10 bg-(--accent)/10 hover:bg-black/5"}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 flex items-center justify-center rounded-full bg-(--accent)/18 text-(--accent)">
                        <MapPin className="h-4 w-4" />
                      </div>

                      <div className="leading-tight text-start">
                        <div className="text-sm font-semibold">
                          {selectedZone.deliverooLabel}
                        </div>
                        <div className="text-[11px] opacity-70">
                          {selectedZone.address}
                        </div>
                      </div>
                    </div>

                    <motion.span
                      animate={{ rotate: zoneDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.18 }}
                      className={`
                        h-7 w-7 flex items-center justify-center rounded-full
                        transition-colors
                        ${isDark ? "bg-white/10 hover:bg-(--accent)/15" : "bg-black/10 hover:bg-(--accent)/15"}
                      `}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {zoneDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className={`
                          absolute bottom-full left-0 right-0 mb-2 rounded-2xl border shadow-xl
                          max-h-64 overflow-y-auto z-20 text-sm
                          ${isDark
                            ? "bg-[#050505]/95 border-white/10"
                            : "bg-white border-black/10"}
                        `}
                      >
                        {zonesWithStatus.map((z) => {
                          const active = z.id === selectedZone.id;
                          return (
                            <button
                              key={z.id}
                              type="button"
                              onClick={() => handleSelectZone(z.id)}
                              className={`
                                w-full flex items-center justify-between px-3 py-3 text-left
                                transition-colors
                                ${active
                                  ? "bg-(--accent)/18 border-l-4 border-(--accent)"
                                  : isDark
                                  ? "hover:bg-(--accent)/10"
                                  : "hover:bg-(--accent)/10"}
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <span className="h-2.5 w-2.5 rounded-full bg-(--accent)" />
                                <span className="text-sm font-medium">{z.name}</span>
                              </div>
                              <span className="text-[11px] opacity-60">
                                {z.eta} · {z.distance}
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.p variants={itemFade} className="text-[10px] opacity-70 leading-relaxed">
                  Des plats inspirée des traditions indiennes et népalaises, préparée avec des ingrédients frais et un savoir‑faire artisanal.  
                  Retrouvez nos plats en livraison sur toutes nos sites via Deliveroo, ou à l&apos;emporter et sur place <Link href="https://www.google.com/maps/dir//4+Rue+Bargue,+75015+Paris" className="underline">(4 rue Bargue, 75015 Paris)</Link> ou <Link href="https://www.google.com/maps/dir//79+Rue+du+Landy,+93300+Aubervilliers" className="underline">(79 Rue du Landy, 93300 Aubervilliers)</Link>.
                </motion.p>

                {/* CTA ROW */}
                <motion.div variants={itemFade} className="flex flex-col sm:flex-row gap-2 w-full">

                  {/* Deliveroo CTA */}
                  <Link
                    href={selectedZone.deliverooUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      flex-1 flex items-center justify-center gap-2
                      rounded-2xl px-3 py-1.5 font-semibold text-sm
                      text-white shadow-lg transition-all
                      bg-(--accent-text) hover:bg-red-600
                      active:scale-[0.98]
                    `}
                  >
                    <Image
                      src="/deliveroo.png"
                      width={64}
                      height={64}
                      className="w-4 h-4 invert brightness-0"
                      alt="deliveroo logo"
                    />

                    <Image
                      src="/etc/android-chrome-512x512.png"
                      width={64}
                      height={64}
                      className="w-7 h-7 invert brightness-0"
                      alt="Ins logo"
                    />
                    {`- ${selectedZone.name}`}
                  </Link>

                  <Link
                    href="tel:0145327373"
                    className={`
                      flex-1 flex items-center justify-center gap-2
                      rounded-2xl px-4 py-2.5 font-semibold text-sm
                      transition-all border
                      ${isDark
                        ? "border-(--accent)/30 text-white hover:bg-(--accent)/10"
                        : "border-(--accent)/40 text-black hover:bg-(--accent)/10"}
                      active:scale-[0.98]
                    `}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-3.478-.87a1.125 1.125 0 00-1.173.417l-.97 1.293c-.322.43-.902.606-1.41.42a12.035 12.035 0 01-7.143-7.143c-.186-.508-.01-1.088.42-1.41l1.293-.97c.39-.293.56-.79.417-1.173l-.87-3.478A1.125 1.125 0 006.372 3H5.25A2.25 2.25 0 003 5.25v1.5z"
                      />
                    </svg>
                    +33 1 45 32 73 73
                  </Link>
                </motion.div>

              </div>
            </motion.section>
          )}
        </AnimatePresence>
        <div
          onClick={handleScroll}
          className="absolute z-6 bottom-3 left-1/2 -translate-x-1/2 md:left-5 md:translate-x-50 cursor-pointer select-none"
        >
          <div
            className={`
              group relative flex items-center
              gap-2 px-3 py-2 md:px-4 md:py-2.5
              rounded-full backdrop-blur-xl
              shadow-md transition-all duration-300

              ${isDark ? "bg-black/50" : "bg-white/80"}

              hover:scale-105 active:scale-95
            `}
          >
            <span className="absolute inset-0 rounded-full border border-(--accent)/40" />
            <span className="absolute inset-0 rounded-full border border-(--accent) opacity-30 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />

            <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-(--accent)" />

            <span className="text-xs md:text-sm font-medium text-(--accent) whitespace-nowrap">
              Reservation de table
            </span>
          </div>
        </div>
      </motion.div>
      <div className="relative flex flex-col items-center justify-center text-center pt-16">
        <div
          className="absolute inset-0 -z-10 flex items-center justify-center"
          style={{
            background:
              "radial-gradient(circle at center, var(--accent-soft), transparent 60%)",
            opacity: 0.8,
          }}
        />
        <h1
          className="
            text-2xl md:text-3xl lg:text-4xl
            font-semibold tracking-tight
            px-4
          "
          style={{
            color: "var(--accent)",
          }}
        >
          Réservation
        </h1>
        <p
          className={`mt-2 text-xs md:text-sm opacity-70 max-w-md px-4 ${isDark? "text-white":"text-black"}`}
        >
          Choisissez l’établissement qui vous convient le mieux.
        </p>
        <div
          className="mt-4 w-40 h-[2px] rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
          }}
        />

      </div>
      <ReserverSites />
    </main>
  );
};

export default Page;
