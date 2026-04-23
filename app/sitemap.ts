import { MetadataRoute } from 'next';
import { MENU_DATA } from '@/data/menu';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://indian-nepaliswad.fr';

  // Base localized routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/fr`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/fr/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/en/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/fr/events`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/en/events`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // Menu item pages for each language
  const menuItems: MetadataRoute.Sitemap = MENU_DATA.map((item) => {
    return [
      {
        url: `${baseUrl}/fr/search?item=${item.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/en/search?item=${item.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }
    ];
  }).flat();

  return [...routes, ...menuItems];
}
