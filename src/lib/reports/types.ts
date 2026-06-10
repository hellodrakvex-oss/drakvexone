export type ReportDateRange = "today" | "yesterday" | "custom";

export interface DailyReport {
  date: string; // ISO date string YYYY-MM-DD
  shopName: string;

  // Sales
  totalSales: number;
  salesCount: number;
  averageSaleValue: number;
  cashSales: number;
  upiSales: number;

  // Expenses
  totalExpenses: number;
  expensesCount: number;

  // Profit
  netProfit: number;
  profitMarginPercent: number;

  // Due
  dueAdded: number;
  dueCollected: number;
  pendingDueBalance: number;
  newDuesCount: number;

  // Customers
  uniqueCustomersCount: number;
  transactionsTotal: number;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  days: { date: string; sales: number; expenses: number }[];
}

export interface MonthlySummary {
  month: string; // e.g. "June 2026"
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  totalDueCollected: number;
}
