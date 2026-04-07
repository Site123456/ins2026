export type Category = 
  | "Menus"
  | "Naan"
  | "Entrées"
  | "Spécialités"
  | "Végétarien"
  | "Chau Min"
  | "Riz"
  | "Desserts"
  | "Softs";

export interface MenuItem {
  id: number;
  name: { fr: string; en: string };
  description: { fr: string; en: string };
  category: Category;
  prices: number[]; // price for 7 zones
  originalPrice?: number; 
  popularity?: number; 
  isVeg?: boolean;
  image: string; // placeholder image
}

const p = (price: number) => Array(7).fill(price);

export const MENU_DATA: MenuItem[] = [
  // --- MENUS ---
  {
    id: 1,
    name: { fr: "Menu Spécial 🫶", en: "Special Menu 🫶" },
    description: { fr: "1 Plat + 1 Riz + 1 Naan", en: "1 Dish + 1 Rice + 1 Naan" },
    category: "Menus",
    prices: p(18.90),
    popularity: 98,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 2,
    name: { fr: "Menu Best Deal 🎉", en: "Best Deal Menu 🎉" },
    description: { fr: "1 Entrée + 1 Plat + 1 Riz + 1 Naan + 1 Boisson", en: "1 Starter + 1 Dish + 1 Rice + 1 Naan + 1 Drink" },
    category: "Menus",
    prices: p(24.90),
    originalPrice: 28.60,
    popularity: 95,
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 3,
    name: { fr: "Menu végétarien 🌱", en: "Vegetarian Menu 🌱" },
    description: { fr: "1 Plat Végé + 1 Riz + 1 Naan", en: "1 Veg Dish + 1 Rice + 1 Naan" },
    category: "Menus",
    prices: p(18.90),
    isVeg: true,
    popularity: 90,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop"
  },

  // --- NAAN ---
  {
    id: 10,
    name: { fr: "Naan fromage", en: "Cheese Naan" },
    description: { fr: "Pain fourré au fromage préparé au four Tandoor", en: "Cheese-stuffed bread baked in a Tandoor oven" },
    category: "Naan",
    prices: p(4.90),
    popularity: 99,
    image: "https://images.unsplash.com/photo-1604908177524-0d3b9f3f6b2c?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 11,
    name: { fr: "Garlic naan", en: "Garlic Naan" },
    description: { fr: "Pain à l’ail", en: "Garlic bread" },
    category: "Naan",
    prices: p(4.50),
    popularity: 88,
    image: "https://images.unsplash.com/photo-1616683838271-ce924fb4e815?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 12,
    name: { fr: "Naan nature", en: "Plain Naan" },
    description: { fr: "Pain nature sans beurre", en: "Plain bread without butter" },
    category: "Naan",
    prices: p(2.90),
    image: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?q=80&w=1000&auto=format&fit=crop"
  },
  
  // --- ENTREES ---
  {
    id: 20,
    name: { fr: "Poulet tandoori", en: "Tandoori Chicken" },
    description: { fr: "Cuisse de poulet mariné aux épices, grillées au tandoori", en: "Marinaded chicken leg with spices, grilled in tandoori" },
    category: "Entrées",
    prices: p(4.25),
    originalPrice: 8.50,
    popularity: 92,
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 21,
    name: { fr: "Samoussas aux légumes", en: "Vegetable Samosas" },
    description: { fr: "Chausson aux légumes frais 🌱 - 3 pièces", en: "Fresh vegetable turnover 🌱 - 3 pieces" },
    category: "Entrées",
    prices: p(7.50),
    isVeg: true,
    popularity: 85,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 22,
    name: { fr: "Poulet Tikka", en: "Chicken Tikka" },
    description: { fr: "Viande marinée aux épices, grillées au tandoor, 4 pièces", en: "Meat marinated in spices, grilled in tandoor, 4 pieces" },
    category: "Entrées",
    prices: p(8.90),
    popularity: 89,
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=1000&auto=format&fit=crop"
  },

  // --- SPECIALITES ---
  {
    id: 30,
    name: { fr: "Poulet butter", en: "Butter Chicken" },
    description: { fr: "Blanc de poulet sauce crème fraîche, beurre, noix de cajou, tomate", en: "Chicken breast in fresh cream sauce, butter, cashews, tomato" },
    category: "Spécialités",
    prices: p(14.50),
    popularity: 100, // Top choice!
    image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 31,
    name: { fr: "Poulet Tikka Masala", en: "Chicken Tikka Masala" },
    description: { fr: "Poulet grillé, sauce Masala avec poivrons, tomates et oignons", en: "Grilled chicken, Masala sauce with peppers, tomatoes and onions" },
    category: "Spécialités",
    prices: p(7.25),
    originalPrice: 14.50,
    popularity: 97,
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 32,
    name: { fr: "Biryani Agneau", en: "Lamb Biryani" },
    description: { fr: "Riz parfumé mijoté avec épices et agneau avec Raita", en: "Fragrant rice simmered with spices and lamb and Raita" },
    category: "Spécialités",
    prices: p(16.50),
    popularity: 94,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 33,
    name: { fr: "Madras HOT 🔥🌶", en: "Madras HOT 🔥🌶" },
    description: { fr: "Curry de madras avec noix de coco, très relevé", en: "Madras curry with coconut, very spicy" },
    category: "Spécialités",
    prices: p(13.90),
    image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=1000&auto=format&fit=crop"
  },

  // --- VEGETARIEN ---
  {
    id: 40,
    name: { fr: "Palak paneer", en: "Palak Paneer" },
    description: { fr: "Epinards hachés, l’ail, fromage maison et épices", en: "Chopped spinach, garlic, homemade cheese and spices" },
    category: "Végétarien",
    prices: p(12.50),
    isVeg: true,
    popularity: 93,
    image: "https://images.unsplash.com/photo-1606499899121-7296541f5344?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 41,
    name: { fr: "Dahl Tadka", en: "Dahl Tadka" },
    description: { fr: "Lentilles jaunes à l'ail, cumin et beurre", en: "Yellow lentils with garlic, cumin and butter" },
    category: "Végétarien",
    prices: p(5.95),
    originalPrice: 11.90,
    isVeg: true,
    popularity: 89,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1000&auto=format&fit=crop"
  },
  
  // --- CHAU MIN ---
  {
    id: 50,
    name: { fr: "Chau-Min poulet", en: "Chicken Chow Mein" },
    description: { fr: "Nouilles sautées avec poulet aux épices Népalaise", en: "Stir-fried noodles with chicken in Nepali spices" },
    category: "Chau Min",
    prices: p(14.90),
    popularity: 86,
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=1000&auto=format&fit=crop"
  },

  // --- RIZ ---
  {
    id: 60,
    name: { fr: "Riz basmati", en: "Basmati Rice" },
    description: { fr: "Une portion de riz parfumé", en: "A portion of fragrant rice" },
    category: "Riz",
    prices: p(3.90),
    isVeg: true,
    image: "https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 61,
    name: { fr: "Matar pulao", en: "Matar Pulao" },
    description: { fr: "Riz petits pois, herbes fraîches, raisin sec, cajou", en: "Rice with peas, fresh herbs, raisins, cashews" },
    category: "Riz",
    prices: p(5.40),
    isVeg: true,
    popularity: 82,
    image: "https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=1000&auto=format&fit=crop"
  },

  // --- DESSERTS & SOFTS ---
  {
    id: 70,
    name: { fr: "Suji Halwa", en: "Suji Halwa" },
    description: { fr: "Gâteau de semoule sucré", en: "Sweet semolina cake" },
    category: "Desserts",
    prices: p(5.90),
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 80,
    name: { fr: "Lassi Mangue", en: "Mango Lassi" },
    description: { fr: "Lassi mangue 50cl fait maison - Smoothie indien", en: "Homemade 50cl mango lassi - Indian smoothie" },
    category: "Softs",
    prices: p(6.50),
    popularity: 91,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1000&auto=format&fit=crop"
  }
];
