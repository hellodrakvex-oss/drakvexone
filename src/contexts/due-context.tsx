"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { CustomerDue, NewDueInput, StatusFilter, UpdateDueInput } from "@/lib/due/types";
import {
  countPending,
  filterDues,
  sumCollectedToday,
  sumPending,
} from "@/lib/due/utils";
import { buildWhatsAppReminder, getWhatsAppUrl } from "@/lib/due/whatsapp";
import * as dueFns from "@/lib/supabase/dues";
import { loadDues } from "@/lib/due/storage";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase/client";
import { createNotification } from "@/lib/supabase/notifications";

type DueContextValue = {
  dues: CustomerDue[];
  isHydrated: boolean;
  isRefreshing: boolean;
  drawerOpen: boolean;
  editingId: string | null;
  openAddDue: () => void;
  openEditDue: (id: string) => void;
  closeDrawer: () => void;
  addDue: (input: NewDueInput) => void;
  updateDue: (id: string, input: UpdateDueInput) => void;
  recordPayment: (id: string, amount: number, notes?: string) => Promise<void>;
  markAsPaid: (id: string) => void;
  deleteDue: (id: string) => void;
  sendWhatsAppReminder: (id: string) => void;
  refreshDues: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
  filteredDues: CustomerDue[];
  stats: {
    totalPending: number;
    customersWithDue: number;
    collectedToday: number;
  };
  getDueById: (id: string) => CustomerDue | undefined;
};

export const DueContext = createContext<DueContextValue | null>(null);

