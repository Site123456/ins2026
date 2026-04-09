'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ToastHandle";

type Language = 'fr' | 'en';

interface Translations {
  [key: string]: {
    fr: string;
    en: string;
  };
}

// Global dictionary for auth and settings
export const DICTIONARY: Translations = {
  welcomeBack: { fr: "Bon retour", en: "Welcome back" },
  joinMenu: { fr: "Rejoindre", en: "Join" },
  createAccount: { fr: "Créer un compte", en: "Create an account" },
  fullName: { fr: "Identité Complète", en: "Full Name" },
  emailLabel: { fr: "Email", en: "Email" },
  receiveCode: { fr: "Recevoir le code", en: "Receive code" },
  verification: { fr: "Vérification", en: "Verification" },
  enterCode: { fr: "Entrez les 6 chiffres envoyés à", en: "Enter the 6 digits sent to" },
  finalizeLogin: { fr: "Finaliser la connexion", en: "Finalize login" },
  loginSuccess: { fr: "Heureux de vous revoir ! Connexion réussie", en: "Glad to see you again! Login successful" },
  invalidCode: { fr: "Code invalide ou expiré", en: "Invalid or expired code" },
  accountSettings: { fr: "Paramètres du compte", en: "Account Settings" },
  manageProfile: { fr: "Gérez votre profil et vos préférences", en: "Manage your profile and preferences" },
  profileInfo: { fr: "Informations du Profil", en: "Profile Information" },
  newsletterPrefs: { fr: "Préférences Newsletter", en: "Newsletter Preferences" },
  newsletterDesc: { fr: "Recevez les mises à jour et nouveautés", en: "Receive updates and news" },
  saveChanges: { fr: "Sauvegarder", en: "Save Changes" },
  cancel: { fr: "Annuler", en: "Cancel" },
  saved: { fr: "Enregistré !", en: "Saved!" },
  deleteAccount: { fr: "Supprimer mon compte", en: "Delete my account" },
  deleteWarningTitle: { fr: "Zone de danger", en: "Danger Zone" },
  deleteWarningContent: {
    fr: "Toutes les réservations seront annulées et tous les plats favoris et données liés à ce compte seront définitivement supprimés.",
    en: "All reservations will be canceled and all favorite dishes and data related to this account will be permanently deleted."
  },
  reqDeleteBtn: { fr: "Demander la suppression", en: "Request deletion" },
  deleteSuccess: { fr: "Un email de confirmation vous a été envoyé.", en: "A confirmation email has been sent to you." },
  signInBtn: { fr: "Se connecter", en: "Sign in" },
  signUpBtn: { fr: "S'inscrire / Newsletter", en: "Sign up / Newsletter" },
  settingsBtn: { fr: "Paramètres", en: "Settings" },
  logoutBtn: { fr: "Déconnexion", en: "Logout" },
  cookiesusage: { fr: "Nous utilisons des cookies pour améliorer votre expérience. En continuant, vous acceptez notre politique de confidentialité.", en: "We use cookies to improve your experience. By continuing, you agree to our privacy policy." }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof DICTIONARY) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, initialLang = 'fr' }: { children: ReactNode, initialLang?: Language }) {
  const [language, setLanguage] = useState<Language>(initialLang);
  const { push } = useToast();
  useEffect(() => {
    // Attempt auto-detect on mount if no explicit language in local storage
    const stored = localStorage.getItem('ins_lang') as Language;
    if (stored && (stored === 'fr' || stored === 'en')) {
      setLanguage(stored);
    } else {
      const browserLang = navigator.language.startsWith('fr') ? 'fr' : 'en';
      setLanguage(browserLang);
      // Toast
      push?.("info", t("cookiesusage") + "\n" + (browserLang === 'en' ? "Language set to English go to settings to change it." : "Langue réglée sur le français, allez dans les paramètres pour la changer."));
      localStorage.setItem('ins_lang', browserLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('ins_lang', lang);
  };

  const t = (key: keyof typeof DICTIONARY): string => {
    if (!DICTIONARY[key]) return key as string;
    return DICTIONARY[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
