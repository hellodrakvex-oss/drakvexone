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
import type { DateFilter, NewSaleInput, Sale } from "@/lib/sales/types";
import {
  getUserShopId,
  getSales,
  createSale,
  updateSale,
  deleteSale as deleteSaleApi,
} from "@/lib/supabase/sales";
import {
  averageAmount,
  filterSales,
  isInFilter,
  sumAmount,
} from "@/lib/sales/utils";
import { useAuth } from "./auth-context";

type AddSalePreset = Partial<NewSaleInput>;

type SalesContextValue = {
  sales: Sale[];
  isHydrated: boolean;
  isRefreshing: boolean;
  addSaleOpen: boolean;
  addSalePreset: AddSalePreset | null;
  editingId: string | null;
  openAddSale: (preset?: AddSalePreset) => void;
  closeAddSale: () => void;
  openEditSale: (id: string) => void;
  addSale: (input: NewSaleInput) => Promise<void>;
  editSale: (id: string, input: NewSaleInput) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  refreshSales: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  dateFilter: DateFilter;
  setDateFilter: (f: DateFilter) => void;
  filteredSales: Sale[];
  todayStats: { total: number; count: number; average: number };
  weekTotal: number;
  monthTotal: number;
  listStats: { total: number; count: number; average: number };
};

export const SalesContext = createContext<SalesContextValue | null>(null);

export function SalesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addSaleOpen, setAddSaleOpen] = useState(false);
  const [addSalePreset, setAddSalePreset] = useState<AddSalePreset | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");

  // Fetch shop ID when user loads
  useEffect(() => {
    async function initShop() {
      if (!user) {
        setShopId(null);
        setSales([]);
        setIsHydrated(true);
        return;
      }
      const id = await getUserShopId(user.id);
      setShopId(id);
    }
    initShop();
  }, [user]);

  // Fetch sales when shopId is available
  const fetchSalesData = useCallback(async (currentShopId: string) => {
    try {
      setIsRefreshing(true);
      const data = await getSales(currentShopId);
      setSales(data);
    } catch (error: any) {
      toast.error("Failed to load sales", { description: error.message });
    } finally {
      setIsRefreshing(false);
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!shopId) return;

    // Initial fetch
    fetchSalesData(shopId);

    let channel: any = null;
    let supabaseClient: any = null;

    async function setupRealtime() {
      const { supabase } = await import("@/lib/supabase/client");
      supabaseClient = supabase;
      channel = supabase
        .channel(`sales_changes_${shopId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "sales",
            filter: `shop_id=eq.${shopId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new;
              setSales((prev) => {
                if (prev.find((s) => s.id === row.id)) return prev;
                const newSale: Sale = {
                  id: row.id,
                  amount: row.amount,
                  customerName: row.customer_name || undefined,
                  phone: row.phone || undefined,
                  itemName: row.description || undefined,
                  paymentMethod: row.payment_method as any,
                  notes: row.reference_number || undefined,
                  createdAt: row.created_at,
                };
                return [newSale, ...prev];
              });
            } else if (payload.eventType === "UPDATE") {
              const row = payload.new;
              setSales((prev) =>
                prev.map((s) =>
                  s.id === row.id
                    ? {
                        ...s,
                        amount: row.amount,
                        customerName: row.customer_name || undefined,
                        phone: row.phone || undefined,
                        itemName: row.description || undefined,
                        paymentMethod: row.payment_method as any,
                        notes: row.reference_number || undefined,
                      }
                    : s
                )
              );
            } else if (payload.eventType === "DELETE") {
              setSales((prev) => prev.filter((s) => s.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }
    
    setupRealtime();

    return () => {
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, [shopId, fetchSalesData]);

  const openAddSale = useCallback((preset?: AddSalePreset) => {
    setAddSalePreset(preset ?? null);
    setEditingId(null);
    setAddSaleOpen(true);
  }, []);

  const closeAddSale = useCallback(() => {
    setAddSaleOpen(false);
    setAddSalePreset(null);
    setEditingId(null);
  }, []);

  const openEditSale = useCallback((id: string) => {
    setEditingId(id);
    setAddSaleOpen(true);
    setAddSalePreset(null);
  }, []);

  const addSale = useCallback(
    async (input: NewSaleInput) => {
      if (!user || !shopId) {
        toast.error("Not authenticated", { description: "Please log in to add sales" });
        return;
      }

      try {
        const newSale = await createSale(user.id, shopId, input);
        setSales((prev) => [newSale, ...prev]);
        closeAddSale();
        toast.success(`₹${newSale.amount.toLocaleString("en-IN")} sale saved`, {
          description: newSale.itemName ?? "Quick sale recorded",
        });
      } catch (error: any) {
        toast.error("Failed to add sale", { description: error.message });
        throw error;
      }
    },
    [user, shopId, closeAddSale]
  );

  const editSale = useCallback(
    async (id: string, input: NewSaleInput) => {
      if (!user || !shopId) return;

      try {
        const updatedSale = await updateSale(id, input);
        setSales((prev) =>
          prev.map((s) => (s.id === id ? updatedSale : s))
        );
        closeAddSale();
        toast.success("Sale updated", {
          description: updatedSale.itemName ?? "Sale modified",
        });
      } catch (error: any) {
        toast.error("Failed to update sale", { description: error.message });
        throw error;
      }
    },
    [user, shopId, closeAddSale]
  );

  const deleteSale = useCallback(
    async (id: string) => {
      const deletedSale = sales.find((s) => s.id === id);
      try {
        await deleteSaleApi(id);
        setSales((prev) => prev.filter((s) => s.id !== id));
        if (deletedSale) {
          toast.success("Sale deleted", {
            description: `₹${deletedSale.amount.toLocaleString("en-IN")} removed`,
          });
        }
      } catch (error: any) {
        toast.error("Failed to delete sale", { description: error.message });
        throw error;
      }
    },
    [sales]
  );

  const refreshSales = useCallback(async () => {
    if (shopId) {
      await fetchSalesData(shopId);
      toast.success("Sales updated");
    }
  }, [shopId, fetchSalesData]);

  const filteredSales = useMemo(
    () => filterSales(sales, { query: searchQuery, dateFilter }),
    [sales, searchQuery, dateFilter]
  );

  const todaySales = useMemo(
    () => sales.filter((s) => isInFilter(s, "today")),
    [sales]
  );

  const weekSales = useMemo(
    () => sales.filter((s) => isInFilter(s, "week")),
    [sales]
  );

  const monthSales = useMemo(
    () => sales.filter((s) => isInFilter(s, "month")),
    [sales]
  );

  const todayStats = useMemo(
    () => ({
      total: sumAmount(todaySales),
      count: todaySales.length,
      average: averageAmount(todaySales),
    }),
    [todaySales]
  );

  const listStats = useMemo(
    () => ({
      total: sumAmount(filteredSales),
      count: filteredSales.length,
      average: averageAmount(filteredSales),
    }),
    [filteredSales]
  );

  const value: SalesContextValue = {
    sales,
    isHydrated,
    isRefreshing,
    addSaleOpen,
    addSalePreset,
    editingId,
    openAddSale,
    closeAddSale,
    openEditSale,
    addSale,
    editSale,
    deleteSale,
    refreshSales,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    filteredSales,
    todayStats,
    weekTotal: sumAmount(weekSales),
    monthTotal: sumAmount(monthSales),
    listStats,
  };

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
}

export function useSales() {
  const ctx = useContext(SalesContext);
  if (!ctx) {
    throw new Error("useSales must be used within SalesProvider");
  }
  return ctx;
}
