"use client";

import { ReactNode } from "react";
import { AuthContext } from "@/contexts/auth-context";
import { SettingsContext } from "@/contexts/settings-context";
import { SalesContext } from "@/contexts/sales-context";
import { ExpensesContext } from "@/contexts/expenses-context";
import { DueContext } from "@/contexts/due-context";
import { QuickAddProvider } from "@/contexts/quick-add-context";
import { DEMO_SALES, DEMO_EXPENSES, DEMO_DUES, DEMO_DASHBOARD_METRICS } from "./demo-data";

const MOCK_AUTH = {
  user: { id: "demo-user", email: "demo@drakvex.com" } as any,
  profile: { shop_name: "Sharma Tea House", setup_completed: true } as any,
  isLoading: false,
  isAuthenticated: true,
  signUp: async () => {},
  signIn: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
};

const MOCK_SETTINGS = {
  settings: {
    shopName: "Sharma Tea House",
    ownerName: "Vikram Sharma",
    shopPhone: "+91 98765 43210",
    shopAddress: "42, MG Road, Pune",
    businessType: "tea_shop",
    gstNumber: "",
    language: "en" as const,
    pushNotifications: false,
    dueReminders: true,
    dailySummary: true,
  },
  updateSettings: () => {},
  setLanguage: () => {},
  setNotifications: () => {},
  setDueReminders: () => {},
  setDailySummary: () => {},
  isHydrated: true,
  hasUnsavedChanges: false,
  isSaving: false,
  saveSettings: async () => ({ success: true } as any),
};

const MOCK_SALES = {
  sales: DEMO_SALES as any,
  isHydrated: true,
  isRefreshing: false,
  addSaleOpen: false,
  addSalePreset: null,
  editingId: null,
  openAddSale: () => {},
  closeAddSale: () => {},
  openEditSale: () => {},
  addSale: async () => {},
  editSale: async () => {},
  deleteSale: async () => {},
  refreshSales: async () => {},
  searchQuery: "",
  setSearchQuery: () => {},
  dateFilter: "today" as any,
  setDateFilter: () => {},
  filteredSales: DEMO_SALES as any,
  todayStats: {
    total: DEMO_DASHBOARD_METRICS.todaySales,
    count: DEMO_SALES.length,
    average: Math.round(DEMO_DASHBOARD_METRICS.todaySales / Math.max(DEMO_SALES.length, 1)),
  },
  weekTotal: 25000,
  monthTotal: 105000,
  listStats: {
    total: DEMO_DASHBOARD_METRICS.todaySales,
    count: DEMO_SALES.length,
    average: Math.round(DEMO_DASHBOARD_METRICS.todaySales / Math.max(DEMO_SALES.length, 1)),
  },
};

const MOCK_EXPENSES = {
  expenses: DEMO_EXPENSES as any,
  isHydrated: true,
  isRefreshing: false,
  addExpenseOpen: false,
  addExpensePreset: null,
  editingId: null,
  openAddExpense: () => {},
  closeAddExpense: () => {},
  openEditExpense: () => {},
  addExpense: async () => {},
  editExpense: async () => {},
  deleteExpense: async () => {},
  undoDelete: async () => {},
  refreshExpenses: async () => {},
  searchQuery: "",
  setSearchQuery: () => {},
  dateFilter: "today" as any,
  setDateFilter: () => {},
  filteredExpenses: DEMO_EXPENSES as any,
  todayStats: {
    total: DEMO_DASHBOARD_METRICS.todayExpenses,
    count: DEMO_EXPENSES.length,
    average: Math.round(DEMO_DASHBOARD_METRICS.todayExpenses / Math.max(DEMO_EXPENSES.length, 1)),
  },
  weekTotal: 8500,
  monthTotal: 35000,
  listStats: {
    total: DEMO_DASHBOARD_METRICS.todayExpenses,
    count: DEMO_EXPENSES.length,
    average: Math.round(DEMO_DASHBOARD_METRICS.todayExpenses / Math.max(DEMO_EXPENSES.length, 1)),
  },
  getExpenseById: (_id: string) => undefined,
};

const MOCK_DUE = {
  dues: DEMO_DUES as any,
  isHydrated: true,
  isRefreshing: false,
  drawerOpen: false,
  editingId: null,
  openAddDue: () => {},
  closeDrawer: () => {},
  openEditDue: () => {},
  addDue: async () => {},
  updateDue: async () => {},
  recordPayment: async () => {},
  markAsPaid: async () => {},
  deleteDue: async () => {},
  sendWhatsAppReminder: () => {},
  refreshDues: async () => {},
  searchQuery: "",
  setSearchQuery: () => {},
  statusFilter: "pending" as any,
  setStatusFilter: () => {},
  filteredDues: DEMO_DUES as any,
  stats: {
    totalPending: DEMO_DASHBOARD_METRICS.toCollect,
    customersWithDue: DEMO_DASHBOARD_METRICS.pendingDuesCount,
    collectedToday: 0,
  },
  getDueById: (_id: string) => undefined,
};

export function DemoProviders({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={MOCK_AUTH}>
      <SettingsContext.Provider value={MOCK_SETTINGS}>
        <SalesContext.Provider value={MOCK_SALES}>
          <QuickAddProvider>
            <ExpensesContext.Provider value={MOCK_EXPENSES}>
              <DueContext.Provider value={MOCK_DUE}>
                {children}
              </DueContext.Provider>
            </ExpensesContext.Provider>
          </QuickAddProvider>
        </SalesContext.Provider>
      </SettingsContext.Provider>
    </AuthContext.Provider>
  );
}
