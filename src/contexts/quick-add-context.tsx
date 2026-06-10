"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { QuickAddItem, NewQuickAddInput, UpdateQuickAddInput, QuickAddCategory } from "@/lib/quick-add/types";
import {
  fetchQuickAddItems,
  createQuickAddItem,
  updateQuickAddItem,
  deleteQuickAddItem,
  reorderQuickAddItems,
  seedDefaultQuickAddItems,
  hasQuickAddItems,
} from "@/lib/supabase/quick-add";
import { useAuth } from "./auth-context";
import { supabase } from "@/lib/supabase/client";

type QuickAddContextValue = {
  items: QuickAddItem[];
  isLoading: boolean;
  addItem: (input: NewQuickAddInput) => Promise<void>;
  updateItem: (id: string, input: UpdateQuickAddInput) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  reorderItems: (items: Array<{ id: string; sortOrder: number }>) => Promise<void>;
  seedDefaultItems: (category: QuickAddCategory) => Promise<void>;
  refreshItems: () => Promise<void>;
};

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [items, setItems] = useState<QuickAddItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get user's primary shop
  useEffect(() => {
    if (!user) return;

    const fetchShopId = async () => {
// console.log('[Quick Add Context] === FETCHING SHOP ID ===');
// console.log('[Quick Add Context] User ID:', user.id);
      
      const { data, error, status } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

// console.log('[Quick Add Context] Shop query result:');
// console.log('[Quick Add Context]   - Status:', status);
// console.log('[Quick Add Context]   - Data:', data);
// console.log('[Quick Add Context]   - Error:', error);

      if (data?.id) {
// console.log('[Quick Add Context] ✓ Shop ID found:', data.id);
        setShopId(data.id);
      } else {
        console.error('[Quick Add Context] ✗ Shop not found for user:', user.id);
        console.error('[Quick Add Context] This user may not have a shop created yet');
      }
    };

    fetchShopId();
  }, [user]);

  // Load quick add items
  const loadItems = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const loadedItems = await fetchQuickAddItems(user.id);
      setItems(loadedItems);
    } catch (error: any) {
      // Handle missing table gracefully (migration not run yet)
      if (error?.code === 'PGRST205' || error?.message?.includes('could not find the table')) {
        setItems([]);
        return;
      }
      
      console.error('[Quick Add Context] Failed to load items:', error);
      toast.error("Failed to load quick add items");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`quick_add_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quick_add_items',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadItems();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user, loadItems]);

  const addItem = useCallback(
    async (input: NewQuickAddInput) => {
      // ===== AUDIT LOGGING START =====
// console.log('[Quick Add Context] === ADD ITEM AUDIT START ===');
// console.log('[Quick Add Context] User:', user ? { id: user.id, email: user.email } : null);
// console.log('[Quick Add Context] ShopId:', shopId);
// console.log('[Quick Add Context] Input:', JSON.stringify(input));
      
      if (!user) {
        console.error('[Quick Add Context] ERROR: user is null/undefined');
        toast.error("Not authenticated - no user");
        return;
      }
      
      if (!shopId) {
        console.error('[Quick Add Context] ERROR: shopId is null/undefined');
        console.error('[Quick Add Context] This means shops.id was not found for user:', user.id);
        toast.error("Not authenticated - no shop found");
        return;
      }
      
// console.log('[Quick Add Context] ✓ All pre-checks passed');
// console.log('[Quick Add Context] About to call createQuickAddItem with:');
// console.log('[Quick Add Context]   - userId:', user.id);
// console.log('[Quick Add Context]   - shopId:', shopId);
// console.log('[Quick Add Context]   - input:', input);
// console.log('[Quick Add Context]   - sortOrder:', items.length);
      // ===== AUDIT LOGGING END =====

      try {
        const sortOrder = items.length;
        const newItem = await createQuickAddItem(user.id, shopId, input, sortOrder);
        setItems((prev) => [...prev, newItem]);
// console.log('[Quick Add Context] ✓ Item added successfully:', newItem.name);
        toast.success(`"${input.name}" added to Quick Add`);
      } catch (error: any) {
        console.error('[Quick Add Context] === CATCH BLOCK ===');
        console.error('[Quick Add Context] Failed to add item');
        console.error('[Quick Add Context] Error type:', typeof error);
        console.error('[Quick Add Context] Error:', error);
        console.error('[Quick Add Context] Error message:', error?.message);
        console.error('[Quick Add Context] Error code:', error?.code);
        console.error('[Quick Add Context] Full error object:', JSON.stringify(error));
        toast.error("Failed to add quick add item");
        throw error;
      }
    },
    [user, shopId, items.length]
  );

  const updateItem = useCallback(
    async (id: string, input: UpdateQuickAddInput) => {
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      try {
        const updated = await updateQuickAddItem(id, input);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        toast.success("Quick Add item updated");
      } catch (error) {
        console.error('[Quick Add Context] Failed to update item:', error);
        toast.error("Failed to update quick add item");
        throw error;
      }
    },
    [user]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      try {
        await deleteQuickAddItem(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.success("Quick Add item deleted");
      } catch (error) {
        console.error('[Quick Add Context] Failed to delete item:', error);
        toast.error("Failed to delete quick add item");
        throw error;
      }
    },
    [user]
  );

  const reorderItems = useCallback(
    async (newOrder: Array<{ id: string; sortOrder: number }>) => {
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      try {
        await reorderQuickAddItems(user.id, newOrder);
        setItems((prev) => {
          const updated = [...prev];
          newOrder.forEach(({ id, sortOrder }) => {
            const item = updated.find((i) => i.id === id);
            if (item) item.sortOrder = sortOrder;
          });
          return updated.sort((a, b) => a.sortOrder - b.sortOrder);
        });
        toast.success("Quick Add items reordered");
      } catch (error) {
        console.error('[Quick Add Context] Failed to reorder items:', error);
        toast.error("Failed to reorder quick add items");
        throw error;
      }
    },
    [user]
  );

  const seedDefaultItems = useCallback(
    async (category: QuickAddCategory) => {
      if (!user || !shopId) {
        toast.error("Not authenticated");
        return;
      }

      try {
        const seeded = await seedDefaultQuickAddItems(user.id, shopId, category);
        setItems(seeded);
        toast.success("Quick Add items initialized");
      } catch (error) {
        console.error('[Quick Add Context] Failed to seed items:', error);
        toast.error("Failed to initialize quick add items");
        throw error;
      }
    },
    [user, shopId]
  );

  const refreshItems = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

  const value: QuickAddContextValue = {
    items,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    seedDefaultItems,
    refreshItems,
  };

  return (
    <QuickAddContext.Provider value={value}>
      {children}
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const context = useContext(QuickAddContext);
  if (!context) {
    throw new Error("useQuickAdd must be used within QuickAddProvider");
  }
  return context;
}
