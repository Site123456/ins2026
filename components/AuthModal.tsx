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

export default function AuthModal({ isOpen, onClose, mode: initialMode, email: initialEmail = '', isDark, accent }: AuthModalProps) {
  const { requestCode, verifyCode, user } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup' | 'newsletter'>(initialMode);
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isCodeSent, setIsCodeSent] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setMode(initialMode);
      setFormData(prev => ({ ...prev, email: initialEmail || prev.email }));
      setStep(1);
      setError('');
      setSuccess('');
      setIsCodeSent(false);
      setOtp(['', '', '', '', '', '']);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialMode, initialEmail]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await requestCode(formData.email, mode, formData.name);
    
    if (result.success) {
      setStep(2);
      setIsCodeSent(true);
      setResendCooldown(30);
      setTimeout(() => setIsCodeSent(false), 4000);
    } else {
      setError(result.error || 'Échec de l\'envoi du code');
    }
    setIsLoading(false);
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;

    setIsLoading(true);
    setError('');

    const result = await verifyCode(formData.email, code, mode);
    
    if (result.success) {
      setSuccess(
        mode === 'signup' 
          ? 'Bienvenue ! Votre compte a été créé avec succès ✨' 
          : mode === 'newsletter' 
          ? 'Merci ! Inscription à la newsletter réussie 📧'
          : 'Heureux de vous revoir ! Connexion réussie 🔓'
      );
      setTimeout(() => {
        onClose();
        setFormData({ email: '', name: '' });
        setOtp(['', '', '', '', '', '']);
        setStep(1);
        setSuccess('');
      }, 2500);
    } else {
      setError(result.error || 'Code invalide ou expiré');
    }
    setIsLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(v => v !== '') && index === 5) {
      handleVerifyCode();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setError('');
    const result = await requestCode(formData.email, mode, formData.name);
    if (result.success) {
      setIsCodeSent(true);
      setResendCooldown(30);
      setTimeout(() => setIsCodeSent(false), 4000);
    } else {
      setError(result.error || 'Échec du renvoi');
    }
    setIsLoading(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with sophisticated blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Code Sent Toast Notification */}
      <AnimatePresence>
        {isCodeSent && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[70] bg-zinc-900 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)] rounded-2xl px-6 py-4 flex items-center gap-4"
          >
            <div className="bg-emerald-500/20 p-2 rounded-full">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Code de sécurité envoyé !</p>
              <p className="text-xs text-zinc-400 mt-1">Consultez votre boîte mail {formData.email}</p>
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
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_120deg,(--accent)_180deg,transparent_240deg,transparent_360deg)] animate-[spin_8s_linear_infinite]" />
        </div>

        {/* Progress Bar (at very top) */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/10">
          <motion.div 
            className="h-full bg-(--accent) shadow-[0_0_12px_var(--accent)]"
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
                <motion.div variants={itemVariants}>
                  <h2 className="text-4xl font-black dark:text-white tracking-tight">
                    {mode === 'signin' ? 'Bon retour' : mode === 'newsletter' ? 'Rejoindre' : 'Créer un compte'}
                  </h2>
                  <p className="mt-3 text-zinc-400 text-lg">
                    {mode === 'signup' 
                      ? 'Réservez votre place au sommet de la gastronomie.' 
                      : 'L\'excellence indienne à portée de clic.'}
                  </p>
                </motion.div>

                <motion.form variants={itemVariants} onSubmit={handleRequestCode} className="space-y-5">
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest ml-1">Identité Complète</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-white/5 border border-white/5 group-focus-within:border-(--accent)/30 transition-all">
                        <User className="w-4 h-4 text-zinc-500 group-focus-within:text-(--accent)" />
                      </div>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="Prénom & Nom"
                        className="w-full pl-14 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-(--accent)/10 focus:border-(--accent) transition-all outline-none text-white placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest ml-1">Email</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-white/5 border border-white/5 group-focus-within:border-(--accent)/30 transition-all">
                        <Mail className="w-4 h-4 text-zinc-500 group-focus-within:text-(--accent)" />
                      </div>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        placeholder="chef@indian-swad.fr"
                        className="w-full pl-14 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-(--accent)/10 focus:border-(--accent) transition-all outline-none text-white placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    className="w-full py-5 bg-(--accent) hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 rounded-[1.25rem] text-white font-black text-lg transition-all shadow-[0_20px_40px_rgba(239,68,68,0.25)] flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>Recevoir le code <ArrowLeft className="w-5 h-5 rotate-180" /></>
                    )}
                  </motion.button>
                </motion.form>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      variants={shakeVariants}
                      animate="shake"
                      initial={{ opacity: 0, y: 10 }}
                      className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-4 items-center"
                    >
                      <div className="bg-rose-500/20 p-2 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      </div>
                      <p className="text-sm font-bold text-rose-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-10"
              >
                <div className="text-center space-y-4">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mx-auto w-20 h-20 bg-(--accent)/10 rounded-[2rem] flex items-center justify-center mb-2 rotate-12"
                  >
                    <KeyRound className="w-10 h-10 text-(--accent)" />
                  </motion.div>
                  <h2 className="text-3xl font-black">Vérification</h2>
                  <p className="text-zinc-400 text-sm max-w-[280px] mx-auto leading-relaxed">
                    Saisissez les 6 chiffres envoyés à <span className="text-white font-black break-all">{formData.email}</span>
                  </p>
                </div>

                <div className="flex justify-between gap-2.5">
                  {otp.map((digit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="relative group flex-1"
                    >
                      <input
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="decimal"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className={`
                          w-full h-16 text-center text-3xl font-black bg-white/5 border border-white/10 rounded-2xl 
                          focus:border-(--accent) focus:ring-4 focus:ring-(--accent)/10 outline-none transition-all
                          ${digit ? 'text-(--accent) border-(--accent)/50 bg-(--accent)/5' : 'text-white'}
                        `}
                      />
                      {digit === '' && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/20 group-focus-within:bg-(--accent) transition-colors" />
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleVerifyCode()}
                    disabled={isLoading || otp.join('').length < 6}
                    className="w-full py-5 bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white rounded-[1.25rem] font-black text-lg transition-all shadow-xl shadow-black/20"
                  >
                    {isLoading ? <Loader2 className="w-7 h-7 animate-spin mx-auto text-black" /> : 'Finaliser la connexion'}
                  </motion.button>

                  <div className="flex flex-col items-center gap-4">
                    <button
                      disabled={resendCooldown > 0 || isLoading}
                      onClick={handleResend}
                      className="group text-sm font-bold text-zinc-500 hover:text-white disabled:text-zinc-700 transition-all flex items-center gap-2.5"
                    >
                      <div className={`p-1.5 rounded-lg border border-white/5 flex items-center justify-center ${resendCooldown > 0 ? '' : 'group-hover:border-white/20 group-hover:bg-white/5'}`}>
                        {resendCooldown > 0 ? (
                          <div className="relative w-4 h-4 flex items-center justify-center">
                            <span className="text-[10px] font-black text-(--accent)">{resendCooldown}</span>
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                              <circle 
                                cx="50%" cy="50%" r="7" 
                                fill="none" stroke="currentColor" strokeWidth="2" 
                                className="text-white/5"
                              />
                              <circle 
                                cx="50%" cy="50%" r="7" 
                                fill="none" stroke="currentColor" strokeWidth="2" 
                                className="text-(--accent)"
                                strokeDasharray="44"
                                strokeDashoffset={44 * (1 - resendCooldown / 30)}
                              />
                            </svg>
                          </div>
                        ) : (
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        )}
                      </div>
                      {resendCooldown > 0 ? 'Code renvoyé' : 'Renvoyer un nouveau code'}
                    </button>
                    
                    {resendCooldown > 0 && (
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                        Sécurité active • Patientez {resendCooldown}s
                      </p>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      variants={shakeVariants}
                      animate="shake"
                      initial={{ opacity: 0, scale: 0.95 }}
                      className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-4 items-center"
                    >
                      <div className="bg-rose-500/20 p-2 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      </div>
                      <p className="text-sm font-bold text-rose-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Switch Link */}
          {!success && step === 1 && (
            <motion.div 
              variants={itemVariants}
              className={`mt-10 pt-6 border-t ${isDark ? 'border-white/5' : 'border-zinc-100'} text-center`}
            >
              <p className="text-sm font-bold text-zinc-500 tracking-wide uppercase">
                {mode === 'signin' ? "Nouveau client ?" : "Déjà un compte ?"}
                <button
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                  className="ml-2 text-white hover:underline transition-all font-black decoration-2 underline-offset-4 decoration-(--accent)"
                >
                  {mode === 'signin' ? "S'inscrire" : "Se connecter"}
                </button>
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}