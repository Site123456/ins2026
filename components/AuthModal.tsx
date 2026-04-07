'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mail, User, CheckCircle, AlertCircle, Loader2, ArrowLeft, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup' | 'newsletter';
  email?: string;
  isDark: boolean;
  accent: string;
}

const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
};

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: 'spring', 
      damping: 25, 
      stiffness: 300,
      staggerChildren: 0.1
    }
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function AuthModal({ isOpen, onClose, mode: initialMode, email: initialEmail = '', isDark }: AuthModalProps) {
  const { requestCode, verifyCode } = useAuth();

  // MODE RULES
  const [mode, setMode] = useState<'signin' | 'signup' | 'newsletter'>(initialMode);
  const requiresName = mode === "signup" || mode === "newsletter";
  const requiresOtp = mode === "signin"; // NEW RULE

  // STATE
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({ email: "", name: "" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isCodeSent, setIsCodeSent] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // MODAL OPEN/CLOSE LIFECYCLE
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setMode(initialMode);
      setFormData(prev => ({ ...prev, email: initialEmail || prev.email }));
      setStep(1);
      setError("");
      setSuccess("");
      setIsCodeSent(false);
      setOtp(["", "", "", "", "", ""]);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialMode, initialEmail]);

  // RESEND COOLDOWN TIMER
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // VALIDATION
  const validateForm = () => {
    if (!formData.email.trim()) return "Veuillez entrer une adresse email.";
    if (requiresName && !formData.name.trim()) return "Veuillez entrer votre nom complet.";
    return null;
  };
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    const nameToSend = requiresName ? formData.name.trim() : undefined;

    const result = await requestCode(formData.email.trim(), mode, nameToSend);

    if (!result.success) {
      setError(result.error || "Échec de l'envoi du code");
      setIsLoading(false);
      return;
    }

    // DIRECT LOGIN INTERCEPT
    if ((result as any).isDirectLogin) {
      setSuccess(
        mode === "signup"
          ? "Bienvenue ! Votre compte a été créé avec succès ✨"
          : "Merci ! Inscription à la newsletter réussie 📧"
      );

      setTimeout(() => {
        onClose();
        setFormData({ email: "", name: "" });
        setOtp(["", "", "", "", "", ""]);
        setStep(1);
        setSuccess("");
      }, 2500);

      setIsLoading(false);
      return;
    }

    // SIGN-IN → OTP REQUIRED
    if (requiresOtp) {
      setStep(2);
      setIsCodeSent(true);
      setResendCooldown(30);
      setTimeout(() => setIsCodeSent(false), 4000);
      setIsLoading(false);
      return;
    }

    // FALLBACK SUCCESS
    setSuccess(
      mode === "signup"
        ? "Bienvenue ! Votre compte a été créé avec succès ✨"
        : "Merci ! Inscription à la newsletter réussie 📧"
    );

    setTimeout(() => {
      onClose();
      setFormData({ email: "", name: "" });
      setOtp(["", "", "", "", "", ""]);
      setStep(1);
      setSuccess("");
    }, 2500);

    setIsLoading(false);
  };
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();

    // Only digits
    if (!/^\d+$/.test(pasted)) return;

    // Must be 6 digits
    if (pasted.length !== 6) return;

    const digits = pasted.split("");

    setOtp(digits);

    // Autofocus last input
    otpRefs.current[5]?.focus();

    // Auto-verify
    handleVerifyCode();
  };

  // VERIFY CODE (sign-in only)
  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!requiresOtp) return;

    const code = otp.join("");
    if (code.length < 6) return;

    setIsLoading(true);
    setError("");

    const result = await verifyCode(formData.email.trim(), code, mode);

    if (result.success) {
      setSuccess("Heureux de vous revoir ! Connexion réussie 🔓");

      setTimeout(() => {
        onClose();
        setFormData({ email: "", name: "" });
        setOtp(["", "", "", "", "", ""]);
        setStep(1);
        setSuccess("");
      }, 2500);
    } else {
      setError(result.error || "Code invalide ou expiré");
    }

    setIsLoading(false);
  };

  // OTP INPUT HANDLING (sign-in only)
  const handleOtpChange = (index: number, value: string) => {
    if (!requiresOtp) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) otpRefs.current[index + 1]?.focus();

    if (newOtp.every(v => v !== "") && index === 5) {
      handleVerifyCode();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!requiresOtp) return;
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // RESEND CODE (sign-in only)
  const handleResend = async () => {
    if (!requiresOtp || resendCooldown > 0) return;

    setIsLoading(true);
    setError("");

    const nameToSend = requiresName ? formData.name.trim() : undefined;

    const result = await requestCode(formData.email.trim(), mode, nameToSend);

    if (result.success) {
      setIsCodeSent(true);
      setResendCooldown(30);
      setTimeout(() => setIsCodeSent(false), 4000);
    } else {
      setError(result.error || "Échec du renvoi");
    }

    setIsLoading(false);
  };


  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop responsive + theme-aware */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className={`
          fixed inset-0 -z-1
          backdrop-blur-xl transition-all
          ${isDark ? "bg-black/70" : "bg-black/40"}
        `}
      />

      {/* Toast OTP */}
      <AnimatePresence>
        {isCodeSent && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            className={`
              fixed top-6 left-1/2 -translate-x-1/2 z-[70]
              px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-xl
              flex items-center gap-3 sm:gap-4
              border backdrop-blur-xl
              max-w-[90%] sm:max-w-md
              ${isDark
                ? "bg-zinc-900/90 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
                : "bg-white/90 border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
              }
            `}
          >
            <div
              className={`
                p-2 rounded-full
                ${isDark ? "bg-emerald-500/20" : "bg-emerald-500/10"}
              `}
            >
              <ShieldCheck
                className={`
                  w-5 h-5
                  ${isDark ? "text-emerald-400" : "text-emerald-600"}
                `}
              />
            </div>

            <div className="flex flex-col">
              <p
                className={`
                  text-sm font-bold leading-none
                  ${isDark ? "text-white" : "text-zinc-900"}
                `}
              >
                Code de sécurité envoyé !
              </p>

              <p
                className={`
                  text-xs mt-1
                  ${isDark ? "text-zinc-400" : "text-zinc-600"}
                `}
              >
                Consultez votre boîte mail : <span className="font-medium">{formData.email}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Modal Container */}
      <motion.div
        layout
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`
          relative w-full max-w-md overflow-hidden rounded-[2.5rem] border shadow-[0_32px_128px_rgba(0,0,0,0.5)]
          ${isDark ? 'bg-[#0a0a0f]/90 border-white/10' : 'bg-white border-zinc-200'}
          backdrop-blur-3xl
        `}
      >
        {/* Animated Gradient Border Overlay */}
        <div className="absolute -z-1 inset-0 pointer-events-none opacity-20">
          <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_120deg,(--accent)_180deg,transparent_240deg,transparent_360deg)] animate-[spin_8s_linear_infinite]" />
        </div>

        {/* Progress Bar (at very top) */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/10 z-10">
          <motion.div 
            className="h-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]"
            initial={{ width: '0%' }}
            animate={{ width: step === 1 ? '50%' : '100%' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* Close & Back Buttons */}
        <div className="flex items-center justify-between p-8 pb-4">
          {step === 2 ? (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => { setStep(1); setError(''); }}
              className="group flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
            >
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10 transition-all">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
              Retour
            </motion.button>
          ) : <div />}
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/5 border border-white/5 hover:border-white/20 hover:scale-110 active:scale-95 transition-all"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-8 pt-2">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="text-center py-12 space-y-6"
              >
                <div className="mx-auto w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                  >
                    <CheckCircle className="w-16 h-16 text-emerald-500" />
                  </motion.div>
                  <motion.div 
                    className="absolute inset-0 rounded-full border-2 border-emerald-500/50"
                    animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </div>
                <h2 className="text-2xl font-bold text-white leading-tight px-4">{success}</h2>
                <div className="flex items-center justify-center gap-2 text-emerald-500/80 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirection...
                </div>
              </motion.div>
            ) : step === 1 ? (
              <motion.div
                key="step1"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-8"
              >
                {/* HEADER */}
                <motion.div variants={itemVariants}>
                  <h2
                    className={`
                      text-4xl font-black tracking-tight
                      ${isDark ? "text-white" : "text-zinc-900"}
                    `}
                  >
                    {mode === "signin"
                      ? "Bon retour"
                      : mode === "newsletter"
                      ? "Rejoindre"
                      : "Créer un compte"}
                  </h2>

                  <p
                    className={`
                      mt-3 text-lg
                      ${isDark ? "text-zinc-400" : "text-zinc-600"}
                    `}
                  >
                    {mode === "signup"
                      ? "Réservez votre place au sommet de la gastronomie."
                      : "L'excellence indienne à portée de clic."}
                  </p>
                </motion.div>

                <motion.form
                  variants={itemVariants}
                  onSubmit={handleRequestCode}
                  className="space-y-5"
                >
                  {mode != "signin" && (
                    <div className="space-y-2.5">
                      <label
                        className={`
                          text-sm font-bold uppercase tracking-widest ml-1
                          ${isDark ? "text-zinc-500" : "text-zinc-700"}
                        `}
                      >
                        Identité Complète
                      </label>

                      <div className="relative group">
                        <div
                          className={`
                            absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-xl border transition-all
                            ${isDark
                              ? "bg-white/5 border-white/5 group-focus-within:border-(--accent)/30"
                              : "bg-black/5 border-black/10 group-focus-within:border-(--accent)/40"}
                          `}
                        >
                          <User
                            className={`
                              w-4 h-4 transition-colors
                              ${isDark ? "text-zinc-500" : "text-zinc-600"}
                              group-focus-within:text-(--accent)
                            `}
                          />
                        </div>

                        <input
                          required={mode === "signup"}
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((p) => ({ ...p, name: e.target.value }))
                          }
                          placeholder="Prénom & Nom"
                          className={`
                            w-full pl-12 sm:pl-14 pr-4 sm:pr-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl outline-none transition-all border
                            focus:ring-4 focus:ring-[var(--accent)]/10 focus:border-[var(--accent)]
                            ${isDark
                              ? "bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                              : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400"}
                          `}
                        />
                      </div>
                    </div>
                  )}

                  {/* EMAIL FIELD — always shown */}
                  <div className="space-y-2.5">
                    <label
                      className={`
                        text-sm font-bold uppercase tracking-widest ml-1
                        ${isDark ? "text-zinc-500" : "text-zinc-700"}
                      `}
                    >
                      Email
                    </label>

                    <div className="relative group">
                      <div
                        className={`
                          absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-xl border transition-all
                          ${isDark
                            ? "bg-white/5 border-white/5 group-focus-within:border-(--accent)/30"
                            : "bg-black/5 border-black/10 group-focus-within:border-(--accent)/40"}
                        `}
                      >
                        <Mail
                          className={`
                            w-4 h-4 transition-colors
                            ${isDark ? "text-zinc-500" : "text-zinc-600"}
                            group-focus-within:text-(--accent)
                          `}
                        />
                      </div>

                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, email: e.target.value }))
                        }
                        placeholder="chef@indian-swad.fr"
                        className={`
                          w-full pl-12 sm:pl-14 pr-4 sm:pr-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl outline-none transition-all border
                          focus:ring-4 focus:ring-[var(--accent)]/10 focus:border-[var(--accent)]
                          ${isDark
                            ? "bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                            : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400"}
                        `}
                      />
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    className={`
                      w-full py-4 sm:py-5 rounded-[1rem] sm:rounded-[1.25rem] font-black text-base sm:text-lg transition-all
                      flex items-center justify-center gap-3
                      bg-[var(--accent)] text-white
                      hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100
                      shadow-[0_15px_30px_rgba(var(--accent-rgb),0.25)]
                    `}
                  >
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        Recevoir le code <ArrowLeft className="w-5 h-5 rotate-180" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`
                      relative overflow-hidden p-5 rounded-2xl flex gap-4 items-start border
                      backdrop-blur-sm shadow-lg
                      ${isDark
                        ? "bg-rose-500/10 border-rose-500/20"
                        : "bg-rose-50 border-rose-200"
                      }
                    `}
                  >
                    {/* Soft glow behind icon */}
                    <div
                      className={`
                        absolute -left-6 -top-6 w-20 h-20 rounded-full blur-2xl opacity-30
                        ${isDark ? "bg-rose-500/40 text-white" : "bg-rose-400/40 text-black"}
                      `}
                    />

                    {/* Icon */}
                    <div
                      className={`
                        p-2 rounded-xl shrink-0 relative z-10
                        ${isDark ? "bg-rose-500/20" : "bg-rose-200"}
                      `}
                    >
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 relative z-10">
                      <p
                        className={`
                          text-sm font-bold leading-relaxed
                          ${isDark ? "text-rose-300" : "text-rose-700"}
                        `}
                      >
                        {error}
                      </p>

                      {/* Optional subtle hint */}
                      <p
                        className={`
                          text-[11px] mt-1 font-semibold tracking-wide uppercase
                          ${isDark ? "text-rose-500/60" : "text-rose-600/60"}
                        `}
                      >
                        Veuillez réessayer
                      </p>
                    </div>
                  </motion.div>
                )}

              </motion.div>
            ) : (
              <motion.div
                key="step2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-12"
              >
                {/* HEADER */}
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -12 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    className={`
                      mx-auto w-20 h-20 rounded-3xl flex items-center justify-center
                      bg-(--accent)/10 shadow-sm
                    `}
                  >
                    <KeyRound className="w-10 h-10 text-(--accent)" />
                  </motion.div>

                  <h2
                    className={`
                      text-3xl font-black tracking-tight
                      ${isDark ? "text-white" : "text-zinc-900"}
                    `}
                  >
                    Vérification
                  </h2>

                  <p
                    className={`
                      text-sm max-w-xs mx-auto leading-relaxed
                      ${isDark ? "text-zinc-400" : "text-zinc-600"}
                    `}
                  >
                    Entrez les 6 chiffres envoyés à{" "}
                    <span className={isDark ? "text-white font-semibold" : "text-zinc-900 font-semibold"}>
                      {formData.email}
                    </span>
                  </p>
                </div>

                {/* OTP INPUTS */}
                <div className="flex justify-between gap-2 sm:gap-3 max-w-sm mx-auto">
                  {otp.map((digit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="relative group flex-1"
                    >
                      <input
                        ref={(el: HTMLInputElement | null) => {
                          otpRefs.current[i] = el;
                          return undefined;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={handlePaste}
                        className={`
                          w-full h-12 sm:h-16 text-center text-xl sm:text-3xl font-black rounded-[1rem] sm:rounded-2xl outline-none transition-all
                          border focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10
                          ${isDark
                            ? "bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                            : "bg-white border-black/10 text-zinc-900 placeholder:text-zinc-400"
                          }
                          ${digit ? "text-[var(--accent)] border-[var(--accent)]/50 bg-[var(--accent)]/5 shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]" : "shadow-sm"}
                        `}
                      />

                      {/* Dot indicator */}
                      {!digit && (
                        <div
                          className={`
                            absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full transition-colors
                            ${isDark ? "bg-white/20 group-focus-within:bg-[var(--accent)]" : "bg-black/20 group-focus-within:bg-[var(--accent)]"}
                          `}
                        />
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* ACTIONS */}
                <div className="space-y-8">
                  {/* VERIFY BUTTON */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleVerifyCode()}
                    disabled={isLoading || otp.join("").length < 6}
                    className={`
                      w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3
                      shadow-xl
                      ${isDark
                        ? "bg-white text-black hover:bg-zinc-200 shadow-black/20"
                        : "bg-black text-white hover:bg-zinc-800 shadow-black/30"
                      }
                      disabled:opacity-30 disabled:hover:bg-inherit
                    `}
                  >
                    {isLoading ? (
                      <Loader2
                        className={`
                          w-7 h-7 animate-spin mx-auto
                          ${isDark ? "text-black" : "text-white"}
                        `}
                      />
                    ) : (
                      "Finaliser la connexion"
                    )}
                  </motion.button>

                  {/* RESEND CODE */}
                  <div className="flex flex-col items-center gap-4">
                    <button
                      disabled={resendCooldown > 0 || isLoading}
                      onClick={handleResend}
                      className={`
                        group text-sm font-bold transition-all flex items-center gap-2.5
                        ${isDark
                          ? "text-zinc-500 hover:text-white disabled:text-zinc-700"
                          : "text-zinc-600 hover:text-black disabled:text-zinc-400"
                        }
                      `}
                    >
                      <div
                        className={`
                          p-1.5 rounded-lg border flex items-center justify-center transition-all
                          ${isDark
                            ? "border-white/5 group-hover:border-white/20 group-hover:bg-white/5"
                            : "border-black/10 group-hover:border-black/20 group-hover:bg-black/5"
                          }
                        `}
                      >
                        {resendCooldown > 0 ? (
                          <div className="relative w-4 h-4 flex items-center justify-center">
                            <span className="text-[10px] font-black text-(--accent)">{resendCooldown}</span>

                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                              <circle
                                cx="50%" cy="50%" r="7"
                                fill="none" strokeWidth="2"
                                className={isDark ? "text-white/5" : "text-black/10"}
                              />
                              <circle
                                cx="50%" cy="50%" r="7"
                                fill="none" strokeWidth="2"
                                className="text-(--accent)"
                                strokeDasharray="44"
                                strokeDashoffset={44 * (1 - resendCooldown / 30)}
                              />
                            </svg>
                          </div>
                        ) : (
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        )}
                      </div>

                      {resendCooldown > 0 ? "Code renvoyé" : "Renvoyer un nouveau code"}
                    </button>

                    {resendCooldown > 0 && (
                      <p
                        className={`
                          text-[10px] font-bold uppercase tracking-widest
                          ${isDark ? "text-zinc-600" : "text-zinc-500"}
                        `}
                      >
                        Sécurité active • Patientez {resendCooldown}s
                      </p>
                    )}
                  </div>
                </div>
                {error && (
                  <motion.div
                    variants={shakeVariants}
                    animate="shake"
                    initial={{ opacity: 0, scale: 0.95 }}
                    className={`
                      p-5 rounded-2xl flex gap-4 items-center border
                      ${isDark
                        ? "bg-rose-500/10 border-rose-500/20 text-white shadow-[0_0_20px_rgba(255,0,0,0.1)]"
                        : "bg-rose-100 border-rose-300 text-black shadow-[0_0_20px_rgba(255,0,0,0.05)]"
                      }
                    `}
                  >
                    <div
                      className={`
                        p-2 rounded-xl
                        ${isDark ? "bg-rose-500/20" : "bg-rose-300"}
                      `}
                    >
                      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    </div>

                    <p
                      className={`
                        text-sm font-bold
                        ${isDark ? "text-rose-400" : "text-rose-700"}
                      `}
                    >
                      {error}
                    </p>
                  </motion.div>
                )}
              </motion.div>

            )}
          </AnimatePresence>

          {/* Switch Link */}
          {!success && step === 1 && (
            <motion.div
              variants={itemVariants}
              className={`
                mt-10 pt-6 text-center transition-all
                border-t
                ${isDark ? "border-white/5" : "border-zinc-200"}
              `}
            >
              <p
                className={`
                  text-sm font-bold tracking-wide uppercase
                  ${isDark ? "text-zinc-500" : "text-zinc-600"}
                `}
              >
                {mode === "signin" ? "Nouveau client ?" : "Déjà un compte ?"}

                <button
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setError("");
                  }}
                  className={`
                    ml-2 font-black underline-offset-4 decoration-2 transition-all
                    ${isDark
                      ? "text-white hover:text-(--accent) decoration-(--accent)"
                      : "text-zinc-900 hover:text-(--accent) decoration-(--accent)"
                    }
                  `}
                >
                  {mode === "signin" ? "S'inscrire" : "Se connecter"}
                </button>
              </p>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
}