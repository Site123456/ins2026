"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "@/components/hooks/useTheme";
import { useAccentFromCookies } from "@/components/hooks/useAccentFromCookies";
import { MapPin, ArrowRight } from "lucide-react";

/* ---------------- PAGE ---------------- */

export default function ReservationPage() {
  const { isDark, hydrated } = useTheme();
  const accent = useAccentFromCookies();

  useEffect(() => {
    if (!accent) return;

    const root = document.documentElement;
    const r = parseInt(accent.slice(1, 3), 16);
    const g = parseInt(accent.slice(3, 5), 16);
    const b = parseInt(accent.slice(5, 7), 16);

    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-soft", `rgba(${r},${g},${b},0.18)`);
    root.style.setProperty("--accent-glow", `rgba(${r},${g},${b},0.35)`);
  }, [accent]);

  if (!hydrated) return null;

  return (
    <main
      className={`
        relative w-full h-[80vh] overflow-hidden
        ${isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"}
      `}
    >
      <Ambient />
      <Noise />
      <section className="flex flex-col md:flex-row h-full">
        <SideCard
          title="Paris 15"
          desc="Élégant & central"
          address="4 rue Bargue"
          linkmap="https://www.google.com/maps/dir//4+Rue+Bargue,+75015+Paris"
          href="https://reservations.indian-nepaliswad.fr/paris15"
          img="/etc/Photo acceuil 1.jpg"
        />
        <SideCard
          title="Aubervilliers"
          desc="Convivial & authentique"
          address="79 Rue du Landy"
          linkmap="https://www.google.com/maps/dir//79+Rue+du+Landy,+93300+Aubervilliers"
          href="https://reservations.indian-nepaliswad.fr/aubervilliers"
          img="/etc/Photo acceuil 2.jpg"
        />
      </section>
    </main>
  );
}

/* ---------------- AMBIENT ---------------- */

function Ambient() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute w-[500px] h-[500px] -top-40 -left-40 blur-[160px] rounded-full"
        style={{ background: "var(--accent-glow)" }}
      />
      <div
        className="absolute w-[400px] h-[400px] bottom-[-160px] right-[-120px] blur-[140px] rounded-full"
        style={{ background: "var(--accent-soft)" }}
      />
    </div>
  );
}

/* ---------------- NOISE ---------------- */

function Noise() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.035] mix-blend-overlay"
      style={{
        backgroundImage:
          "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\"/></svg>')",
      }}
    />
  );
}

/* ---------------- SIDE CARD ---------------- */

function SideCard({
  title,
  desc,
  address,
  img,
  href,
  linkmap,
}: any) {
  const [isDarkImage, setIsDarkImage] = useState(true);
  const [objectPos, setObjectPos] = useState("center");
  const cardRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);

  /* ---- AI focal detection ---- */
  useEffect(() => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = img;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = 50;
      const h = 50;
      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(image, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      let brightness = 0;
      let totalWeight = 0;
      let avgX = 0;
      let avgY = 0;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          brightness += lum;

          const weight = lum;
          totalWeight += weight;

          avgX += x * weight;
          avgY += y * weight;
        }
      }

      brightness /= w * h;

      avgX /= totalWeight;
      avgY /= totalWeight;

      setObjectPos(`${(avgX / w) * 100}% ${(avgY / h) * 100}%`);
      setIsDarkImage(brightness < 140);
    };
  }, [img]);

  /* ---- cursor light ---- */
  const handleMove = (e: any) => {
    if (!lightRef.current) return;
    const rect = cardRef.current!.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lightRef.current.style.background = `
      radial-gradient(circle at ${x}px ${y}px, var(--accent-soft), transparent 60%)
    `;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      className="
        relative flex-1 overflow-hidden
        group transition-all duration-500
        md:hover:flex-[1.15]
      "
    >
      {/* IMAGE */}
      <img
        src={img}
        alt={title}
        className="
          absolute inset-0 w-full h-full object-cover
          scale-105 group-hover:scale-110
          transition duration-[1600ms]
        "
        style={{ objectPosition: objectPos }}
      />

      {/* LIGHT FOLLOW */}
      <div
        ref={lightRef}
        className="absolute inset-0 opacity-70 transition duration-200 pointer-events-none"
      />

      {/* OVERLAY */}
      <div
        className="absolute inset-0"
        style={{
          background: isDarkImage
            ? "linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4), transparent)"
            : "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.2), transparent)",
        }}
      />

      {/* CONTENT */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 md:p-10">
        <div className="max-w-sm space-y-2">
          <h2
            className="text-xl md:text-2xl font-semibold"
            style={{ color: isDarkImage ? "#fff" : "#111" }}
          >
            {title}
          </h2>

          <p
            className="text-sm"
            style={{
              color: isDarkImage
                ? "rgba(255,255,255,0.85)"
                : "rgba(0,0,0,0.75)",
            }}
          >
            {desc}
          </p>

          <button
            onClick={() => window.open(linkmap, "_blank")}
            className="
              mt-2 text-xs px-3 py-1.5 rounded-full
              backdrop-blur-xl border flex items-center gap-1.5
            "
            style={{
              borderColor: "var(--accent-soft)",
              background: isDarkImage
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.05)",
            }}
          >
            <MapPin size={13} />
            {address}
          </button>
        </div>

        {/* CTA LINK */}
        <div className="mt-6">
          <Link
            href={href}
            className="
              inline-flex items-center justify-center gap-2
              px-7 py-3 rounded-xl text-sm font-semibold
              transition-all duration-300
              hover:scale-[1.05] active:scale-[0.96]
            "
            style={{
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-soft))",
              color: "#fff",
              boxShadow: "0 10px 40px var(--accent-glow)",
            }}
          >
            Réserver
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}