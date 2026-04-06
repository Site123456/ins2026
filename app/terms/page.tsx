"use client";

import React, { useState } from "react";
import { useTheme } from "../../components/hooks/useTheme";

const legalContent = {
  fr: {
    title: "Mentions Légales & Politique de Confidentialité",
    updated: "Dernière mise à jour",
    toc: "Sommaire",

    sections: {
      legalNotice: {
        title: "1. Mentions légales",
        text: `Indian Nepali Swad
Adresse : 4 rue Bargue, 75015 Paris, France
Téléphone : +33 1 45 32 73 73
SIRET : (à compléter)
Directeur de publication : (à compléter)`,
      },

      about: {
        title: "2. À propos du site",
        text: `Ce site présente le restaurant Indian Nepali Swad, sa cuisine indienne et népalaise, ses services, ses horaires, et redirige vers des plateformes de commande tierces.`,
      },

      services: {
        title: "3. Services proposés",
        text: `Le site fournit des informations sur le menu, les services, les horaires, et permet d'accéder à des plateformes de livraison externes.`,
      },

      privacyIntro: {
        title: "4. Politique de Confidentialité",
        text: `Cette section explique comment nous collectons, utilisons et protégeons vos données personnelles conformément au RGPD.`,
      },

      purposes: {
        title: "5. Utilisation de vos données personnelles",
        text: `Nous pouvons utiliser vos données personnelles pour les finalités suivantes :

• Fournir et maintenir notre Service.
• Gérer votre compte utilisateur.
• Exécuter un contrat (commandes, achats, services).
• Vous contacter (email, téléphone, SMS, notifications).
• Vous envoyer des offres ou informations similaires à vos demandes.
• Gérer vos requêtes et demandes d’assistance.
• Transferts commerciaux (fusion, acquisition, vente d’actifs).
• Analyses internes, amélioration du Service et de l’expérience utilisateur.`,
      },

      sharing: {
        title: "6. Partage de vos données",
        text: `Nous pouvons partager vos données dans les situations suivantes :

• Avec nos prestataires (analyse, communication, hébergement).
• Dans le cadre d’un transfert commercial.
• Avec nos affiliés (sociétés liées).
• Avec nos partenaires commerciaux.
• Avec d’autres utilisateurs si vous publiez dans des espaces publics.
• Avec votre consentement explicite.`,
      },

      retention: {
        title: "7. Conservation des données",
        text: `Nous conservons vos données uniquement pour la durée nécessaire aux finalités décrites.

Certaines données peuvent être conservées pour :
• Respecter nos obligations légales,
• Résoudre des litiges,
• Faire appliquer nos accords.

Les données d’usage sont conservées plus brièvement, sauf nécessité de sécurité.`,
      },

      transfer: {
        title: "8. Transfert de données",
        text: `Vos données peuvent être transférées hors de votre pays.

Nous garantissons :
• Un niveau de sécurité adéquat,
• Une conformité avec cette politique,
• L’absence de transfert vers des organisations non conformes.`,
      },

      deletion: {
        title: "9. Suppression de vos données",
        text: `Vous pouvez demander la suppression de vos données personnelles.

Vous pouvez :
• Modifier ou supprimer vos informations via votre compte,
• Nous contacter pour demander accès, correction ou suppression.

Certaines données peuvent être conservées si la loi l’exige.`,
      },

      disclosure: {
        title: "10. Divulgation de données",
        text: `Nous pouvons divulguer vos données dans les cas suivants :

• Transactions commerciales,
• Obligations légales,
• Protection de nos droits,
• Prévention d’abus ou de risques.`,
      },

      security: {
        title: "11. Sécurité des données",
        text: `Nous mettons en œuvre des mesures raisonnables pour protéger vos données.

Cependant, aucune méthode n’est totalement sécurisée.`,
      },

      children: {
        title: "12. Données des enfants",
        text: `Notre Service ne s’adresse pas aux moins de 13 ans.

Nous supprimons toute donnée transmise par un mineur dès que nous en avons connaissance.`,
      },

      links: {
        title: "13. Liens externes",
        text: `Notre site peut contenir des liens vers des sites tiers.

Nous ne sommes pas responsables de leurs contenus ou politiques.`,
      },

      changes: {
        title: "14. Modifications",
        text: `Nous pouvons mettre à jour cette politique.

La date de mise à jour sera modifiée en conséquence.`,
      },

      contact: {
        title: "15. Contact",
        text: `Pour toute question concernant cette politique :

Téléphone : +33 1 45 32 73 73`,
      },
    },
  },

  en: {
    title: "Legal Notice & Privacy Policy",
    updated: "Last updated",
    toc: "Table of Contents",

    sections: {
      legalNotice: {
        title: "1. Legal Notice",
        text: `Indian Nepali Swad
Address: 4 rue Bargue, 75015 Paris, France
Phone: +33 1 45 32 73 73
SIRET: (to be added)
Publishing Director: (to be added)`,
      },

      about: {
        title: "2. About This Website",
        text: `This website presents Indian Nepali Swad, its Indian & Nepalese cuisine, services, opening hours, and links to third‑party delivery platforms.`,
      },

      services: {
        title: "3. Services Provided",
        text: `The website provides menu information, service details, opening hours, and access to external delivery platforms.`,
      },

      privacyIntro: {
        title: "4. Privacy Policy",
        text: `This section explains how we collect, use, and protect your personal data in accordance with GDPR.`,
      },

      purposes: {
        title: "5. Use of Your Personal Data",
        text: `We may use your personal data for the following purposes:

• To provide and maintain our Service.
• To manage your user account.
• To perform a contract (orders, purchases, services).
• To contact you (email, phone, SMS, notifications).
• To send offers or information similar to your inquiries.
• To manage your support requests.
• For business transfers (merger, acquisition, asset sale).
• For analytics, service improvement, and user experience optimization.`,
      },

      sharing: {
        title: "6. Sharing Your Data",
        text: `We may share your data in the following situations:

• With service providers (analytics, communication, hosting).
• For business transfers.
• With affiliates (related companies).
• With business partners.
• With other users if you post in public areas.
• With your explicit consent.`,
      },

      retention: {
        title: "7. Data Retention",
        text: `We retain your data only as long as necessary.

Some data may be retained to:
• Comply with legal obligations,
• Resolve disputes,
• Enforce agreements.

Usage data is retained for shorter periods unless required for security.`,
      },

      transfer: {
        title: "8. Data Transfer",
        text: `Your data may be transferred outside your jurisdiction.

We ensure:
• Adequate security,
• Compliance with this policy,
• No transfer to non‑compliant organizations.`,
      },

      deletion: {
        title: "9. Delete Your Data",
        text: `You may request deletion of your personal data.

You may:
• Update or delete your information via your account,
• Contact us for access, correction, or deletion.

Some data may be retained when legally required.`,
      },

      disclosure: {
        title: "10. Disclosure of Data",
        text: `We may disclose your data in the following cases:

• Business transactions,
• Legal obligations,
• Protection of rights,
• Prevention of abuse or risks.`,
      },

      security: {
        title: "11. Data Security",
        text: `We take reasonable measures to protect your data.

However, no method is 100% secure.`,
      },

      children: {
        title: "12. Children's Privacy",
        text: `Our Service is not intended for children under 13.

We delete any data provided by minors as soon as we become aware of it.`,
      },

      links: {
        title: "13. External Links",
        text: `Our site may contain links to third‑party websites.

We are not responsible for their content or policies.`,
      },

      changes: {
        title: "14. Changes",
        text: `We may update this policy.

The “Last updated” date will be modified accordingly.`,
      },

      contact: {
        title: "15. Contact Us",
        text: `For any questions regarding this policy:

Phone: +33 1 45 32 73 73`,
      },
    },
  },
};

