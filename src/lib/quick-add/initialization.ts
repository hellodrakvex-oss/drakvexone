import { seedDefaultQuickAddItems, hasQuickAddItems } from '@/lib/supabase/quick-add';
import type { QuickAddCategory } from '@/lib/quick-add/types';

export async function initializeQuickAddItems(
  userId: string,
  shopId: string,
  category: QuickAddCategory
): Promise<boolean> {
  try {
    // Check if items already exist
    const hasItems = await hasQuickAddItems(shopId);
    
    if (hasItems) {
// console.log('[Quick Add Init] Items already exist, skipping initialization');
      return false;
    }

    // Seed default items
// console.log(`[Quick Add Init] Initializing Quick Add items for category: ${category}`);
    await seedDefaultQuickAddItems(userId, shopId, category);
    
// console.log('[Quick Add Init] Quick Add items initialized successfully');
    return true;
  } catch (error) {
    console.error('[Quick Add Init] Failed to initialize Quick Add items:', error);
    return false;
  }
}

export const QUICK_ADD_CATEGORIES = [
  {
    id: 'tea-shop',
    label: 'Tea Shop',
    description: 'Tea, Coffee, Snacks, Combo',
    emoji: '☕',
  },
  {
    id: 'cafe',
    label: 'Cafe',
    description: 'Coffee, Burger, Sandwich, Combo',
    emoji: '☕',
  },
  {
    id: 'supermarket',
    label: 'Mini Supermarket',
    description: 'Milk, Bread, Biscuit, Cool Drinks',
    emoji: '🛒',
  },
] as const;
