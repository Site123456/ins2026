'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mail, User, CheckCircle, AlertCircle, Loader2, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup' | 'newsletter';
  email?: string;
  isDark: boolean;
  accent: string;
}

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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialMode]);

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
      setTimeout(() => setIsCodeSent(false), 3000);
    } else {
      setError(result.error || 'Failed to send code');
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
          ? 'Bienvenue ! Votre compte a été créé.' 
          : mode === 'newsletter' 
          ? 'Merci ! Inscription à la newsletter réussie.'
          : 'Heureux de vous revoir !'
      );
      setTimeout(() => {
        onClose();
        setFormData({ email: '', name: '' });
        setOtp(['', '', '', '', '', '']);
        setStep(1);
        setSuccess('');
      }, 2000);
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
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    const result = await requestCode(formData.email, mode, formData.name);
    if (result.success) {
      setIsCodeSent(true);
      setResendCooldown(30);
      setTimeout(() => setIsCodeSent(false), 3000);
    }
    setIsLoading(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Code Sent Popup Notification */}
      <AnimatePresence>
        {isCodeSent && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[60] bg-white dark:bg-zinc-900 border border-emerald-500/20 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-3"
          >
            <div className="bg-emerald-500/20 p-1.5 rounded-full">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-sm font-semibold dark:text-white">Code envoyé à votre email !</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`
          relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl
          ${isDark ? 'bg-[#0a0a0f]/95 border-white/10' : 'bg-white/95 border-zinc-200'}
          backdrop-blur-2xl
        `}
      >
        {/* Progress Bar (at very top) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800/20">
          <motion.div 
            className="h-full bg-(--accent)"
            initial={{ width: '0%' }}
            animate={{ width: step === 1 ? '50%' : '100%' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>

        {/* Close & Back Buttons */}
        <div className="flex items-center justify-between p-6 pb-0">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retour
            </button>
          ) : <div />}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-8 pt-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold dark:text-white">
                    {mode === 'signin' ? 'Bon retour' : mode === 'newsletter' ? 'Newsletter' : 'Créer un compte'}
                  </h2>
                  <p className="mt-2 text-zinc-400">
                    {mode === 'signup' 
                      ? 'Rejoignez-nous pour des saveurs exclusives' 
                      : 'Nous vous enverrons un code de vérification'}
                  </p>
                </div>

                <form onSubmit={handleRequestCode} className="space-y-4">
                  {(mode === 'signup' || mode === 'newsletter') && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Nom Complet</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 transition-colors group-focus-within:text-(--accent)" />
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                          placeholder="Votre nom"
                          className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-(--accent)/20 focus:border-(--accent) transition-all outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Adresse Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 transition-colors group-focus-within:text-(--accent)" />
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        placeholder="nom@exemple.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-(--accent)/20 focus:border-(--accent) transition-all outline-none"
                      />
                    </div>
                  </div>

                  <button
                    disabled={isLoading}
                    className="w-full py-4 bg-(--accent) hover:brightness-110 active:scale-[0.98] rounded-2xl text-white font-bold transition-all shadow-lg shadow-(--accent)/20 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Recevoir mon code <ArrowLeft className="w-4 h-4 rotate-180" /></>
                    )}
                  </button>
                </form>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-sm text-rose-400">{error}</p>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <div className="mx-auto w-16 h-16 bg-(--accent)/10 rounded-full flex items-center justify-center mb-4">
                    <KeyRound className="w-8 h-8 text-(--accent)" />
                  </div>
                  <h2 className="text-2xl font-bold">Vérification</h2>
                  <p className="text-zinc-400 text-sm">
                    Entrez le code envoyé à <span className="text-white font-medium">{formData.email}</span>
                  </p>
                </div>

                <div className="flex justify-between gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="decimal"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20 outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => handleVerifyCode()}
                    disabled={isLoading || otp.join('').length < 6}
                    className="w-full py-4 bg-(--accent) hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 rounded-2xl text-white font-bold transition-all shadow-lg"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Vérifier et continuer'}
                  </button>

                  <div className="text-center">
                    <button
                      disabled={resendCooldown > 0 || isLoading}
                      onClick={handleResend}
                      className="text-sm text-zinc-500 hover:text-(--accent) disabled:text-zinc-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      {resendCooldown > 0 ? (
                        <>Renvoyer le code dans {resendCooldown}s</>
                      ) : (
                        <><RefreshCw className="w-3 h-3" /> Renvoyer un code</>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 text-sm text-rose-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3 text-sm text-emerald-400">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    {success}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Switch Link */}
          {step === 1 && (
            <div className={`mt-8 pt-6 border-t ${isDark ? 'border-white/5' : 'border-zinc-100'} text-center`}>
              <p className="text-sm text-zinc-500">
                {mode === 'signin' ? "Pas encore de compte ?" : "Déjà membre ?"}
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="ml-2 font-bold hover:underline transition-all"
                  style={{ color: accent }}
                >
                  {mode === 'signin' ? "S'inscrire" : "Se connecter"}
                </button>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}