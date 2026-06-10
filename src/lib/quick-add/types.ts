export type QuickAddItem = {
  id: string;
  userId: string;
  shopId: string;
  name: string;
  price: number;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NewQuickAddInput = {
  name: string;
  price: number;
  icon?: string;
};

export type UpdateQuickAddInput = Partial<NewQuickAddInput>;

export type QuickAddCategory = "tea-shop" | "cafe" | "supermarket";

export const DEFAULT_QUICK_ADD_ITEMS: Record<QuickAddCategory, Omit<QuickAddItem, 'id' | 'userId' | 'shopId' | 'createdAt' | 'updatedAt'>[]> = {
  "tea-shop": [
    { name: "Tea", price: 25, icon: "coffee", sortOrder: 0, isActive: true },
    { name: "Coffee", price: 40, icon: "cup-soda", sortOrder: 1, isActive: true },
    { name: "Snacks", price: 60, icon: "utensils-crossed", sortOrder: 2, isActive: true },
    { name: "Combo", price: 150, icon: "zap", sortOrder: 3, isActive: true },
  ],
  "cafe": [
    { name: "Coffee", price: 50, icon: "cup-soda", sortOrder: 0, isActive: true },
    { name: "Burger", price: 80, icon: "utensils-crossed", sortOrder: 1, isActive: true },
    { name: "Sandwich", price: 60, icon: "utensils-crossed", sortOrder: 2, isActive: true },
    { name: "Combo", price: 180, icon: "zap", sortOrder: 3, isActive: true },
  ],
  "supermarket": [
    { name: "Milk", price: 40, icon: "droplet", sortOrder: 0, isActive: true },
    { name: "Bread", price: 30, icon: "wheat", sortOrder: 1, isActive: true },
    { name: "Biscuit", price: 20, icon: "cookie", sortOrder: 2, isActive: true },
    { name: "Cool Drinks", price: 25, icon: "cup-soda", sortOrder: 3, isActive: true },
  ],
};
