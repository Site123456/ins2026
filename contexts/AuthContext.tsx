'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthModal from '@/components/AuthModal';
import { useTheme } from '@/components/hooks/useTheme';

interface User {
  email: string;
  name: string;
  subscribedAt: string;
  newsletterSubscribed: boolean;
  favorites?: number[];
  lastLoginAt?: string;
  loginCount?: number;
}

type AuthMode = 'signin' | 'signup' | 'newsletter';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;

  requestCode: (email: string, type: AuthMode, name?: string, language?: string) => Promise<{ success: boolean; error?: string; isDirectLogin?: boolean }>;
  verifyCode: (email: string, code: string, type: AuthMode) => Promise<{ success: boolean; error?: string }>;
  toggleFavorite: (itemId: number) => Promise<boolean>;
  getFavorites: () => number[]; // Helper to get merged favorites

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
  const [guestFavorites, setGuestFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const { isDark } = useTheme();

  // ------------------------------------------------------------
  // Helper: Persist Encrypted Session
  // ------------------------------------------------------------
  const persistSession = async (payload: NonNullable<User>) => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'encrypt', payload })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) localStorage.setItem('ins_session_token', data.token);
      }
    } catch (e) {
      console.error('Session persistence failed', e);
    }
  };

  // ------------------------------------------------------------
  // Helper: Sync Guest Favorites
  // ------------------------------------------------------------
  const syncGuestFavoritesOnLogin = async (loggedUser: User) => {
    const rawGuestFavs = localStorage.getItem('ins_guest_favorites');
    if (!rawGuestFavs) return;
    try {
      const gFavs: number[] = JSON.parse(rawGuestFavs);
      if (gFavs.length > 0) {
        // We do a loop, or better: build a multi-favorite endpoint.
        // For simplicity, we just send all guest favorites continuously.
        // Or send one array in a modified /api/user/favorite endpoint.
        // I will just use a fetch loop for now since it's a small array.
        let currentFavs = [...(loggedUser.favorites || [])];
        for (const id of gFavs) {
          if (!currentFavs.includes(id)) {
            const res = await fetch('/api/user/favorite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: loggedUser.email, itemId: id })
            });
            if (res.ok) {
              const data = await res.json();
              currentFavs = data.favorites;
            }
          }
        }
        const updatedUser = { ...loggedUser, favorites: currentFavs };
        setUser(updatedUser);
        await persistSession(updatedUser);
        localStorage.removeItem('ins_guest_favorites');
        setGuestFavorites([]);
      }
    } catch {}
  };

  // ------------------------------------------------------------
  // 1. Hydrate session on load
  // ------------------------------------------------------------
  useEffect(() => {
    const hydrate = async () => {
      // Load guest favorites
      const gFavs = localStorage.getItem('ins_guest_favorites');
      if (gFavs) {
        try { setGuestFavorites(JSON.parse(gFavs)); } catch {}
      }

      // Check for token
      const token = localStorage.getItem('ins_session_token');
      if (!token) {
        return setLoading(false);
      }

      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'decrypt', token })
        });
        const data = await res.json();

        if (data.success && data.payload) {
          const u = data.payload as User;
          
          // Verify user still exists
          const verifyRes = await fetch(`/api/verify?email=${encodeURIComponent(u.email)}`);
          const verifyData = await verifyRes.json();

          if (verifyData.isSubscribed) {
            setUser(u);
            await syncGuestFavoritesOnLogin(u);
          } else {
            localStorage.removeItem('ins_session_token');
          }
        } else {
          localStorage.removeItem('ins_session_token');
        }
      } catch {
        localStorage.removeItem('ins_session_token');
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------
  // 2. Auth Actions
  // ------------------------------------------------------------
  const requestCode = async (email: string, type: AuthMode, name?: string, language?: string) => {
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type, name, language }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.user) {
          setUser(data.user);
          await persistSession(data.user);
          await syncGuestFavoritesOnLogin(data.user);
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
        await persistSession(data.user);
        await syncGuestFavoritesOnLogin(data.user);
        return { success: true };
      }

      return { success: false, error: data.error || 'Invalid code' };
    } catch {
      return { success: false, error: 'Unexpected error' };
    }
  };

  // ------------------------------------------------------------
  // 3. Profile & Newsletter
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
      await persistSession(updated);
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
      await persistSession(updated);
      return true;
    } catch {
      return false;
    }
  };

  // ------------------------------------------------------------
  // 4. Favorites (Guest + Logged in)
  // ------------------------------------------------------------
  const toggleFavorite = async (itemId: number): Promise<boolean> => {
    if (!user) {
      // Toggle in guest array
      const current = [...guestFavorites];
      const index = current.indexOf(itemId);
      if (index > -1) {
        current.splice(index, 1);
      } else {
        current.push(itemId);
      }
      setGuestFavorites(current);
      localStorage.setItem('ins_guest_favorites', JSON.stringify(current));
      return true;
    }
    
    // Logged in user toggle
    try {
      const res = await fetch('/api/user/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, itemId })
      });
      if (res.ok) {
        const { favorites } = await res.json();
        const updated = { ...user, favorites };
        setUser(updated);
        await persistSession(updated);
        return true;
      }
    } catch(e) { console.error(e); }
    return false;
  };

  const getFavorites = () => {
    if (user) return user.favorites || [];
    return guestFavorites;
  };

  // ------------------------------------------------------------
  // 5. Logout
  // ------------------------------------------------------------
  const signOut = () => {
    setUser(null);
    localStorage.removeItem('ins_session_token');
    
    // Clear old format just in case
    localStorage.removeItem('ins_user');
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
    toggleFavorite,
    getFavorites,
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
