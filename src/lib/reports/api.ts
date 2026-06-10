import { supabase } from "@/lib/supabase/client";
import type { DailyReport, WeeklySummary, MonthlySummary } from "./types";

/** Returns the start of a given date (midnight) as ISO string in local timezone */
function dayStart(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Returns the end of a given date (23:59:59.999) as ISO string in local timezone */
function dayEnd(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/** Resolves shop ID for the current user */
async function resolveShopId(userId: string): Promise<{ shopId: string; shopName: string } | null> {
  const { data, error } = await supabase
    .from("shops")
    .select("id, shop_name")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.error("[Reports API] Failed to resolve shop:", {
      code: error?.code,
      message: error?.message,
    });
    return null;
  }
  return { shopId: data.id, shopName: data.shop_name || "My Shop" };
}

/**
 * Fetch a full daily report for a specific date.
 * All data is fetched from real Supabase tables — no mock data.
 */
export async function getDailyReport(
  userId: string,
  date: Date
): Promise<DailyReport> {
  const shop = await resolveShopId(userId);
  if (!shop) throw new Error("Shop not found. Please complete setup first.");

  const { shopId, shopName } = shop;
  const start = dayStart(date);
  const end = dayEnd(date);

  // Execute all 5 queries concurrently
  const [
    salesResult,
    expensesResult,
    duesAddedResult,
    duePaymentsResult,
    pendingDuesResult,
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("id, amount, payment_method, customer_name")
      .eq("shop_id", shopId)
      .gte("created_at", start)
      .lte("created_at", end),
    supabase
      .from("expenses")
      .select("id, amount")
      .eq("shop_id", shopId)
      .gte("created_at", start)
      .lte("created_at", end),
    supabase
      .from("customer_dues")
      .select("id, amount")
      .eq("shop_id", shopId)
      .gte("created_at", start)
      .lte("created_at", end),
    supabase
      .from("due_payments")
      .select("amount, due_id, customer_dues!inner(shop_id)")
      .eq("customer_dues.shop_id", shopId)
      .gte("payment_date", start)
      .lte("payment_date", end),
    supabase
      .from("customer_dues")
      .select("amount, paid_amount")
      .eq("shop_id", shopId)
      .eq("status", "pending"),
  ]);

  // Handle errors
  if (salesResult.error) console.error("[Reports API] Sales query error:", salesResult.error);
  if (expensesResult.error) console.error("[Reports API] Expenses query error:", expensesResult.error);
  if (duesAddedResult.error) console.error("[Reports API] Dues added query error:", duesAddedResult.error);
  if (duePaymentsResult.error) console.error("[Reports API] Due payments query error:", duePaymentsResult.error);
  if (pendingDuesResult.error) console.error("[Reports API] Pending dues query error:", pendingDuesResult.error);

  const sales = salesResult.data || [];
  const totalSales = sales.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const salesCount = sales.length;
  const averageSaleValue = salesCount > 0 ? totalSales / salesCount : 0;
  const cashSales = sales
    .filter((r) => r.payment_method === "cash")
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const upiSales = sales
    .filter((r) => r.payment_method !== "cash")
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const uniqueCustomers = new Set(
    sales
      .map((r) => r.customer_name)
      .filter((n): n is string => Boolean(n))
  ).size;

  const expenses = expensesResult.data || [];
  const totalExpenses = expenses.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const expensesCount = expenses.length;

  const duesAdded = duesAddedResult.data || [];
  const dueAdded = duesAdded.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const newDuesCount = duesAdded.length;

  const dueCollected = (duePaymentsResult.data || []).reduce(
    (s, r) => s + (Number(r.amount) || 0),
    0
  );

  const pendingDueBalance = (pendingDuesResult.data || []).reduce(
    (s, r) => s + ((Number(r.amount) || 0) - (Number(r.paid_amount) || 0)),
    0
  );

  const netProfit = totalSales - totalExpenses;
  const profitMarginPercent =
    totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  const dateStr = date.toISOString().split("T")[0];

  return {
    date: dateStr,
    shopName,
    totalSales,
    salesCount,
    averageSaleValue,
    cashSales,
    upiSales,
    totalExpenses,
    expensesCount,
    netProfit,
    profitMarginPercent,
    dueAdded,
    dueCollected,
    pendingDueBalance,
    newDuesCount,
    uniqueCustomersCount: uniqueCustomers,
    transactionsTotal: salesCount + expensesCount,
  };
}

/**
 * Fetch a weekly summary (last 7 days from the given date).
 */
export async function getWeeklyReport(
  userId: string,
  endDate: Date = new Date()
): Promise<WeeklySummary> {
  const shop = await resolveShopId(userId);
  if (!shop) throw new Error("Shop not found.");

  const { shopId } = shop;

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  const start = dayStart(startDate);
  const end = dayEnd(endDate);

  const [salesResult, expensesResult] = await Promise.all([
    supabase
      .from("sales")
      .select("amount, created_at")
      .eq("shop_id", shopId)
      .gte("created_at", start)
      .lte("created_at", end),
    supabase
      .from("expenses")
      .select("amount, created_at")
      .eq("shop_id", shopId)
      .gte("created_at", start)
      .lte("created_at", end),
  ]);

  const sales = salesResult.data || [];
  const expenses = expensesResult.data || [];

  // Build per-day map
  const days: { date: string; sales: number; expenses: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const daySales = sales
      .filter((r) => r.created_at.startsWith(dateStr))
      .reduce((s, r) => s + Number(r.amount), 0);
    const dayExp = expenses
      .filter((r) => r.created_at.startsWith(dateStr))
      .reduce((s, r) => s + Number(r.amount), 0);
    days.push({ date: dateStr, sales: daySales, expenses: dayExp });
  }

  const totalSales = days.reduce((s, d) => s + d.sales, 0);
  const totalExpenses = days.reduce((s, d) => s + d.expenses, 0);

  return {
    weekStart: startDate.toISOString().split("T")[0],
    weekEnd: endDate.toISOString().split("T")[0],
    totalSales,
    totalExpenses,
    netProfit: totalSales - totalExpenses,
    days,
  };
}

/**
 * Fetch a monthly summary for the month containing the given date.
 */
export async function getMonthlyReport(
  userId: string,
  date: Date = new Date()
): Promise<MonthlySummary> {
  const shop = await resolveShopId(userId);
  if (!shop) throw new Error("Shop not found.");

  const { shopId } = shop;

  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  const [salesResult, expensesResult, duePaymentsResult] = await Promise.all([
    supabase
      .from("sales")
      .select("amount")
      .eq("shop_id", shopId)
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString()),
    supabase
      .from("expenses")
      .select("amount")
      .eq("shop_id", shopId)
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString()),
    supabase
      .from("due_payments")
      .select("amount, customer_dues!inner(shop_id)")
      .eq("customer_dues.shop_id", shopId)
      .gte("payment_date", monthStart.toISOString())
      .lte("payment_date", monthEnd.toISOString()),
  ]);

  const totalSales = (salesResult.data || []).reduce((s, r) => s + Number(r.amount), 0);
  const totalExpenses = (expensesResult.data || []).reduce((s, r) => s + Number(r.amount), 0);
  const totalDueCollected = (duePaymentsResult.data || []).reduce(
    (s, r) => s + Number(r.amount),
    0
  );

  return {
    month: date.toLocaleString("en-IN", { month: "long", year: "numeric" }),
    totalSales,
    totalExpenses,
    netProfit: totalSales - totalExpenses,
    totalDueCollected,
  };
}
