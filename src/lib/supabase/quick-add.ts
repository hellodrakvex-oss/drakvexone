import { supabase } from './client';
import type { QuickAddItem, NewQuickAddInput, UpdateQuickAddInput, QuickAddCategory } from '@/lib/quick-add/types';
import { DEFAULT_QUICK_ADD_ITEMS } from '@/lib/quick-add/types';

export async function fetchQuickAddItems(userId: string): Promise<QuickAddItem[]> {
  const { data, error } = await supabase
    .from('quick_add_items')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Quick Add Supabase] Failed to fetch items:', error);
    throw error;
  }

  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    shopId: row.shop_id,
    name: row.name,
    price: row.price,
    icon: row.icon,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createQuickAddItem(
  userId: string,
  shopId: string,
  input: NewQuickAddInput,
  sortOrder: number = 0
): Promise<QuickAddItem> {
  // ===== AUDIT LOGGING START =====
  
  // Verify parameters
  if (!userId) {
    console.error('[Quick Add Supabase] ERROR: userId is null/undefined');
    throw new Error('userId is required');
  }
  if (!shopId) {
    console.error('[Quick Add Supabase] ERROR: shopId is null/undefined');
    throw new Error('shopId is required');
  }
  
  // ===== FIX: VALIDATE PROFILE EXISTS BEFORE INSERT =====
  const { data: profileExists, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error('[Quick Add Supabase] Profile lookup error:', profileError);
    throw new Error('Failed to validate user profile: ' + profileError.message);
  }

  if (!profileExists) {
    console.error('[Quick Add Supabase] ✗ PROFILE NOT FOUND');
    throw new Error(
      'User profile not found. Please complete setup first.'
    );
  }

  // ===== FIX: END =====
  
  const insertPayload = {
    user_id: userId,
    shop_id: shopId,
    name: input.name,
    price: input.price,
    icon: input.icon || null,
    sort_order: sortOrder,
    is_active: true,
  };
  
  // ===== AUDIT LOGGING END =====
  
  const { data, error, status, statusText } = await supabase
    .from('quick_add_items')
    .insert(insertPayload)
    .select()
    .maybeSingle();

  // ===== RESPONSE AUDIT LOGGING START =====
  if (error) {
    console.error('[Quick Add Supabase] Error code:', error.code);
    console.error('[Quick Add Supabase] Error message:', error.message);
    console.error('[Quick Add Supabase] Error details:', error.details);
    console.error('[Quick Add Supabase] Error hint:', error.hint);
    console.error('[Quick Add Supabase] Full error object:', JSON.stringify(error));
  }
  // ===== RESPONSE AUDIT LOGGING END =====

  if (error || !data) {
    throw error || new Error('Failed to create quick add item');
  }


  return {
    id: data.id,
    userId: data.user_id,
    shopId: data.shop_id,
    name: data.name,
    price: data.price,
    icon: data.icon,
    sortOrder: data.sort_order,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateQuickAddItem(
  itemId: string,
  input: UpdateQuickAddInput
): Promise<QuickAddItem> {
  const updatePayload: any = {};
  
  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.price !== undefined) updatePayload.price = input.price;
  if (input.icon !== undefined) updatePayload.icon = input.icon;

  const { data, error } = await supabase
    .from('quick_add_items')
    .update(updatePayload)
    .eq('id', itemId)
    .select()
    .maybeSingle();

  if (error || !data) {
    console.error('[Quick Add Supabase] Failed to update item:', error);
    throw error || new Error('Failed to update quick add item');
  }


  return {
    id: data.id,
    userId: data.user_id,
    shopId: data.shop_id,
    name: data.name,
    price: data.price,
    icon: data.icon,
    sortOrder: data.sort_order,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteQuickAddItem(itemId: string): Promise<void> {
  // Soft delete - mark as inactive
  const { error } = await supabase
    .from('quick_add_items')
    .update({ is_active: false })
    .eq('id', itemId);

  if (error) {
    console.error('[Quick Add Supabase] Failed to delete item:', error);
    throw error;
  }

}

export async function reorderQuickAddItems(
  userId: string,
  items: Array<{ id: string; sortOrder: number }>
): Promise<void> {
  // Update all items' sort order
  for (const item of items) {
    const { error } = await supabase
      .from('quick_add_items')
      .update({ sort_order: item.sortOrder })
      .eq('id', item.id)
      .eq('user_id', userId);

    if (error) {
      console.error('[Quick Add Supabase] Failed to reorder items:', error);
      throw error;
    }
  }

}

export async function seedDefaultQuickAddItems(
  userId: string,
  shopId: string,
  category: QuickAddCategory
): Promise<QuickAddItem[]> {
  const defaultItems = DEFAULT_QUICK_ADD_ITEMS[category];
  const createdItems: QuickAddItem[] = [];

  for (const item of defaultItems) {
    try {
      const created = await createQuickAddItem(userId, shopId, {
        name: item.name,
        price: item.price,
        icon: item.icon,
      }, item.sortOrder);
      createdItems.push(created);
    } catch (error) {
      console.error(`[Quick Add Supabase] Failed to seed item "${item.name}":`, error);
    }
  }


  return createdItems;
}

export async function hasQuickAddItems(shopId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('quick_add_items')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('is_active', true);

  if (error) {
    console.error('[Quick Add Supabase] Failed to check items:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}
