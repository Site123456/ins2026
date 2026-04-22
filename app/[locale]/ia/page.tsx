"use client";

import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/hooks/useTheme";
import { useAccentFromCookies } from "@/components/hooks/useAccentFromCookies";
import { Sparkles, Clock, Bot, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export default function IAPage() {
  const { language } = useLanguage();
  const { isDark } = useTheme();
  const accent = useAccentFromCookies() || "#f65c5cff";
  const isFr = language === "fr";

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  return (
    <div className={`relative min-h-screen pt-24 px-4 md:px-8 lg:px-16 pb-20 overflow-hidden flex flex-col items-center justify-center transition-colors duration-700 ${isDark ? 'bg-[#030305] text-white' : 'bg-[#fafafa] text-slate-900'}`}>

      <div className="max-w-5xl w-full mx-auto relative z-10 flex flex-col items-center text-center">
        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]"
        >
          {isFr ? "Recherche " : " "}
          <span className="relative z-10 text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${accent}, ${isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(34, 0, 0, 0.7)'})` }}>
            {isFr ? "IA" : "AI"}
          </span>
          {isFr ? " " : " Search "}
        </motion.h1>

        {/* Premium Glassmorphic Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl"
        >
          {/* Card Glow */}
          <div className="absolute -inset-1 rounded-[3rem] blur-2xl opacity-20" style={{ backgroundColor: accent }} />

          <div
            className="relative p-8 md:p-12 rounded-[2.5rem] border backdrop-blur-2xl overflow-hidden shadow-2xl"
            style={{
              backgroundColor: isDark ? 'rgba(20,20,25,0.6)' : 'rgba(255,255,255,0.7)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
            }}
          >
            {/* Decorative background elements inside card */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ backgroundColor: accent }} />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: isDark ? '#fff' : accent }} />

            <div className="relative z-10">
              <p className={`text-lg md:text-2xl font-medium leading-relaxed mb-10 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {isFr
                  ? "Plus d'informations dans les commentaires ci-dessous:"
                  : "More information in the comments below:"}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">

                {/* Primary Action Button */}
                <Link href="/search?item=1" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-white shadow-xl overflow-hidden"
                    style={{ backgroundColor: accent }}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <Sparkles className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">
                      {isFr ? "Voir le commentaire" : "See the comment"}
                    </span>
                    <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
                  </motion.button>
                </Link>

              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
