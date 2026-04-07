'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthModal from '@/components/AuthModal';
import { useTheme } from '@/components/hooks/useTheme';

interface User {
  email: string;
  name: string;
  subscribedAt: string;
  newsletterSubscribed: boolean;
  lastLoginAt?: string;
  loginCount: number;
}

type AuthMode = 'signin' | 'signup' | 'newsletter';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;

  requestCode: (email: string, type: AuthMode, name?: string) => Promise<{ success: boolean; error?: string }>;
  verifyCode: (email: string, code: string, type: AuthMode) => Promise<{ success: boolean; error?: string }>;

  signOut: () => void;
  updateNewsletterSubscription: (subscribed: boolean) => Promise<boolean>;
  updateProfile: (name: string) => Promise<boolean>;

  loading: boolean;

  isModalOpen: boolean;
  modalMode: AuthMode;
  modalEmail: string;
  openAuthModal: (mode?: AuthMode, email?: string) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { isDark } = useTheme();

  // ------------------------------------------------------------
  // 1. Read cookie session (magic link)
  // ------------------------------------------------------------
  const readCookieSession = () => {
    try {
      const raw = document.cookie
        .split('; ')
        .find((row) => row.startsWith('ins_user='));

      if (!raw) return null;

      return JSON.parse(decodeURIComponent(raw.split('=')[1]));
    } catch {
      return null;
    }
  };

  // ------------------------------------------------------------
  // 2. Hydrate session on load
  // ------------------------------------------------------------
  useEffect(() => {
    const hydrate = async () => {
      try {
        // A. Magic-link cookie session
        const cookieUser = readCookieSession();
        if (cookieUser) {
          setUser(cookieUser);
          localStorage.setItem('ins_user', JSON.stringify(cookieUser));
          return setLoading(false);
        }

        // B. LocalStorage fallback
        const stored = localStorage.getItem('ins_user');
        if (!stored) return setLoading(false);

        const parsed = JSON.parse(stored);

        // Verify user still exists
        const res = await fetch(`/api/verify?email=${encodeURIComponent(parsed.email)}`);
        const data = await res.json();

        if (data.isSubscribed) {
          setUser(parsed);
        } else {
          localStorage.removeItem('ins_user');
        }
      } catch {
        localStorage.removeItem('ins_user');
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, []);

  // ------------------------------------------------------------
  // 3. Auth Actions
  // ------------------------------------------------------------
  const requestCode = async (email: string, type: AuthMode, name?: string) => {
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type, name }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('ins_user', JSON.stringify(data.user));
          return { success: true, isDirectLogin: true };
        }
        return { success: true };
      }
      return { success: false, error: data.error || data.message || 'Failed to request' };
    } catch {
      return { success: false, error: 'Unexpected error' };
    }
  };

  const verifyCode = async (email: string, code: string, type: AuthMode) => {
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, type }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('ins_user', JSON.stringify(data.user));
        return { success: true };
      }

      return { success: false, error: data.error || 'Invalid code' };
    } catch {
      return { success: false, error: 'Unexpected error' };
    }
  };

  // ------------------------------------------------------------
  // 4. Profile & Newsletter
  // ------------------------------------------------------------
  const updateNewsletterSubscription = async (subscribed: boolean) => {
    if (!user) return false;

    try {
      const res = await fetch('/api/user/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, subscribed }),
      });

      if (!res.ok) return false;

      const updated = { ...user, newsletterSubscribed: subscribed };
      setUser(updated);
      localStorage.setItem('ins_user', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  const updateProfile = async (name: string) => {
    if (!user) return false;

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name }),
      });

      if (!res.ok) return false;

      const updated = { ...user, name };
      setUser(updated);
      localStorage.setItem('ins_user', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  // ------------------------------------------------------------
  // 5. Logout
  // ------------------------------------------------------------
  const signOut = () => {
    setUser(null);
    localStorage.removeItem('ins_user');

    // Clear cookie
    document.cookie = "ins_user=; Max-Age=0; path=/; secure; sameSite=strict;";
  };

  // ------------------------------------------------------------
  // 6. Modal Controls
  // ------------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AuthMode>('signin');
  const [modalEmail, setModalEmail] = useState('');

  const openAuthModal = (mode: AuthMode = 'signin', email = '') => {
    setModalMode(mode);
    setModalEmail(email);
    setIsModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsModalOpen(false);
    setModalEmail('');
  };

  // ------------------------------------------------------------
  // 7. Context Value
  // ------------------------------------------------------------
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    requestCode,
    verifyCode,
    signOut,
    updateNewsletterSubscription,
    updateProfile,
    loading,
    isModalOpen,
    modalMode,
    modalEmail,
    openAuthModal,
    closeAuthModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}

      <AuthModal
        isOpen={isModalOpen}
        onClose={closeAuthModal}
        mode={modalMode}
        email={modalEmail}
        isDark={isDark}
        accent="#8b5cf6"
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
