import SearchClient from "./SearchClient";
import { MENU_DATA } from "@/data/menu";
import { Metadata } from "next";

export async function generateMetadata(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  }
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const itemId = searchParams?.item;
  
  if (!itemId) {
    return {
      title: "Menu & Recherche | INDIAN NEPALI SWAD",
      description: "Explorez notre menu complet, recherchez vos plats préférés et laissez des avis.",
    };
  }

  const item = MENU_DATA.find(m => m.id === Number(itemId));
  if (!item) {
    return { title: "Plat non trouvé | INDIAN NEPALI SWAD" };
  }

  return {
    title: `${item.name.fr} | INDIAN NEPALI SWAD`,
    description: item.description.fr,
    openGraph: {
      title: `${item.name.fr} - INDIAN NEPALI SWAD`,
      description: item.description.fr,
      images: [item.image],
    },
    twitter: {
      card: "summary_large_image",
      title: item.name.fr,
      description: item.description.fr,
      images: [item.image],
    }
  };
}

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const itemId = searchParams?.item;
  const item = itemId ? MENU_DATA.find(m => m.id === Number(itemId)) : null;

  return (
    <>
      {item && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              name: item.name.fr,
              image: item.image,
              description: item.description.fr,
              brand: {
                "@type": "Brand",
                name: "INDIAN NEPALI SWAD"
              },
              offers: {
                "@type": "Offer",
                priceCurrency: "EUR",
                price: item.prices[0],
                availability: "https://schema.org/InStock",
                seller: {
                  "@type": "Organization",
                  name: "INDIAN NEPALI SWAD"
                }
              }
            })
          }}
        />
      )}
      <SearchClient />
    </>
  );
}