/* -------------------------------------------------------
   PAGE COMPONENT
------------------------------------------------------- */

export default function LegalPage() {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const { isDark, hydrated } = useTheme();

  const t = legalContent[lang];
  const sections = Object.values(t.sections);

  if (!hydrated) {
    return <div className="min-h-screen bg-black" />;
  }

  const bg = isDark
    ? "from-black via-zinc-900 to-black"
    : "from-white via-zinc-100 to-white";

  const card = isDark
    ? "bg-white/5 border-white/10"
    : "bg-black/5 border-black/10";

  const text = isDark ? "text-zinc-300" : "text-zinc-700";

  return (
    <main className={`min-h-screen bg-gradient-to-br ${bg} px-6 py-20`}>
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-14">
          <div>
            <h1 className={`text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
              {t.title}
            </h1>
            <p className={`${isDark ? "text-zinc-400" : "text-zinc-600"} text-sm mt-2`}>
              {t.updated}: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* LANGUAGE SWITCH */}
          <div className={`flex gap-2 px-2 py-1 rounded-full border backdrop-blur-md ${
            isDark ? "bg-zinc-800/40 border-zinc-700/50" : "bg-white/60 border-zinc-300"
          }`}>
            {["fr", "en"].map((lng) => (
              <button
                key={lng}
                onClick={() => setLang(lng as "fr" | "en")}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  lang === lng
                    ? isDark
                      ? "bg-white text-black font-semibold"
                      : "bg-black text-white font-semibold"
                    : isDark
                      ? "text-zinc-400 hover:text-white"
                      : "text-zinc-600 hover:text-black"
                }`}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {/* TABLE OF CONTENTS */}
        <aside className={`mb-12 p-6 rounded-2xl backdrop-blur-md border ${card}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-black"}`}>
            {t.toc}
          </h2>
          <ul className="space-y-2">
            {sections.map((s, i) => (
              <li key={i}>
                <a
                  href={`#section-${i}`}
                  className={`transition hover:underline ${text}`}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* SECTIONS */}
        <div className="space-y-14">
          {sections.map((section, i) => (
            <section
              key={i}
              id={`section-${i}`}
              className={`p-8 rounded-2xl backdrop-blur-md border ${card}`}
            >
              <h2 className={`text-2xl font-semibold mb-4 ${isDark ? "text-white" : "text-black"}`}>
                {section.title}
              </h2>
              <p className={`leading-relaxed whitespace-pre-line ${text}`}>
                {section.text}
              </p>
            </section>
          ))}
        </div>

        {/* FOOTER */}
        <footer className={`pt-12 mt-16 border-t text-sm text-center ${
          isDark ? "border-zinc-800 text-zinc-500" : "border-zinc-300 text-zinc-600"
        }`}>
          © {new Date().getFullYear()} Indian Nepali Swad — All rights reserved.
        </footer>
      </div>
    </main>
  );
}
