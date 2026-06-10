import {
  Coffee,
  CupSoda,
  UtensilsCrossed,
  Zap,
  Droplet,
  Wheat,
  Cookie,
  ShoppingCart,
  Package,
  Utensils,
  Flame,
  Wind,
  Mountain,
  Star,
  Heart,
  Smile,
  Sun,
  Moon,
  Cloud,
  Waves,
  Music,
} from "lucide-react";

type IconName =
  | "coffee"
  | "cup-soda"
  | "utensils-crossed"
  | "zap"
  | "droplet"
  | "wheat"
  | "cookie"
  | "shopping-cart"
  | "package"
  | "utensils"
  | "flame"
  | "wind"
  | "mountain"
  | "star"
  | "heart"
  | "smile"
  | "sun"
  | "moon"
  | "cloud"
  | "waves"
  | "music"
  | null
  | undefined;

const iconMap: Record<string, typeof Coffee> = {
  coffee: Coffee,
  "cup-soda": CupSoda,
  "utensils-crossed": UtensilsCrossed,
  zap: Zap,
  droplet: Droplet,
  wheat: Wheat,
  cookie: Cookie,
  "shopping-cart": ShoppingCart,
  package: Package,
  utensils: Utensils,
  flame: Flame,
  wind: Wind,
  mountain: Mountain,
  star: Star,
  heart: Heart,
  smile: Smile,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  waves: Waves,
  music: Music,
};

export function getIconComponent(iconName?: string | null) {
  if (!iconName) {
    return Coffee; // Default icon
  }
  return iconMap[iconName.toLowerCase()] || Coffee;
}

export const AVAILABLE_ICONS: Array<{ name: string; label: string }> = [
  { name: "coffee", label: "Coffee" },
  { name: "cup-soda", label: "Cup/Soda" },
  { name: "utensils-crossed", label: "Utensils" },
  { name: "zap", label: "Zap" },
  { name: "droplet", label: "Droplet" },
  { name: "wheat", label: "Wheat" },
  { name: "cookie", label: "Cookie" },
  { name: "shopping-cart", label: "Shopping Cart" },
  { name: "package", label: "Package" },
  { name: "utensils", label: "Utensils Alt" },
  { name: "flame", label: "Flame" },
  { name: "wind", label: "Wind" },
  { name: "mountain", label: "Mountain" },
  { name: "star", label: "Star" },
  { name: "heart", label: "Heart" },
  { name: "smile", label: "Smile" },
  { name: "sun", label: "Sun" },
  { name: "moon", label: "Moon" },
  { name: "cloud", label: "Cloud" },
  { name: "waves", label: "Waves" },
  { name: "music", label: "Music" },
];
