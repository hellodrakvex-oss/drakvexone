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
import type { DateFilter, NewExpenseInput, Expense } from "@/lib/expenses/types";
import {
  averageAmount,
  filterExpenses,
  isInFilter,
  sumAmount,
} from "@/lib/expenses/utils";
import * as expenseFns from "@/lib/supabase/expenses";
import { loadExpenses } from "@/lib/expenses/storage";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase/client";

type AddExpensePreset = Partial<NewExpenseInput>;

type ExpensesContextValue = {
  expenses: Expense[];
  isHydrated: boolean;
  isRefreshing: boolean;
  addExpenseOpen: boolean;
  addExpensePreset: AddExpensePreset | null;
  editingId: string | null;
  openAddExpense: (preset?: AddExpensePreset) => void;
  closeAddExpense: () => void;
  openEditExpense: (id: string) => void;
  addExpense: (input: NewExpenseInput) => void;
  editExpense: (id: string, input: NewExpenseInput) => void;
  deleteExpense: (id: string) => void;
  undoDelete: () => void;
  refreshExpenses: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  dateFilter: DateFilter;
  setDateFilter: (f: DateFilter) => void;
  filteredExpenses: Expense[];
  todayStats: { total: number; count: number; average: number };
  weekTotal: number;
  monthTotal: number;
  listStats: { total: number; count: number; average: number };
  getExpenseById: (id: string) => Expense | undefined;
};