export function DueProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [dues, setDues] = useState<CustomerDue[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [lastDeleted, setLastDeleted] = useState<CustomerDue | null>(null);

  // Load dues from Supabase when user is authenticated
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function initializeDues() {
      try {
        if (!user) {
          if (!cancelled) {
            setDues([]);
            setIsHydrated(true);
          }
          return;
        }

        // Get user's primary shop
        const { data: shop } = await supabase
          .from('shops')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (cancelled) return;

        const shopId = shop?.id || '';

        // Migrate dues from localStorage if any exist
        const localDues = loadDues();
        if (localDues.length > 0 && shopId) {
          const migratedCount = await dueFns.migrateDuesFromLocalStorage(
            user.id,
            shopId,
            localDues
          );
          if (migratedCount > 0) {
            localStorage.removeItem('drakvex-due-v1');
          }
        }

        if (cancelled) return;

        // Load dues from Supabase
        const supabaseDues = await dueFns.fetchDues(user.id);
        if (!cancelled) setDues(supabaseDues);

        // Setup realtime subscription — all .on() calls MUST precede .subscribe()
        if (shopId && !cancelled) {
          channel = supabase
            .channel(`dues_changes_${shopId}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "customer_dues",
                filter: `shop_id=eq.${shopId}`,
              },
              (payload) => {
                if (payload.eventType === "INSERT") {
                  const row = payload.new;
                  setDues((prev) => {
                    if (prev.find((d) => d.id === row.id)) return prev;
                    const newDue: CustomerDue = {
                      id: row.id,
                      customerName: row.customer_name,
                      amount: row.amount,
                      paidAmount: row.paid_amount || 0,
                      dueDate: row.due_date,
                      phone: row.phone || undefined,
                      notes: row.notes || undefined,
                      status: row.status as any,
                      createdAt: row.created_at,
                      updatedAt: row.updated_at,
                      paidAt: row.paid_at || undefined,
                      payments: [],
                    };
                    return [newDue, ...prev];
                  });
                } else if (payload.eventType === "UPDATE") {
                  const row = payload.new;
                  setDues((prev) =>
                    prev.map((d) =>
                      d.id === row.id
                        ? {
                            ...d,
                            customerName: row.customer_name,
                            amount: row.amount,
                            paidAmount: row.paid_amount || 0,
                            dueDate: row.due_date,
                            phone: row.phone || undefined,
                            notes: row.notes || undefined,
                            status: row.status as any,
                            updatedAt: row.updated_at,
                            paidAt: row.paid_at || undefined,
                            payments: d.payments || [],
                          }
                        : d
                    )
                  );
                } else if (payload.eventType === "DELETE") {
                  setDues((prev) => prev.filter((d) => d.id !== payload.old.id));
                }
              }
            )
            .subscribe((status, err) => {
              if (err) console.error('[Due Context] Realtime subscription error:', err);
            });
        }
      } catch (error) {
        console.error('[Due Context] Failed to initialize dues:', error);
        toast.error('Failed to load dues');
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    }

    initializeDues();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [user]);

  const persist = useCallback(async (next: CustomerDue[]) => {
    setDues(next);
    // No longer saving to localStorage
  }, []);

  const openAddDue = useCallback(() => {
    setEditingId(null);
    setDrawerOpen(true);
  }, []);

  const openEditDue = useCallback((id: string) => {
    setEditingId(id);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingId(null);
  }, []);

  const addDue = useCallback(
    async (input: NewDueInput) => {
      if (!user) {
        toast.error("You must be logged in to add dues");
        return;
      }

      try {
        // Get user's primary shop
        const { data: shop } = await supabase
          .from('shops')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (!shop) {
          toast.error("You must set up a shop first");
          return;
        }

        // Create due in Supabase
        const due = await dueFns.createDue(user.id, shop.id, input);
        
        // Update local state
        setDues((prev) => [due, ...prev]);
        closeDrawer();

        // Create a notification
        await createNotification(
          user.id,
          shop.id,
          "New Due Added",
          `A due of ₹${due.amount.toLocaleString("en-IN")} for ${due.customerName} has been recorded.`,
          "due_reminder",
          `/dashboard/due?edit=${due.id}`,
          { due_id: due.id, amount: due.amount, customer_name: due.customerName }
        );
        
        toast.success(`Due added for ${due.customerName}`, {
          description: `₹${due.amount.toLocaleString("en-IN")} pending`,
        });
      } catch (error: any) {
        console.error('[Due Context] Add due error:', error);
        toast.error(error?.message || 'Failed to add due');
      }
    },
    [user, dues]
  );

  const updateDue = useCallback(
    async (id: string, input: UpdateDueInput) => {
      try {
        // Update in Supabase
        const updated = await dueFns.updateDue(id, input);
        
        // Update local state
        setDues((prev) => prev.map((d) => (d.id === id ? updated : d)));
        closeDrawer();
        
        toast.success("Due updated");
      } catch (error: any) {
        console.error('[Due Context] Update due error:', error);
        toast.error(error?.message || 'Failed to update due');
      }
    },
    [dues]
  );

  const recordPayment = useCallback(
    async (id: string, amount: number, notes?: string) => {
      if (!user) return;
      try {
        await dueFns.addPayment(user.id, id, amount, notes);
        
        // Fetch the updated due to get the complete new payments array
        const { data, error } = await supabase
          .from('customer_dues')
          .select('id, customer_name, amount, paid_amount, due_date, phone, notes, status, created_at, updated_at, paid_at, due_payments(id, amount, payment_date, notes, created_at)')
          .eq('id', id)
          .single();
          
        if (error || !data) throw new Error('Failed to retrieve updated due');
        
        const due: CustomerDue = {
          id: data.id,
          customerName: data.customer_name,
          amount: data.amount,
          paidAmount: data.paid_amount || 0,
          dueDate: data.due_date,
          phone: data.phone || undefined,
          notes: data.notes || undefined,
          status: data.status as any,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          paidAt: data.paid_at || undefined,
          payments: (data.due_payments || [])
            .map((p: any) => ({
              id: p.id,
              dueId: data.id,
              amount: p.amount,
              paymentDate: p.payment_date,
              notes: p.notes || undefined,
              createdAt: p.created_at,
            }))
            .sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()),
        };
        
        setDues((prev) => prev.map((d) => d.id === id ? due : d));
        toast.success(`Payment of ₹${amount.toLocaleString("en-IN")} recorded`);
      } catch (error: any) {
        console.error('[Due Context] Record payment error:', error);
        toast.error('Failed to record payment');
      }
    },
    [user]
  );

  const markAsPaid = useCallback(
    async (id: string) => {
      if (!user) return;
      const target = dues.find((d) => d.id === id);
      if (!target || target.status === "paid") return;

      try {
        // Update in Supabase
        const updated = await dueFns.markDueAsPaid(id, user.id);
        
        // Update local state
        setDues((prev) => prev.map((d) => (d.id === id ? updated : d)));
        
        toast.success(`${target.customerName} marked as paid`, {
          description: `₹${target.amount.toLocaleString("en-IN")} collected`,
        });
      } catch (error: any) {
        console.error('[Due Context] Mark paid error:', error);
        toast.error(error?.message || 'Failed to mark due as paid');
      }
    },
    [dues, user]
  );

  const deleteDue = useCallback(
    async (id: string) => {
      const due = dues.find((d) => d.id === id);
      if (!due) return;

      try {
        // Delete from Supabase
        await dueFns.deleteDue(id);
        
        // Update local state
        setLastDeleted(due);
        setDues((prev) => prev.filter((d) => d.id !== id));
        
        const dueToRestore = due;
        
        toast.success("Due deleted", {
          description: `${due.customerName} removed`,
          action: {
            label: "Undo",
            onClick: async () => {
              try {
                // Re-create in Supabase
                if (!user) return;
                const { data: shop } = await supabase
                  .from('shops')
                  .select('id')
                  .eq('user_id', user.id)
                  .order('created_at', { ascending: true })
                  .limit(1)
                  .single();

                if (!shop) return;

                const restored = await dueFns.createDue(user.id, shop.id, {
                  customerName: dueToRestore.customerName,
                  amount: dueToRestore.amount,
                  dueDate: dueToRestore.dueDate,
                  phone: dueToRestore.phone || "",
                  notes: dueToRestore.notes,
                });

                setLastDeleted(null);
                setDues((prev) => [restored, ...prev]);
                toast.success("Due restored");
              } catch (error: any) {
                console.error('[Due Context] Undo delete error:', error);
                toast.error('Failed to restore due');
              }
            },
          },
        });
      } catch (error: any) {
        console.error('[Due Context] Delete due error:', error);
        toast.error(error?.message || 'Failed to delete due');
      }
    },
    [dues, user]
  );

  const sendWhatsAppReminder = useCallback(
    async (id: string) => {
      const due = dues.find((d) => d.id === id);
      if (!due) return;
      
      if (!due.phone) {
        toast.error("Customer WhatsApp number not available");
        return;
      }
      
      let shopName = "our store";
      let shopId = "";
      if (user) {
        const { data: shop } = await supabase
          .from('shops')
          .select('id, shop_name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();
        if (shop) {
          shopName = shop.shop_name || "our store";
          shopId = shop.id;
        }
      }

      const message = buildWhatsAppReminder(due, shopName);
      const url = getWhatsAppUrl(due.phone, message);
      window.open(url, "_blank", "noopener,noreferrer");
      
      toast.success("Opening WhatsApp…", { 
        description: `Message ready for ${due.customerName}` 
      });

      // Track analytics
      try {
        if (user && shopId) {
          await supabase.from('whatsapp_analytics_events').insert({
            user_id: user.id,
            shop_id: shopId,
            due_id: due.id,
            event_type: 'whatsapp_reminder_sent',
            payload: { customer_name: due.customerName }
          });
        }
      } catch (err) {
        console.error('Failed to log analytics', err);
      }
    },
    [dues, user]
  );

  const refreshDues = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsRefreshing(true);
      const supabaseDues = await dueFns.fetchDues(user.id);
      setDues(supabaseDues);
      toast.success("Dues updated");
    } catch (error: any) {
      console.error('[Due Context] Refresh error:', error);
      toast.error('Failed to refresh dues');
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  const filteredDues = useMemo(
    () => filterDues(dues, { query: searchQuery, statusFilter }),
    [dues, searchQuery, statusFilter]
  );

  const stats = useMemo(
    () => ({
      totalPending: sumPending(dues),
      customersWithDue: countPending(dues),
      collectedToday: sumCollectedToday(dues),
    }),
    [dues]
  );

  const getDueById = useCallback((id: string) => dues.find((d) => d.id === id), [dues]);

  const value: DueContextValue = {
    dues,
    isHydrated,
    isRefreshing,
    drawerOpen,
    editingId,
    openAddDue,
    openEditDue,
    closeDrawer,
    addDue,
    updateDue,
    recordPayment,
    markAsPaid,
    deleteDue,
    sendWhatsAppReminder,
    refreshDues,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredDues,
    stats,
    getDueById,
  };

  return <DueContext.Provider value={value}>{children}</DueContext.Provider>;
}

export function useDue() {
  const ctx = useContext(DueContext);
  if (!ctx) throw new Error("useDue must be used within DueProvider");
  return ctx;
}
