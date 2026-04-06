'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthModal from '@/components/AuthModal';

interface User {
  email: string;
  name: string;
  subscribedAt: string;
  newsletterSubscribed: boolean;
  lastLoginAt?: string;
  loginCount: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  requestCode: (email: string, type: 'signin' | 'signup' | 'newsletter', name?: string) => Promise<{ success: boolean; error?: string }>;
  verifyCode: (email: string, code: string, type: 'signin' | 'signup' | 'newsletter') => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  updateNewsletterSubscription: (subscribed: boolean) => Promise<boolean>;
  updateProfile: (name: string) => Promise<boolean>;
  loading: boolean;
  // Modal controls
  isModalOpen: boolean;
  modalMode: 'signin' | 'signup' | 'newsletter';
  modalEmail: string;
  openAuthModal: (mode?: 'signin' | 'signup' | 'newsletter', email?: string) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for stored auth data (you could use localStorage, cookies, etc.)
        const storedUser = localStorage.getItem('ins_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Verify the user still exists in the database
          const response = await fetch(`/api/verify?email=${encodeURIComponent(userData.email)}`);
          const data = await response.json();

          if (data.isSubscribed) {
            setUser(userData);
          } else {
            localStorage.removeItem('ins_user');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('ins_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const requestCode = async (email: string, type: 'signin' | 'signup' | 'newsletter', name?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type, name }),
      });

      const data = await response.json();
      if (response.ok) {
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to send code' };
    } catch (error) {
      console.error('Request code error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const verifyCode = async (email: string, code: string, type: 'signin' | 'signup' | 'newsletter'): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, type }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('ins_user', JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid code' };
    } catch (error) {
      console.error('Verify code error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const updateNewsletterSubscription = async (subscribed: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/user/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, subscribed }),
      });

      if (response.ok) {
        const updatedUser = { ...user, newsletterSubscribed: subscribed };
        setUser(updatedUser);
        localStorage.setItem('ins_user', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Newsletter update error:', error);
      return false;
    }
  };

  const updateProfile = async (name: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name }),
      });

      if (response.ok) {
        const updatedUser = { ...user, name };
        setUser(updatedUser);
        localStorage.setItem('ins_user', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'signin' | 'signup' | 'newsletter'>('signin');
  const [modalEmail, setModalEmail] = useState('');

  const openAuthModal = (mode: 'signin' | 'signup' | 'newsletter' = 'signin', email: string = '') => {
    setModalMode(mode);
    setModalEmail(email);
    setIsModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsModalOpen(false);
    setModalEmail('');
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('ins_user');
  };

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
        isDark={true}
        accent="#8b5cf6"
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}