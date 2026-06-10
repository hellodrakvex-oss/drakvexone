import { supabase } from './client';

export type SearchResultItem = {
  id: string;
  type: 'sale' | 'expense' | 'due';
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  url: string;
};

export async function performGlobalSearch(userId: string, query: string): Promise<SearchResultItem[]> {
  if (!query || query.trim().length < 2) return [];

  const searchPattern = `%${query.trim()}%`;
  
  try {
    // Parallel queries to all three tables
    const [salesRes, expensesRes, duesRes] = await Promise.all([
      supabase
        .from('sales')
        .select('id, description, payment_method, amount, created_at')
        .eq('user_id', userId)
        .ilike('description', searchPattern)
        .limit(10),
        
      supabase
        .from('expenses')
        .select('id, category, description, amount, created_at')
        .eq('user_id', userId)
        .or(`category.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .limit(10),
        
      supabase
        .from('customer_dues')
        .select('id, customer_name, phone, amount, due_date')
        .eq('user_id', userId)
        .or(`customer_name.ilike.${searchPattern},phone.ilike.${searchPattern}`)
        .limit(10)
    ]);

    const results: SearchResultItem[] = [];

    if (salesRes.data) {
      results.push(...salesRes.data.map(s => ({
        id: s.id,
        type: 'sale' as const,
        title: s.description || 'Sale',
        subtitle: `Payment: ${s.payment_method}`,
        amount: s.amount,
        date: s.created_at,
        url: `/dashboard/sales?edit=${s.id}`
      })));
    }

    if (expensesRes.data) {
      results.push(...expensesRes.data.map(e => ({
        id: e.id,
        type: 'expense' as const,
        title: e.category,
        subtitle: e.description || 'No description',
        amount: e.amount,
        date: e.created_at,
        url: `/dashboard/expenses?edit=${e.id}`
      })));
    }

    if (duesRes.data) {
      results.push(...duesRes.data.map(d => ({
        id: d.id,
        type: 'due' as const,
        title: d.customer_name,
        subtitle: d.phone,
        amount: d.amount,
        date: d.due_date,
        url: `/dashboard/due?edit=${d.id}`
      })));
    }

    // Sort by most recent matching across all types
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('[Search] Global search error:', error);
    return [];
  }
}
