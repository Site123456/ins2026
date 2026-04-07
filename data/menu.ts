export type Category =
  | "En ce moment"
  | "Menus"
  | "Naan"
  | "Entrées"
  | "Spécialités"
  | "Végétarien"
  | "Chau Min"
  | "Riz"
  | "Desserts"
  | "Softs"
  | "Couverts";

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
  // ============================
  // 🔥 PROMO -50%
  // ============================
  {
    id: 1,
    name: { fr: "Sélection -50 %", en: "Selection -50%" },
    description: {
      fr: "Profitez de -50 % sur une sélection de produits (voir conditions)",
      en: "Enjoy 50% off on selected items (see conditions)"
    },
    category: "En ce moment",
    prices: p(0),
    image: "https://indian-nepaliswad.fr/etc/logo.png",
  },

  // ============================
  // 🌟 MENUS
  // ============================
  {
    id: 10,
    name: { fr: "Menu Spécial 🫶", en: "Special Menu 🫶" },
    description: { fr: "1 Plat + 1 Riz + 1 Naan", en: "1 Dish + 1 Rice + 1 Naan" },
    category: "Menus",
    prices: p(18.90),
    popularity: 98,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 11,
    name: { fr: "Menu Best Deal 🎉", en: "Best Deal Menu 🎉" },
    description: {
      fr: "1 Entrée + 1 Plat + 1 Riz + 1 Naan + 1 Boisson",
      en: "1 Starter + 1 Dish + 1 Rice + 1 Naan + 1 Drink"
    },
    category: "Menus",
    prices: p(24.90),
    originalPrice: 28.60,
    popularity: 95,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 12,
    name: { fr: "Menu végétarien 🌱", en: "Vegetarian Menu 🌱" },
    description: {
      fr: "1 Plat Végé + 1 Riz + 1 Naan 🌱",
      en: "1 Veg Dish + 1 Rice + 1 Naan 🌱"
    },
    category: "Menus",
    prices: p(18.90),
    isVeg: true,
    popularity: 90,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },

  // ============================
  // 🍞 NAANS
  // ============================
  {
    id: 20,
    name: { fr: "Naan fromage", en: "Cheese Naan" },
    description: { fr: "Pain fourré au fromage", en: "Naan stuffed with cheese" },
    category: "Naan",
    prices: p(4.90),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 21,
    name: { fr: "Naan nature", en: "Plain Naan" },
    description: { fr: "Pain nature sans beurre", en: "Plain naan without butter" },
    category: "Naan",
    prices: p(2.90),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 22,
    name: { fr: "Garlic Naan", en: "Garlic Naan" },
    description: { fr: "Pain à l’ail", en: "Garlic naan" },
    category: "Naan",
    prices: p(4.50),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 23,
    name: { fr: "Naan Indian Nepali Swad", en: "Indian Nepali Swad Naan" },
    description: {
      fr: "Naan au fromage, piments verts, ail, gingembre",
      en: "Cheese naan with green chili, garlic, ginger"
    },
    category: "Naan",
    prices: p(6.50),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 24,
    name: { fr: "Keema Naan (Mild HOT)", en: "Keema Naan (Mild HOT)" },
    description: { fr: "Pain fourré à la viande hachée", en: "Naan stuffed with minced meat" },
    category: "Naan",
    prices: p(6.50),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 25,
    name: { fr: "Papadam", en: "Papadam" },
    description: { fr: "1 pièce", en: "1 piece" },
    category: "Naan",
    prices: p(1.00),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 26,
    name: { fr: "Roti / Chapati", en: "Roti / Chapati" },
    description: { fr: "Pain nature à la farine complète", en: "Whole wheat flatbread" },
    category: "Naan",
    prices: p(3.00),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },

  // ============================
  // 🥟 ENTRÉES
  // ============================
  {
    id: 30,
    name: { fr: "Poulet tandoori", en: "Tandoori Chicken" },
    description: {
      fr: "Cuisse de poulet marinée aux épices, grillée au tandoor",
      en: "Chicken leg marinated in spices, grilled in tandoor"
    },
    category: "Entrées",
    prices: p(4.25),
    originalPrice: 8.50,
    image: "https://indian-nepaliswad.fr/etc/logo.png",
  },
  {
    id: 31,
    name: { fr: "Samoussas poulet", en: "Chicken Samosas" },
    description: { fr: "3 pièces poulet", en: "3 chicken samosas" },
    category: "Entrées",
    prices: p(8.50),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 32,
    name: { fr: "Samoussas légumes 🌱", en: "Veg Samosas 🌱" },
    description: {
      fr: "3 pièces légumes, pomme de terre, petit pois, carottes",
      en: "3 vegetable samosas"
    },
    category: "Entrées",
    prices: p(7.50),
    isVeg: true,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 33,
    name: { fr: "Poulet Tikka", en: "Chicken Tikka" },
    description: {
      fr: "4 pièces grillées au tandoor",
      en: "4 pieces grilled in tandoor"
    },
    category: "Entrées",
    prices: p(8.90),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 34,
    name: { fr: "Onion Bhaji 🌱", en: "Onion Bhaji 🌱" },
    description: {
      fr: "Beignets d’oignons aux herbes fraîches (6 pièces)",
      en: "Onion fritters with herbs (6 pcs)"
    },
    category: "Entrées",
    prices: p(6.90),
    isVeg: true,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 35,
    name: { fr: "Pakora 🌱", en: "Pakora 🌱" },
    description: {
      fr: "Beignets végétariens aux herbes fraîches (6 pièces)",
      en: "Vegetarian fritters (6 pcs)"
    },
    category: "Entrées",
    prices: p(7.50),
    isVeg: true,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 36,
    name: { fr: "Seekh kebab", en: "Seekh Kebab" },
    description: {
      fr: "Brochette d’agneau haché (2 pièces)",
      en: "Minced lamb skewers (2 pcs)"
    },
    category: "Entrées",
    prices: p(8.50),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },

  // ============================
  // 🇮🇳 SPÉCIALITÉS
  // ============================
  {
    id: 40,
    name: { fr: "Poulet Butter", en: "Butter Chicken" },
    description: {
      fr: "Poulet dans une sauce crème, beurre, cajou, amande",
      en: "Chicken in creamy butter sauce with cashew & almond"
    },
    category: "Spécialités",
    prices: p(14.50),
    popularity: 95,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 41,
    name: { fr: "Poulet Tikka Masala", en: "Chicken Tikka Masala" },
    description: {
      fr: "Poulet grillé dans une sauce Masala",
      en: "Grilled chicken in Masala sauce"
    },
    category: "Spécialités",
    prices: p(7.25),
    originalPrice: 14.50,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 42,
    name: { fr: "Shahi Korma", en: "Shahi Korma" },
    description: {
      fr: "Sauce crème, amandes, raisins, cajou",
      en: "Creamy sauce with almonds, raisins, cashews"
    },
    category: "Spécialités",
    prices: p(14.50),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },

  // ============================
  // 🌱 VÉGÉTARIEN
  // ============================
  {
    id: 60,
    name: { fr: "Palak Paneer 🌱", en: "Palak Paneer 🌱" },
    description: {
      fr: "Épinards hachés, ail, fromage indien",
      en: "Spinach cooked with garlic & paneer"
    },
    category: "Végétarien",
    prices: p(12.50),
    popularity: 90,
    isVeg: true,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 61,
    name: { fr: "Dahl Tadka 🌱", en: "Dahl Tadka 🌱" },
    description: {
      fr: "Lentilles jaunes, ail, cumin, beurre",
      en: "Yellow lentils with garlic & cumin"
    },
    category: "Végétarien",
    prices: p(5.95),
    originalPrice: 11.90,
    isVeg: true,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 62,
    name: { fr: "Bhaigan Bharta 🌱", en: "Baingan Bharta 🌱" },
    description: {
      fr: "Aubergines grillées, oignons, tomates",
      en: "Smoked eggplant with onions & tomatoes"
    },
    category: "Végétarien",
    prices: p(12.90),
    isVeg: true,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },

  // ============================
  // 🇳🇵 CHAU MIN
  // ============================
  {
    id: 70,
    name: { fr: "Chau-Min Poulet", en: "Chicken Chow Mein" },
    description: {
      fr: "Nouilles sautées au poulet, épices népalaises",
      en: "Stir-fried noodles with chicken & Nepali spices"
    },
    category: "Chau Min",
    prices: p(14.90),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 71,
    name: { fr: "Chau-Min Légumes 🌱", en: "Veg Chow Mein 🌱" },
    description: {
      fr: "Nouilles sautées aux légumes",
      en: "Stir-fried noodles with vegetables"
    },
    category: "Chau Min",
    prices: p(13.90),
    isVeg: true,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },

  // ============================
  // 🍚 RIZ
  // ============================
  {
    id: 80,
    name: { fr: "Riz basmati", en: "Basmati Rice" },
    description: { fr: "Une portion", en: "One portion" },
    category: "Riz",
    prices: p(3.90),
    isVeg: true,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 81,
    name: { fr: "Riz safran", en: "Saffron Rice" },
    description: { fr: "Une portion", en: "One portion" },
    category: "Riz",
    prices: p(4.40),
    isVeg: true,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 82,
    name: { fr: "Matar Pulao", en: "Matar Pulao" },
    description: {
      fr: "Riz petits pois, herbes fraîches, raisins, cajou",
      en: "Rice with peas, herbs, raisins, cashews"
    },
    category: "Riz",
    prices: p(5.40),
    isVeg: true,
    popularity: 82,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },

  // ============================
  // 🍰 DESSERTS
  // ============================
  {
    id: 90,
    name: { fr: "Suji Halwa", en: "Suji Halwa" },
    description: { fr: "Gâteau de semoule sucré", en: "Sweet semolina cake" },
    category: "Desserts",
    prices: p(5.90),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 91,
    name: { fr: "Gulab Jamun", en: "Gulab Jamun" },
    description: {
      fr: "Pâtisserie moelleuse au lait & noix de coco",
      en: "Soft milk-based pastry in syrup"
    },
    category: "Desserts",
    prices: p(5.90),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },

  // ============================
  // 💧 SOFTS
  // ============================
  {
    id: 100,
    name: { fr: "Lassi Mangue", en: "Mango Lassi" },
    description: {
      fr: "Lassi mangue 50cl fait maison",
      en: "Homemade 50cl mango lassi"
    },
    category: "Softs",
    prices: p(6.50),
    popularity: 91,
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 101,
    name: { fr: "Coca-Cola 33cl", en: "Coca-Cola 33cl" },
    description: { fr: "Canette", en: "Can" },
    category: "Softs",
    prices: p(2.00),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },
  {
    id: 102,
    name: { fr: "Eau plate 50cl", en: "Still Water 50cl" },
    description: { fr: "Evian ou Vittel", en: "Evian or Vittel" },
    category: "Softs",
    prices: p(3.00),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  },

  // ============================
  // 🍴 COUVERTS
  // ============================
  {
    id: 200,
    name: { fr: "Couverts", en: "Cutlery Set" },
    description: {
      fr: "Fourchette + couteau + serviette (non gratuit)",
      en: "Fork + knife + napkin (not free)"
    },
    category: "Couverts",
    prices: p(0.50),
    image: "https://indian-nepaliswad.fr/etc/logo.png"
  }
];
