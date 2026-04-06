import React, { useState, useEffect, SVGProps } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ExternalLink,
  Check,
} from "lucide-react";

type FooterProps = {
  isDark?: boolean;
  accent?: string;
};

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

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(139,92,246,${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function FooterDef({ isDark = true, accent: accentProp }: FooterProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [focused, setFocused] = useState(false);
  const [accent, setAccent] = useState(accentProp || "#8b5cf6");
  const [showPopup, setShowPopup] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupSuccess, setPopupSuccess] = useState(false);

  useEffect(() => {
    if (accentProp) {
      setAccent(accentProp);
      return;
    }
    try {
      const cookie = getCookie("cs_settings");
      if (cookie) {
        const settings = JSON.parse(cookie);
        if (settings.accent) setAccent(settings.accent);
      }
    } catch {}
  }, [accentProp]);

  const year = new Date().getFullYear();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes("@")) {
      setShowPopup(true);
    }
  };

  const handlePopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });
      if (response.ok) {
        setPopupSuccess(true);
        setTimeout(() => {
          setShowPopup(false);
          setPopupSuccess(false);
          setSubscribed(true);
          setEmail("");
          setName("");
          setTimeout(() => setSubscribed(false), 3000);
        }, 2000);
      } else {
        alert('Failed to subscribe. Please try again.');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const footerLinks = {
    product:
    [
      {
        label: "Paris 15 - Pasteur",
        href: "https://deliveroo.fr/fr/menu/paris/Pasteur/bidit-risheb/"
      },
      {
        label: "Bordeaux – Cour du Médoc",
        href: "https://deliveroo.fr/fr/menu/bordeaux/bordeaux-editions-cour-du-medoc/indian-nepali-swad-editions-bordeaux/"
      },
      {
        label: "Courbevoie – La Défense",
        href: "https://deliveroo.fr/fr/menu/paris/editions-courbevoie/indian-nepali-swad-editions-courbevoie/"
      },
      {
        label: "Saint‑Ouen – Aubervilliers",
        href: "https://deliveroo.fr/fr/menu/paris/editions-saint-ouen/indian-nepali-swad-editions-aubervilliers/"
      },
      {
        label: "Bagneux",
        href: "https://deliveroo.fr/fr/menu/paris/editions-site-bagneux/indian-nepali-swad-editions-bagneux/"
      },
      {
        label: "Ivry",
        href: "https://deliveroo.fr/fr/menu/paris/editions-ivry/indian-nepali-swad-editions-ivry/"
      },
      {
        label: "Aubervilliers (En cours de renovation)",
        href: "#"
      }
    ],
    releases: [{ label: "CORS (Alpha)", href: "/models/cors" }],
  };
  const FacebookIcon = ({
    isDark,
    ...props
  }: SVGProps<SVGSVGElement> & { isDark?: boolean }) => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M22.675 0H1.325A1.32 1.32 0 0 0 0 1.325v21.351A1.32 1.32 0 0 0 1.325 24h11.495v-9.294H9.691v-3.622h3.129V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24h-1.918c-1.504 0-1.796.715-1.796 1.764v2.314h3.587l-.467 3.622h-3.12V24h6.116A1.32 1.32 0 0 0 24 22.675V1.325A1.32 1.32 0 0 0 22.675 0" />
    </svg>
  );
  const TwitterIcon = ({
    isDark,
    ...props
  }: SVGProps<SVGSVGElement> & { isDark?: boolean }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723 9.864 9.864 0 0 1-3.127 1.195A4.92 4.92 0 0 0 16.616 3c-2.72 0-4.92 2.21-4.92 4.93 0 .39.045.765.127 1.124C7.728 8.89 4.1 6.92 1.67 3.905a4.822 4.822 0 0 0-.666 2.48c0 1.71.87 3.213 2.188 4.096a4.903 4.903 0 0 1-2.228-.616v.06c0 2.385 1.693 4.374 3.946 4.827a4.996 4.996 0 0 1-2.212.085c.623 1.956 2.445 3.377 4.6 3.417A9.868 9.868 0 0 1 0 19.54a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.01-7.514 14.01-14.01 0-.213-.005-.425-.014-.636A9.935 9.935 0 0 0 24 4.59z" />
    </svg>
  );
  const InstagramIcon = ({
    isDark,
    ...props
  }: SVGProps<SVGSVGElement> & { isDark?: boolean }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.056 1.97.24 2.427.403a4.92 4.92 0 0 1 1.75 1.145 4.92 4.92 0 0 1 1.145 1.75c.163.457.347 1.257.403 2.427.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.056 1.17-.24 1.97-.403 2.427a4.92 4.92 0 0 1-1.145 1.75 4.92 4.92 0 0 1-1.75 1.145c-.457.163-1.257.347-2.427.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.056-1.97-.24-2.427-.403a4.92 4.92 0 0 1-1.75-1.145 4.92 4.92 0 0 1-1.145-1.75c-.163-.457-.347-1.257-.403-2.427C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.056-1.17.24-1.97.403-2.427a4.92 4.92 0 0 1 1.145-1.75 4.92 4.92 0 0 1 1.75-1.145c.457-.163 1.257-.347 2.427-.403C8.416 2.175 8.796 2.163 12 2.163zm0 3.675a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm7.2-.405a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
    </svg>
  );
  const YoutubeIcon = ({
    isDark,
    ...props
  }: SVGProps<SVGSVGElement> & { isDark?: boolean }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.186a2.974 2.974 0 0 0-2.09-2.103C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.408.583A2.974 2.974 0 0 0 .502 6.186 31.533 31.533 0 0 0 0 12a31.533 31.533 0 0 0 .502 5.814 2.974 2.974 0 0 0 2.09 2.103C4.495 20.5 12 20.5 12 20.5s7.505 0 9.408-.583a2.974 2.974 0 0 0 2.09-2.103A31.533 31.533 0 0 0 24 12a31.533 31.533 0 0 0-.502-5.814zM9.75 15.568V8.432L15.818 12 9.75 15.568z" />
    </svg>
  );
  const TikTokIcon = ({
    isDark,
    ...props
  }: SVGProps<SVGSVGElement> & { isDark?: boolean }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  );

  const socials = [
    {
      icon: FacebookIcon,
      href: "https://www.facebook.com/people/Indian-Nepali-Swad/100041638634787/",
      label: "Facebook",
    },
    {
      icon: TwitterIcon,
      href: "https://twitter.com/INepaliswad",
      label: "Twitter",
    },
    {
      icon: InstagramIcon,
      href: "https://www.instagram.com/indiannepaliswad/",
      label: "Instagram",
    },
    {
      icon: YoutubeIcon,
      href: "https://www.youtube.com/channel/UCHPsdHfepFygMiWvlLclhcA",
      label: "YouTube",
    },
    {
      icon: TikTokIcon,
      href: "https://www.tiktok.com/@indiannepaliswad",
      label: "TikTok",
    },
  ];


  return (
    <footer
      className={`relative w-full overflow-hidden ${
        isDark ? "bg-[#08080c] text-white" : "bg-[#f5f4f2] text-gray-900"
      }`}
    >
      <div
        className="h-px w-full"
        style={{
          background: `linear-gradient(to right, transparent, ${hexToRgba(accent, 0.4)}, transparent)`,
        }}
      />

      {isDark && (
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      )}
      <div className="relative mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-6 lg:col-span-4 flex flex-col items-center md:items-start text-center md:text-left space-y-5">
            <div className="flex items-center justify-center md:justify-start">
              <div className="relative">
                <div
                  className="absolute inset-0 blur-2xl rounded-full"
                  style={{ backgroundColor: hexToRgba(accent, 0.2) }}
                />
                <Image
                  src="/etc/logo.png"
                  alt="Indian Nepali Swad"
                  width={156}
                  height={156}
                  className={`relative rounded-xl ${isDark? "brightness-0 invert-100": ""}`}
                />
              </div>
            </div>

            <p
              className={`text-[13px] leading-relaxed max-w-xs ${
                isDark ? "text-white/40" : "text-black/40"
              }`}
            >
              Indian Nepali Swad propose une cuisine authentique et généreuse d&apos;Inde et du Népal,
              préparée avec des épices traditionnelles et des recettes maison. Réservations et livraison
              disponibles partout en Île‑de‑France ainsi qu&apos;à Bordeaux.
              <Link
                href="https://www.indian-nepaliswad.fr/"
                className="transition-colors duration-300 ps-1"
                style={{ color: accent }}
              >
                En savoir plus
              </Link>
            </p>
          </div>

          <div className="md:col-span-6 lg:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <div
              className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${
                isDark ? "text-white/30" : "text-black/30"
              }`}
            >
              Livraison par Deliveroo
            </div>

            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center justify-center md:justify-start gap-1.5 text-[13px] transition-all duration-300"
                    style={{
                      color: isDark
                        ? "rgba(255,255,255,0.4)"
                        : "rgba(0,0,0,0.4)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isDark
                        ? "rgba(255,255,255,0.4)"
                        : "rgba(0,0,0,0.4)";
                    }}
                  >
                    {link.label}
                    <ExternalLink
                      className="h-2.5 w-2.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-40 group-hover:translate-x-0"
                      style={{ color: "currentColor" }}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-12 lg:col-span-4 flex flex-col items-center text-center lg:items-start lg:text-left space-y-7">

            {/* Section Label */}
            <div
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                isDark ? "text-white/30" : "text-black/30"
              }`}
            >
              Souscrire à la Newsletter
            </div>

            {/* Newsletter Form */}
            <form onSubmit={handleSubscribe} className="w-full max-w-sm mx-auto lg:mx-0">
              <div
                className="
                  flex flex-col sm:flex-row 
                  items-stretch sm:items-center 
                  gap-2 
                  rounded-xl p-1 
                  transition-all duration-300
                "
                style={{
                  borderWidth: 1,
                  borderColor: focused
                    ? hexToRgba(accent, 0.4)
                    : isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.06)",
                  backgroundColor: focused
                    ? hexToRgba(accent, 0.05)
                    : isDark
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(0,0,0,0.02)",
                  boxShadow: focused
                    ? `0 4px 20px -4px ${hexToRgba(accent, 0.15)}`
                    : "none",
                }}
              >
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className={`
                    flex-1 bg-transparent 
                    py-2.5 px-2 
                    text-[13px] 
                    outline-none 
                    w-full
                    ${isDark ? "text-white" : "text-black"}
                  `}
                />

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="
                    flex items-center justify-center 
                    gap-1.5 
                    rounded-lg 
                    px-4 py-2 
                    text-[12px] font-semibold 
                    transition-all duration-300
                    w-full sm:w-auto
                    disabled:opacity-50
                  "
                  style={
                    subscribed
                      ? {
                          backgroundColor: "rgba(16,185,129,0.15)",
                          color: "#10b981",
                        }
                      : {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.1)",
                          color: isDark ? "white" : "black",
                        }
                  }
                  whileHover={!subscribed && !loading ? { scale: 1.05 } : {}}
                  whileTap={!subscribed && !loading ? { scale: 0.95 } : {}}
                >
                  <AnimatePresence mode="wait">
                    {subscribed ? (
                      <motion.div
                        key="subscribed"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-1.5"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                        >
                          <Check className="h-3 w-3" />
                        </motion.div>
                        Subscribed
                      </motion.div>
                    ) : loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                        Subscribing...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="subscribe"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        Subscribe
                        <ArrowRight className="h-3 w-3" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </form>

            <p
              className={`text-[11px] leading-relaxed max-w-xs mx-auto lg:mx-0 ${
                isDark ? "text-white/50" : "text-black/50"
              }`}
            >
              En vous abonnant, vous créez automatiquement un compte Indian Nepali Swad avec connexion directe par email activée par défaut. Gérez vos réservations, laissez des avis sur nos plats délicieux et explorez tous nos sites en un clic ! Vous avez également l&apos;option d&apos;activer notre bot intelligent pour des recommandations personnalisées et un service client 24/7.
            </p>

            <div
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                isDark ? "text-white/30" : "text-black/30"
              }`}
            >
              Réservation de table
            </div>
            <div className="flex flex-col w-full max-w-sm space-y-3">
              {[
                { label: "Réserver à Aubervilliers", href: "/reserver/aubervilliers" },
                { label: "Réserver à Paris 15", href: "/reserver/paris15" },
              ].map((btn) => (
                <a
                  key={btn.label}
                  href={btn.href}
                  className="
                    group w-full py-3.5 rounded-xl 
                    text-[14px] font-semibold 
                    flex items-center justify-center gap-2
                    transition-all duration-300
                  "
                  style={{
                    backgroundColor: accent,
                    color: "white",
                    boxShadow: `0 4px 14px -4px ${hexToRgba(accent, 0.45)}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hexToRgba(accent, 0.85);
                    e.currentTarget.style.boxShadow = `0 6px 22px -4px ${hexToRgba(accent, 0.55)}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = accent;
                    e.currentTarget.style.boxShadow = `0 4px 14px -4px ${hexToRgba(accent, 0.45)}`;
                  }}
                >
                  <svg
                    className="h-4.5 w-4.5 opacity-90 group-hover:opacity-100 transition-all"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.657 16.657L13 21.314l-4.657-4.657A8 8 0 1117.657 16.657z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>

                  {btn.label}
                </a>
              ))}
            </div>
            
            {/* Bot Activation Section */}
            <div className="w-full max-w-sm mx-auto lg:mx-0">
              <div
                className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${
                  isDark ? "text-white/30" : "text-black/30"
                }`}
              >
                Assistant IA
              </div>
              <button
                className="
                  group w-full py-3.5 rounded-xl 
                  text-[14px] font-semibold 
                  flex items-center justify-center gap-2
                  transition-all duration-300
                  border-2
                "
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                  boxShadow: `0 4px 14px -4px ${hexToRgba(accent, 0.1)}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hexToRgba(accent, 0.1);
                  e.currentTarget.style.borderColor = hexToRgba(accent, 0.3);
                  e.currentTarget.style.color = accent;
                  e.currentTarget.style.boxShadow = `0 6px 22px -4px ${hexToRgba(accent, 0.2)}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
                  e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
                  e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)";
                  e.currentTarget.style.boxShadow = `0 4px 14px -4px ${hexToRgba(accent, 0.1)}`;
                }}
              >
                <svg
                  className="h-4.5 w-4.5 opacity-90 group-hover:opacity-100 transition-all"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Activer le Bot IA
              </button>
              <p
                className={`text-[10px] leading-relaxed mt-2 text-center lg:text-left ${
                  isDark ? "text-white/40" : "text-black/40"
                }`}
              >
                Obtenez des recommandations personnalisées et un support instantané
              </p>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 pt-1">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex h-9 w-9 
                    items-center justify-center 
                    rounded-xl 
                    transition-all duration-300 
                    hover:scale-105
                  "
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.04)",
                    color: isDark
                      ? "rgba(255,255,255,0.4)"
                      : "rgba(0,0,0,0.4)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hexToRgba(accent, 0.12);
                    e.currentTarget.style.color = accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.04)";
                    e.currentTarget.style.color = isDark
                      ? "rgba(255,255,255,0.4)"
                      : "rgba(0,0,0,0.4)";
                  }}
                >
                  <Icon className="h-4.5 w-4.5" isDark={isDark} />
                </a>
              ))}
            </div>
          </div>


        </div>
      </div>


      <p className="px-8 pb-2 max-w-6xl opacity-50 text-[10px] mx-auto leading-relaxed">
        Pour annuler ou modifier votre réservation, veuillez suivre les instructions ci-dessous :
      </p>

      <ul className="px-8 pb-2 max-w-6xl opacity-50 text-[10px] mx-auto list-disc pl-5 space-y-2 leading-relaxed">
        <li>
          Consultez l’e-mail de confirmation reçu après votre réservation. Certaines options de modification ou d’annulation y sont disponibles.
        </li>

        <li>
          Connectez-vous à votre compte INS, puis accédez à{" "}
          <span className="font-medium">“Mes réservations”</span> via le panneau latéral gauche
          (icône livre ouvert en bas à gauche).
        </li>

        <li>
          Les services <span className="font-medium">sur place</span> et <span className="font-medium">à emporter</span> sont uniquement disponibles aux adresses suivantes :
          <ul className="mt-2 space-y-1 pl-4 list-disc">
            <li>
              <a
                className="underline"
                href="https://www.google.com/maps/dir//4+Rue+Bargue,+75015+Paris"
              >
                4 Rue Bargue, 75015 Paris
              </a>
            </li>
            <li>
              <a
                className="underline"
                href="https://www.google.com/maps/dir//79+Rue+du+Landy,+93300+Aubervilliers"
              >
                79 Rue du Landy, 93300 Aubervilliers
              </a>
            </li>
          </ul>
        </li>
      </ul>
      <div
        className="border-t"
        style={{
          borderColor: isDark
            ? "rgba(255,255,255,0.04)"
            : "rgba(0,0,0,0.04)",
        }}
      >
        <div className="mx-auto max-w-6xl px-5 py-4 md:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div
              className={`flex items-center gap-2 text-[11px] ${
                isDark ? "text-white/25" : "text-black/25"
              }`}
            >
              <span
                className="font-semibold transition-colors duration-300"
                style={{ color: hexToRgba(accent, isDark ? 0.5 : 0.6) }}
              >
                INDIAN NEPALI SWAD
              </span>
              <span>&copy;2017-{year} www.indian-nepaliswad.fr</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Tout droit reservé</span>
            </div>
            <div
              className={`flex items-center gap-3 text-[11px] sm:hidden ${
                isDark ? "text-white/25" : "text-black/25"
              }`}
            >
              <Link href="/terms" className="hover:underline">
                Terms
              </Link>
              <Link href="/privacy" className="hover:underline">
                Privacy
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Popup Modal */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }}
            onClick={() => !loading && !popupSuccess && setShowPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl overflow-hidden"
              style={{
                backgroundColor: isDark 
                  ? 'rgba(8, 8, 12, 0.85)' 
                  : 'rgba(255, 255, 255, 0.90)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                boxShadow: `0 20px 60px -10px ${hexToRgba(accent, 0.2)}, inset 0 1px 1px ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative gradient background */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at top right, ${hexToRgba(accent, 0.08)}, transparent 60%)`,
                }}
              />

              <AnimatePresence mode="wait">
                {!popupSuccess ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10"
                  >
                    {/* Header */}
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center backdrop-blur-lg"
                        style={{
                          backgroundColor: hexToRgba(accent, 0.15),
                          border: `1.5px solid ${hexToRgba(accent, 0.3)}`,
                        }}
                      >
                        <svg
                          className="w-7 h-7"
                          style={{ color: accent }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </motion.div>

                      <motion.h2
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl font-bold mb-2"
                        style={{ color: isDark ? 'white' : 'rgba(0,0,0,0.95)' }}
                      >
                        Stay Connected
                      </motion.h2>

                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="text-sm leading-relaxed"
                        style={{ color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)' }}
                      >
                        Join our community and receive exclusive offers, special menus, reservation updates & culinary stories delivered to your inbox
                      </motion.p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handlePopupSubmit} className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <label
                          className="block text-xs font-semibold uppercase tracking-wider mb-3"
                          style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                        >
                          Your Full Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-xl backdrop-blur-sm transition-all duration-300 focus:outline-none"
                          style={{
                            backgroundColor: isDark 
                              ? 'rgba(255,255,255,0.06)' 
                              : 'rgba(0,0,0,0.04)',
                            color: isDark ? 'white' : 'black',
                            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = hexToRgba(accent, 0.5);
                            e.currentTarget.style.backgroundColor = isDark 
                              ? 'rgba(255,255,255,0.08)' 
                              : 'rgba(0,0,0,0.05)';
                            e.currentTarget.style.boxShadow = `0 0 0 3px ${hexToRgba(accent, 0.1)}, inset 0 1px 2px ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`;
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                            e.currentTarget.style.backgroundColor = isDark 
                              ? 'rgba(255,255,255,0.06)' 
                              : 'rgba(0,0,0,0.04)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          required
                        />
                      </motion.div>

                      {/* Buttons */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex gap-3 pt-2"
                      >
                        <button
                          type="button"
                          onClick={() => setShowPopup(false)}
                          disabled={loading}
                          className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
                          style={{
                            backgroundColor: isDark 
                              ? 'rgba(255,255,255,0.06)' 
                              : 'rgba(0,0,0,0.05)',
                            color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                          }}
                        >
                          Maybe Later
                        </button>

                        <motion.button
                          type="submit"
                          disabled={loading || !name.trim()}
                          className="flex-1 px-4 py-3 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: loading ? hexToRgba(accent, 0.8) : accent,
                            boxShadow: `0 8px 24px -8px ${hexToRgba(accent, 0.4)}`,
                          }}
                          whileHover={!loading ? { boxShadow: `0 12px 32px -8px ${hexToRgba(accent, 0.5)}` } : {}}
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Subscribing...</span>
                            </>
                          ) : (
                            <>
                              <span>Subscribe</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    </form>

                    {/* Privacy notice */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs text-center mt-4"
                      style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
                    >
                      We respect your privacy • Unsubscribe anytime
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                    className="text-center relative z-10"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                      className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center mx-auto mb-6"
                      style={{
                        background: `linear-gradient(135deg, ${hexToRgba(accent, 0.3)}, ${hexToRgba(accent, 0.15)})`,
                        border: `1.5px solid ${hexToRgba(accent, 0.5)}`,
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      >
                        <Check className="w-10 h-10" style={{ color: accent }} />
                      </motion.div>
                    </motion.div>

                    <motion.h2
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-bold mb-2"
                      style={{ color: isDark ? 'white' : 'rgba(0,0,0,0.95)' }}
                    >
                      You're all set!
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="text-sm"
                      style={{ color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)' }}
                    >
                      A confirmation email is on its way—check your inbox for special surprises
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </footer>
  );
}