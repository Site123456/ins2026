import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import Slidercomponent from "./slider";
import { CinematicProvider } from "@/components/CinematicProvider";
import { ToastProvider } from "@/components/ToastHandle";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.indian-nepaliswad.fr"),

  title: {
    default: "INDIAN NEPALI SWAD — Cuisine Indienne & Népalaise Authentique",
    template: "%s | INDIAN NEPALI SWAD",
  },

  description:
    "INDIAN NEPALI SWAD vous propose une cuisine indienne et népalaise authentique, préparée avec des épices traditionnelles, des recettes maison et des saveurs venues directement du sous-continent. Découvrez nos currys, biryanis, momos, grillades tandoori et spécialités végétariennes.",

  keywords: [
    "restaurant indien",
    "restaurant népalais",
    "cuisine indienne",
    "cuisine népalaise",
    "momos",
    "tandoori",
    "biryanis",
    "currys indiens",
    "gastronomie indienne",
    "gastronomie népalaise",
    "restaurant Paris",
    "INDIAN NEPALI SWAD",
  ],

  alternates: {
    canonical: "https://www.indian-nepaliswad.fr",
    languages: {
      "fr-FR": "https://www.indian-nepaliswad.fr",
    },
  },

  authors: [{ name: "INDIAN NEPALI SWAD", url: "https://www.indian-nepaliswad.fr" }],
  creator: "INDIAN NEPALI SWAD",
  publisher: "INDIAN NEPALI SWAD",
  category: "restaurant",
  classification: "Cuisine Indienne, Cuisine Népalaise, Gastronomie",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: [
      { url: "/etc/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/etc/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/etc/logo.png", sizes: "any", type: "image/png" },
    ],
    shortcut: "/etc/logo.png",
    apple: [{ url: "/etc/logo.png", sizes: "180x180", type: "image/png" }],
  },

  manifest: "/manifest.json",

  openGraph: {
    title: "INDIAN NEPALI SWAD — Cuisine Indienne & Népalaise",
    description:
      "Découvrez une cuisine indienne et népalaise authentique : momos, tandoori, currys, biryanis et spécialités traditionnelles préparées avec passion.",
    url: "https://www.indian-nepaliswad.fr",
    siteName: "INDIAN NEPALI SWAD",
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "INDIAN NEPALI SWAD — Cuisine Indienne & Népalaise",
        type: "image/png",
      },
      {
        url: "/etc/logo.png",
        width: 1200,
        height: 1200,
        alt: "INDIAN NEPALI SWAD Logo",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "INDIAN NEPALI SWAD — Cuisine Indienne & Népalaise",
    description:
      "Restaurant indien et népalais proposant des plats traditionnels : momos, currys, biryanis, grillades tandoori et spécialités végétariennes.",
    images: {
      url: "/banner.png",
      alt: "INDIAN NEPALI SWAD — Cuisine Indienne & Népalaise",
    },
    site: "@indiannepaliswad",
    creator: "@indiannepaliswad",
  },

  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "INDIAN NEPALI SWAD",
    "application-name": "INDIAN NEPALI SWAD",
    "msapplication-TileColor": "#010104",
    "msapplication-tap-highlight": "no",
    "og:email": "contact@indian-nepaliswad.fr",
    "og:country-name": "France",
    rating: "general",
    distribution: "global",
    referrer: "origin-when-cross-origin",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#010104" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
  colorScheme: "dark light",
};

function StructuredData() {
  const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "INDIAN NEPALI SWAD",
    url: "https://www.indian-nepaliswad.fr",
    logo: "https://www.indian-nepaliswad.fr/etc/logo.png",
    image: "https://www.indian-nepaliswad.fr/banner.png",
    servesCuisine: ["Indienne", "Népalaise"],
    description:
      "Restaurant indien et népalais proposant des plats traditionnels : momos, currys, biryanis, tandoori et spécialités végétariennes.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "",
      addressLocality: "",
      postalCode: "",
      addressCountry: "FR",
    },
    telephone: "",
    sameAs: [
      "https://www.facebook.com/",
      "https://www.instagram.com/",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "INDIAN NEPALI SWAD",
    url: "https://www.indian-nepaliswad.fr",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://www.indian-nepaliswad.fr/search/{search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="auto" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <StructuredData />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </head>

      <body
        className="antialiased bg-[#010104] text-neutral-50 min-h-screen"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-9999 focus:px-4 focus:py-2 focus:bg-red-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
        >
          Aller au contenu principal
        </a>

        <CinematicProvider>
          <ToastProvider>
            <Slidercomponent>
              <div id="main-content" role="main">
                {children}
              </div>
            </Slidercomponent>
          </ToastProvider>
        </CinematicProvider>
      </body>
    </html>
  );
}