export const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addExpensePreset, setAddExpensePreset] = useState<AddExpensePreset | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [lastDeleted, setLastDeleted] = useState<Expense | null>(null);

  // Load expenses from Supabase when user is authenticated
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function initializeExpenses() {
      try {
        if (!user) {
          if (!cancelled) {
            setExpenses([]);
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

        // Migrate expenses from localStorage if any exist
        const localExpenses = loadExpenses();
        if (localExpenses.length > 0 && shopId) {
          const migratedCount = await expenseFns.migrateExpensesFromLocalStorage(
            user.id,
            shopId,
            localExpenses
          );
          if (migratedCount > 0) {
            localStorage.removeItem('drakvex-expenses-v1');
          }
        }

        if (cancelled) return;

        // Load expenses from Supabase
        const supabaseExpenses = await expenseFns.fetchExpenses(user.id);
        if (!cancelled) setExpenses(supabaseExpenses);

        // Setup realtime subscription — all .on() calls MUST precede .subscribe()
        if (shopId && !cancelled) {
          channel = supabase
            .channel(`expenses_changes_${shopId}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "expenses",
                filter: `shop_id=eq.${shopId}`,
              },
              (payload) => {
                if (payload.eventType === "INSERT") {
                  const row = payload.new;
                  setExpenses((prev) => {
                    if (prev.find((e) => e.id === row.id)) return prev;
                    const newExp: Expense = {
                      id: row.id,
                      amount: row.amount,
                      category: row.category as any,
                      description: row.description || undefined,
                      notes: row.reference_number || undefined,
                      createdAt: row.created_at,
                    };
                    return [newExp, ...prev];
                  });
                } else if (payload.eventType === "UPDATE") {
                  const row = payload.new;
                  setExpenses((prev) =>
                    prev.map((e) =>
                      e.id === row.id
                        ? {
                            ...e,
                            amount: row.amount,
                            category: row.category as any,
                            description: row.description || undefined,
                            notes: row.reference_number || undefined,
                          }
                        : e
                    )
                  );
                } else if (payload.eventType === "DELETE") {
                  setExpenses((prev) => prev.filter((e) => e.id !== payload.old.id));
                }
              }
            )
            .subscribe((status, err) => {
              if (err) console.error('[Expenses Context] Realtime subscription error:', err);
            });
        }
      } catch (error) {
        console.error('[Expenses Context] Failed to initialize expenses:', error);
        toast.error('Failed to load expenses');
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    }

    initializeExpenses();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [user]);

  const persist = useCallback(async (next: Expense[]) => {
    setExpenses(next);
    // No longer saving to localStorage
  }, []);

  const openAddExpense = useCallback((preset?: AddExpensePreset) => {
    setAddExpensePreset(preset ?? null);
    setEditingId(null);
    setAddExpenseOpen(true);
  }, []);

  const closeAddExpense = useCallback(() => {
    setAddExpenseOpen(false);
    setAddExpensePreset(null);
    setEditingId(null);
  }, []);

  const openEditExpense = useCallback((id: string) => {
    setEditingId(id);
    setAddExpenseOpen(true);
    setAddExpensePreset(null);
  }, []);

  const addExpense = useCallback(
    async (input: NewExpenseInput) => {
      if (!user) {
        toast.error("You must be logged in to add expenses");
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

        // Create expense in Supabase
        const expense = await expenseFns.createExpense(user.id, shop.id, input);
        
        // Update local state
        setExpenses((prev) => [expense, ...prev]);
        closeAddExpense();
        
        toast.success(`₹${expense.amount.toLocaleString("en-IN")} expense recorded`, {
          description: expense.description ?? `${expense.category} expense`,
        });
      } catch (error: any) {
        console.error('[Expenses Context] Add expense error:', error);
        toast.error(error?.message || 'Failed to add expense');
      }
    },
    [user, expenses]
  );

  const editExpense = useCallback(
    async (id: string, input: NewExpenseInput) => {
      try {
        // Update in Supabase
        const updated = await expenseFns.updateExpense(id, input);
        
        // Update local state
        setExpenses((prev) =>
          prev.map((e) => (e.id === id ? updated : e))
        );
        closeAddExpense();
        
        toast.success("Expense updated", {
          description: input.description ?? "Expense modified",
        });
      } catch (error: any) {
        console.error('[Expenses Context] Edit expense error:', error);
        toast.error(error?.message || 'Failed to update expense');
      }
    },
    [expenses]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const expense = expenses.find((e) => e.id === id);
      if (!expense) return;
      
      try {
        // Delete from Supabase
        await expenseFns.deleteExpense(id);
        
        // Update local state
        setLastDeleted(expense);
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        
        toast.success("Expense deleted", {
          description: `₹${expense.amount.toLocaleString("en-IN")} removed`,
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

                const restored = await expenseFns.createExpense(user.id, shop.id, {
                  amount: expense.amount,
                  category: expense.category,
                  description: expense.description,
                  notes: expense.notes,
                });

                setLastDeleted(null);
                setExpenses((prev) => [restored, ...prev]);
                toast.success("Expense restored");
              } catch (error: any) {
                console.error('[Expenses Context] Undo delete error:', error);
                toast.error('Failed to restore expense');
              }
            },
          },
        });
      } catch (error: any) {
        console.error('[Expenses Context] Delete expense error:', error);
        toast.error(error?.message || 'Failed to delete expense');
      }
    },
    [expenses, user]
  );

  const undoDelete = useCallback(async () => {
    if (!lastDeleted || !user) return;
    
    try {
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!shop) return;

      const restored = await expenseFns.createExpense(user.id, shop.id, {
        amount: lastDeleted.amount,
        category: lastDeleted.category,
        description: lastDeleted.description,
        notes: lastDeleted.notes,
      });

      setLastDeleted(null);
      setExpenses((prev) => [restored, ...prev]);
      toast.success("Expense restored");
    } catch (error: any) {
      console.error('[Expenses Context] Undo delete error:', error);
      toast.error('Failed to restore expense');
    }
  }, [lastDeleted, expenses, user]);

  const refreshExpenses = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsRefreshing(true);
      const supabaseExpenses = await expenseFns.fetchExpenses(user.id);
      setExpenses(supabaseExpenses);
      toast.success("Expenses updated");
    } catch (error: any) {
      console.error('[Expenses Context] Refresh error:', error);
      toast.error('Failed to refresh expenses');
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  const filteredExpenses = useMemo(
    () => filterExpenses(expenses, searchQuery, dateFilter),
    [expenses, searchQuery, dateFilter]
  );

  const todayExpenses = useMemo(
    () => expenses.filter((e) => isInFilter(e, "today")),
    [expenses]
  );

  const weekExpenses = useMemo(
    () => expenses.filter((e) => isInFilter(e, "week")),
    [expenses]
  );

  const monthExpenses = useMemo(
    () => expenses.filter((e) => isInFilter(e, "month")),
    [expenses]
  );

  const todayStats = useMemo(
    () => ({
      total: sumAmount(todayExpenses),
      count: todayExpenses.length,
      average: averageAmount(todayExpenses),
    }),
    [todayExpenses]
  );

  const listStats = useMemo(
    () => ({
      total: sumAmount(filteredExpenses),
      count: filteredExpenses.length,
      average: averageAmount(filteredExpenses),
    }),
    [filteredExpenses]
  );

  const getExpenseById = useCallback((id: string) => expenses.find((e) => e.id === id), [expenses]);

  const value: ExpensesContextValue = {
    expenses,
    isHydrated,
    isRefreshing,
    addExpenseOpen,
    addExpensePreset,
    editingId,
    openAddExpense,
    closeAddExpense,
    openEditExpense,
    addExpense,
    editExpense,
    deleteExpense,
    undoDelete,
    refreshExpenses,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    filteredExpenses,
    todayStats,
    weekTotal: sumAmount(weekExpenses),
    monthTotal: sumAmount(monthExpenses),
    listStats,
    getExpenseById,
  };

  return (
    <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(ExpensesContext);
  if (!ctx) {
    throw new Error("useExpenses must be used within ExpensesProvider");
  }
  return ctx;
}
