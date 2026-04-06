"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/components/hooks/useTheme";
import { useAccentFromCookies } from "@/components/hooks/useAccentFromCookies";
import {
  Search,
  X,
  Grid,
  List,
  Star,
  ShoppingCart,
} from "lucide-react";

/* ---------------- Types ---------------- */
type ZoneId =
  | "paris"
  | "aubervilliers"
  | "courbevoie"
  | "saintouen"
  | "bagneux"
  | "ivry"
  | "bordeaux";

type Zone = { id: ZoneId; name: string };

type MenuItem = {
  id: number;
  name: string;
  description: string;
  category: "Starter" | "Main" | "Dessert" | "Drinks";
  image: string;
  prices: number[];
  popularity?: number;
};

/* ---------------- Data ---------------- */
const zones: Zone[] = [
  { id: "paris", name: "Paris 15" },
  { id: "aubervilliers", name: "Aubervilliers" },
  { id: "courbevoie", name: "Courbevoie" },
  { id: "saintouen", name: "Saint-Ouen" },
  { id: "bagneux", name: "Bagneux" },
  { id: "ivry", name: "Ivry" },
  { id: "bordeaux", name: "Bordeaux" },
];

const zoneIndex: Record<ZoneId, number> = {
  paris: 0,
  aubervilliers: 1,
  courbevoie: 2,
  saintouen: 3,
  bagneux: 4,
  ivry: 5,
  bordeaux: 6,
};

const SAMPLE_MENU: MenuItem[] = [
  {
    id: 1,
    name: "Butter Chicken",
    description: "Creamy tomato curry with fenugreek and warm spices.",
    category: "Main",
    image:
      "https://images.unsplash.com/photo-1604908177522-8b3b9f3f6b2a?q=80&w=1400&auto=format&fit=crop",
    prices: [14, 14, 0, 15, 14, 0, 16],
    popularity: 94,
  },
  {
    id: 2,
    name: "Hyderabadi Biryani",
    description: "Saffron basmati layered with slow-cooked lamb.",
    category: "Main",
    image:
      "https://images.unsplash.com/photo-1604908177523-9c3b9f3f6b2b?q=80&w=1400&auto=format&fit=crop",
    prices: [18, 18, 18, 0, 18, 18, 0],
    popularity: 90,
  },
  {
    id: 3,
    name: "Garlic Naan",
    description: "Wood-fired naan brushed with garlic butter.",
    category: "Starter",
    image:
      "https://images.unsplash.com/photo-1604908177524-0d3b9f3f6b2c?q=80&w=1400&auto=format&fit=crop",
    prices: [3, 3, 3, 3, 3, 3, 3],
    popularity: 78,
  },
];

/* ---------------- Helpers ---------------- */
const formatPrice = (n: number) => `€${n.toFixed(2)}`;

