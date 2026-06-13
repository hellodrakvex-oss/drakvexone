import { supabase } from './client';

/**
 * Dashboard data types
 */
export interface DashboardMetrics {
  shopName: string;
  todaySales: number;
  todayExpenses: number;
  profit: number;
  toCollect: number;
  pendingDuesCount: number;
  weeklySales: { day: string; sales: number }[];
  recentExpenses: {
    id: string;
    category: string;
    description: string | null;
    amount: number;
    created_at: string;
  }[];
  pendingDues: {
    id: string;
    customer_name: string;
    amount: number;
    paid_amount?: number;
    due_date: string;
    created_at: string;
  }[];
}

/**
 * Get the start of today in ISO format (local timezone)
 */
function todayStart(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

/**
 * Get the start of the day N days ago in ISO format
 */
function daysAgoStart(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Day labels for the weekly chart (Mon-Sun)
 */
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Fetch all dashboard metrics from Supabase for the authenticated user.
 * Returns zero values if no data exists — no mock/demo/seed fallbacks.
 */
export async function fetchDashboardData(userId: string): Promise<DashboardMetrics> {
  const today = todayStart();
  const weekAgo = daysAgoStart(6); // Last 7 days including today

  // Execute all queries in parallel
  const [
    shopResult,
    todaySalesResult,
    todayExpensesResult,
    pendingDuesResult,
    weeklySalesResult,
    recentExpensesResult
  ] = await Promise.all([
    // 1. Fetch shop name
    supabase
      .from('shops')
      .select('shop_name')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
      
    // 2. Fetch today's sales
    supabase
      .from('sales')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', today),
      
    // 3. Fetch today's expenses
    supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', today),
      
    // 4. Fetch pending customer dues
    supabase
      .from('customer_dues')
      .select('id, customer_name, amount, paid_amount, due_date, created_at')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('due_date', { ascending: true }),
      
    // 5. Fetch weekly sales
    supabase
      .from('sales')
      .select('amount, created_at')
      .eq('user_id', userId)
      .gte('created_at', weekAgo),
      
    // 6. Fetch recent expenses
    supabase
      .from('expenses')
      .select('id, category, description, amount, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)
  ]);

  const shopName = shopResult.data?.shop_name || 'Your Shop';

  const todaySales = (todaySalesResult.data || []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );

  const todayExpenses = (todayExpensesResult.data || []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );

  const pendingDues = pendingDuesResult.data || [];
  const toCollect = pendingDues.reduce(
    (sum, row) => sum + ((Number(row.amount) || 0) - (Number(row.paid_amount) || 0)),
    0
  );

  // Group by day of week
  const dayTotals = new Map<number, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    dayTotals.set(d.getDay(), 0);
  }

  for (const row of weeklySalesResult.data || []) {
    const dayIndex = new Date(row.created_at).getDay();
    dayTotals.set(dayIndex, (dayTotals.get(dayIndex) || 0) + (Number(row.amount) || 0));
  }

  // Build ordered chart data for last 7 days
  const weeklySales: { day: string; sales: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayIndex = d.getDay();
    weeklySales.push({
      day: DAY_LABELS[dayIndex],
      sales: dayTotals.get(dayIndex) || 0,
    });
  }

  // 7. Calculate profit
  const profit = todaySales - todayExpenses;

  return {
    shopName,
    todaySales,
    todayExpenses,
    profit,
    toCollect,
    pendingDuesCount: pendingDues.length,
    weeklySales,
    recentExpenses: recentExpensesResult.data || [],
    pendingDues: pendingDues.slice(0, 3),
  };
}
