'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Bell, BellOff, Save, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  accent: string;
}

export default function SettingsModal({ isOpen, onClose, isDark, accent }: SettingsModalProps) {
  const { user, updateNewsletterSubscription, updateProfile, signOut } = useAuth();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    newsletterSubscribed: true,
  });

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
      // Initialize form with user data
      if (user) {
        setFormData({
          name: user.name,
          newsletterSubscribed: user.newsletterSubscribed,
        });
      }
    } else {
      setIsAnimating(false);
      document.body.style.overflow = 'unset';
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setSuccess('');

    try {
      // Update profile name if changed
      if (formData.name !== user.name) {
        const profileSuccess = await updateProfile(formData.name);
        if (!profileSuccess) {
          throw new Error('Failed to update profile');
        }
      }

      // Update newsletter subscription if changed
      if (formData.newsletterSubscribed !== user.newsletterSubscribed) {
        const newsletterSuccess = await updateNewsletterSubscription(formData.newsletterSubscribed);
        if (!newsletterSuccess) {
          throw new Error('Failed to update newsletter subscription');
        }
      }

      setSuccess(t('saved'));
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Settings update error:', error);
      // Error will be handled by the context
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDelete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/request-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      if (res.ok) {
        setSuccess(t('deleteSuccess'));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isVisible || !user) return null;

  return (
    <div className="fixed inset-0 z-[102] flex items-center justify-center p-4">
      {/* Animated backdrop */}
      <div
        className={`
          absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300
          ${isAnimating ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleClose}
      />

      <div
        className={`
          relative w-full max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden
          transform transition-all duration-300 ease-out custom-scrollbar
          rounded-2xl border p-6 shadow-2xl backdrop-blur-2xl
          ${isDark ? 'bg-[#0a0a0f]/95 border-white/10' : 'bg-white/95 border-zinc-200'}
          ${isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
          }
        `}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className={`
            absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg z-10
            transition-all duration-200 hover:bg-zinc-100/10 hover:rotate-90
            ${isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600 hover:text-zinc-700'}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {t('accountSettings')}
          </h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {t('manageProfile')}
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-4 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-300 text-sm font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="animate-in slide-in-from-left-2 duration-300 delay-100">
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              {t('profileInfo')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {t('fullName')}
                </label>
                <div className="relative group">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${isDark ? 'text-zinc-400 group-focus-within:text-zinc-300' : 'text-zinc-500 group-focus-within:text-zinc-600'}`} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`
                      w-full pl-10 pr-4 py-3 rounded-xl border text-sm
                      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
                      ${isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-zinc-400 focus:border-white/20 focus:ring-white/20 focus:ring-offset-[#0a0a0f]'
                        : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-500 focus:border-zinc-300 focus:ring-zinc-200 focus:ring-offset-white'
                      }
                    `}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                  <input
                    type="email"
                    value={user.email}
                    className={`
                      w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-gray-50
                      ${isDark
                        ? 'bg-white/5 border-white/10 text-zinc-400'
                        : 'bg-gray-50 border-zinc-200 text-zinc-500'
                      }
                    `}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="animate-in slide-in-from-left-2 duration-300 delay-200">
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              {t('newsletterPrefs')}
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border transition-colors hover:bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  {formData.newsletterSubscribed ? (
                    <Bell className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  ) : (
                    <BellOff className={`h-5 w-5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      Newsletter
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {t('newsletterDesc')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, newsletterSubscribed: !prev.newsletterSubscribed }))}
                  disabled={loading}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${formData.newsletterSubscribed
                      ? 'bg-emerald-500'
                      : isDark ? 'bg-zinc-600' : 'bg-zinc-300'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${formData.newsletterSubscribed ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-8 flex gap-3 animate-in slide-in-from-bottom-2 duration-300 delay-300">
            <button
              onClick={handleClose}
              disabled={loading}
              className={`
              flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200
              ${isDark
                  ? 'text-zinc-300 bg-white/5 border border-white/10 hover:bg-white/10'
                  : 'text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50'
                }
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={loading || success !== ''}
              className={`
              flex-1 py-3 rounded-xl text-sm font-semibold text-white
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]
              ${isDark ? 'focus:ring-offset-[#0a0a0f]' : 'focus:ring-offset-white'}
              ${success ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            `}
              style={success ? {} : {
                background: `linear-gradient(to right, ${accent}, ${accent}dd)`,
                boxShadow: `0 4px 16px ${accent}40`,
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : success ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {t('saved')}
                </div>
              ) : (
                t('saveChanges')
              )}
            </button>
          </div>
          <div className="mt-8 border-t border-rose-500/20 pt-6 animate-in slide-in-from-bottom-2 duration-300">
            <h3 className={`flex items-center gap-2 text-lg font-bold text-rose-500 mb-4`}>
              <AlertTriangle className="h-5 w-5" />
              {t('deleteWarningTitle')}
            </h3>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200'}`}>
              <p className={`text-sm mb-4 ${isDark ? 'text-rose-200/80' : 'text-rose-800/80'}`}>
                {t('deleteWarningContent')}
              </p>
              <button
                onClick={handleRequestDelete}
                disabled={loading || success !== ''}
                className="w-full py-3 rounded-xl text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {t('reqDeleteBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}