/* ---------------- Main Page ---------------- */
export default function Page() {
  const { isDark } = useTheme();
  const accent = useAccentFromCookies();

  /* Accent system */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", accent || "#ff9d2e");
  }, [accent]);

  /* State */
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [zonesSelected, setZonesSelected] = useState<ZoneId[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");

  const activeZoneIndices = useMemo(() => {
    if (zonesSelected.length === 0) return zones.map((_, i) => i);
    return zonesSelected.map((z) => zoneIndex[z]);
  }, [zonesSelected]);

  /* Filtering */
  const results = useMemo(() => {
    const q = query.toLowerCase();

    return SAMPLE_MENU.filter((item) => {
      if (category !== "All" && item.category !== category) return false;

      if (q) {
        const match =
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q);
        if (!match) return false;
      }

      const available = activeZoneIndices.some(
        (i) => item.prices[i] && item.prices[i] > 0
      );
      if (!available && zonesSelected.length > 0) return false;

      return true;
    });
  }, [query, category, zonesSelected, activeZoneIndices]);

  /* Price label */
  function priceLabel(item: MenuItem) {
    const prices = activeZoneIndices.map((i) => item.prices[i]);
    const available = prices.filter((p) => p > 0);

    if (available.length === 0) return "Not available";
    if (available.length === 1) return formatPrice(available[0]);

    return `${formatPrice(Math.min(...available))} – ${formatPrice(
      Math.max(...available)
    )}`;
  }

  /* Toggle zone */
  function toggleZone(id: ZoneId) {
    setZonesSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <main
      className={`min-h-screen px-5 py-6 relative ${
        isDark ? "bg-[#0b0b0d] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Accent orb */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-40 -left-40 w-[60vmax] h-[60vmax] rounded-full blur-[120px]"
          style={{ background: "var(--accent)" }}
        />
      </div>

      {/* Header */}
      <header className="flex flex-col items-center gap-3 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--accent)] to-orange-300 bg-clip-text text-transparent">
          INDIAN NEPALI SWAD
        </h1>
        <p className="text-sm opacity-70">Premium Indian & Nepali Cuisine</p>

        {/* Search */}
        <div
          className={`flex items-center gap-3 w-full max-w-xl px-4 py-3 rounded-xl border backdrop-blur-md ${
            isDark
              ? "bg-white/5 border-white/10"
              : "bg-white border-gray-200 shadow-sm"
          }`}
        >
          <Search size={18} className="opacity-60" />
          <input
            className="flex-1 bg-transparent outline-none"
            placeholder="Search dishes, spices, ingredients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X size={16} className="opacity-60" />
            </button>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-6 mb-8">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["All", "Starter", "Main", "Dessert", "Drinks"].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                category === c
                  ? "bg-[var(--accent)] text-black"
                  : isDark
                  ? "bg-white/5 text-white/70"
                  : "bg-white text-gray-700 border border-gray-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Locations */}
        <div className="flex flex-col gap-2">
          <button
            className={`px-4 py-2 rounded-full text-sm font-semibold w-fit ${
              zonesSelected.length === 0
                ? "bg-[var(--accent)] text-black"
                : isDark
                ? "bg-white/5 text-white/70"
                : "bg-white border border-gray-200"
            }`}
            onClick={() => setZonesSelected([])}
          >
            All restaurants
          </button>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {zones.map((z) => (
              <button
                key={z.id}
                onClick={() => toggleZone(z.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  zonesSelected.includes(z.id)
                    ? "bg-[var(--accent)] text-black"
                    : isDark
                    ? "bg-white/5 text-white/70"
                    : "bg-white border border-gray-200"
                }`}
              >
                {z.name}
              </button>
            ))}
          </div>
        </div>

        {/* View toggle */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-lg ${
              view === "grid"
                ? "bg-[var(--accent)] text-black"
                : isDark
                ? "bg-white/5"
                : "bg-white border border-gray-200"
            }`}
          >
            <Grid size={18} />
          </button>

          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-lg ${
              view === "list"
                ? "bg-[var(--accent)] text-black"
                : isDark
                ? "bg-white/5"
                : "bg-white border border-gray-200"
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <p className="text-center opacity-60 mt-20">No dishes found</p>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((item) => (
            <article
              key={item.id}
              className={`rounded-xl overflow-hidden border backdrop-blur-md transition hover:-translate-y-1 ${
                isDark
                  ? "bg-white/5 border-white/10"
                  : "bg-white border-gray-200 shadow-sm"
              }`}
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-40 w-full object-cover"
              />

              <div className="p-4 flex flex-col gap-2">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-sm opacity-70">{item.description}</p>

                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold text-[var(--accent)]">
                    {priceLabel(item)}
                  </span>

                  <span className="flex items-center gap-1 text-sm opacity-70">
                    <Star size={14} /> {item.popularity}
                  </span>
                </div>

                <button className="mt-3 w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-black font-semibold py-2 rounded-lg">
                  <ShoppingCart size={16} /> Add
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {results.map((item) => (
            <article
              key={item.id}
              className={`flex gap-4 p-4 rounded-xl border backdrop-blur-md ${
                isDark
                  ? "bg-white/5 border-white/10"
                  : "bg-white border-gray-200 shadow-sm"
              }`}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-28 h-28 object-cover rounded-lg"
              />

              <div className="flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <p className="text-sm opacity-70">{item.description}</p>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[var(--accent)]">
                    {priceLabel(item)}
                  </span>

                  <button className="flex items-center gap-2 bg-[var(--accent)] text-black font-semibold px-4 py-2 rounded-lg">
                    <ShoppingCart size={16} /> Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
