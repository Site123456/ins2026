'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, LogOut, Settings, ChevronDown, Bell } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Portal from "@/components/Portal";

interface AuthButtonsProps {
  isDark: boolean;
  accent: string;
}

export default function AuthButtons({ isDark, accent }: AuthButtonsProps) {
  const { user, isAuthenticated, signOut, openAuthModal } = useAuth();
  const { t } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);

  // FIXED OUTSIDE CLICK HANDLER (Portal‑safe)
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // If click is inside trigger → ignore
      if (triggerRef.current?.contains(target)) return;

      // If click is inside dropdown (portal) → ignore
      const dropdownEl = document.getElementById("auth-dropdown");
      if (dropdownEl && dropdownEl.contains(target)) return;

      // Otherwise close
      setShowDropdown(false);
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClick);
    }

    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDropdown]);

  const handleSignIn = () => openAuthModal('signin');
  const handleSignUp = () => openAuthModal('signup');
  const handleSignOut = () => {
    signOut();
    setShowDropdown(false);
  };

  const handleSettingsClick = () => {
    setShowDropdown(false);
    setShowSettingsModal(true);
  };

  // AUTHENTICATED UI
  if (isAuthenticated && user) {
    return (
      <div className="relative" ref={triggerRef}>
        {/* Trigger Button */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDropdown(!showDropdown)}
          className={`
            flex h-10 items-center gap-2 rounded-xl px-3
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
            hover:shadow-lg
            ${isDark
              ? 'text-white bg-black/60 hover:bg-black border border-white/10 focus:ring-white/20 focus:ring-offset-[#0a0a0f]'
              : 'text-zinc-900 bg-white/60 hover:bg-white border border-zinc-200 focus:ring-zinc-200 focus:ring-offset-white'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
          </div>
          <motion.div
            animate={{ rotate: showDropdown ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.button>

        {/* DROPDOWN IN PORTAL */}
        <Portal>
          {/* Backdrop (mobile only) */}
          {showDropdown && (
            <div
              className="fixed inset-0 z-[10] sm:hidden bg-black/40 backdrop-blur-sm"
              onClick={() => setShowDropdown(false)}
            />
          )}

          {/* Dropdown */}
          <div
            id="auth-dropdown"
            className={`
              fixed right-3 top-16 md:top-24 z-[999] w-64 sm:w-56
              transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${showDropdown
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
              }
            `}
          >
            <div
              className={`
                rounded-2xl border shadow-2xl backdrop-blur-2xl overflow-hidden
                ${isDark
                  ? 'bg-[#0a0a0f]/90 border-white/10'
                  : 'bg-white/90 border-zinc-200'
                }
              `}
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                    <span className="text-lg font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      {user.name}
                    </p>
                    <p className={`text-xs truncate ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      {user.loginCount}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Visites</p>
                  </div>

                  <div>
                    <Bell
                      className={`h-4 w-4 mx-auto ${user.newsletterSubscribed
                        ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                        : isDark ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                    />
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Newsletter</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-2">
                <button
                  onClick={handleSettingsClick}
                  className={`
                    flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm
                    transition-all duration-200 hover:bg-white/5 hover:translate-x-1
                    ${isDark ? 'text-zinc-300' : 'text-zinc-700'}
                  `}
                >
                  <Settings className="h-4 w-4" />
                  {t('settingsBtn')}
                </button>

                <div className="border-t border-white/10 my-2" />

                <button
                  onClick={handleSignOut}
                  className="
                    flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm
                    transition-all duration-200 hover:bg-rose-500/10 hover:translate-x-1
                    text-rose-500
                  "
                >
                  <LogOut className="h-4 w-4" />
                  {t('logoutBtn')}
                </button>
              </div>
            </div>
          </div>

          {/* Settings Modal */}
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            isDark={isDark}
            accent={accent}
          />
        </Portal>
      </div>
    );
  }

  // NOT AUTHENTICATED UI
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-center gap-1.5"
    >
      <motion.button
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleSignIn}
        className={`
      flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium
      transition-all duration-200 hover:shadow-md shrink-0
      ${isDark
            ? "text-white bg-black/50 hover:bg-black/70 border border-white/10"
            : "text-zinc-900 bg-white/70 hover:bg-white border border-zinc-200"
          }
    `}
      >
        <LogIn className="h-3.5 w-3.5" />
        <span className="truncate">{t("signInBtn")}</span>
      </motion.button>

      <motion.button
        whileHover={{
          scale: 1.04,
          y: -1,
          boxShadow: `0 6px 18px ${accent}50`,
        }}
        whileTap={{ scale: 0.94 }}
        onClick={handleSignUp}
        className={`
      flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium
      transition-all duration-200 shrink-0
      ${isDark ? "" : ""}
    `}
        style={{
          background: `linear-gradient(to right, ${accent}, ${accent}dd)`,
          color: "white",
          boxShadow: `0 3px 12px ${accent}35`,
        }}
      >
        <UserPlus className="h-3.5 w-3.5" />
        <span className="hidden xs:inline truncate">{t("signUpBtn")}</span>
      </motion.button>
    </motion.div>

  );
}
