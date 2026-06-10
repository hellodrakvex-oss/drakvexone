import { supabase } from './client';
import type { Expense, NewExpenseInput, ExpenseCategory } from '@/lib/expenses/types';

/**
 * Create a new expense in Supabase
 */
export async function createExpense(
  userId: string,
  shopId: string,
  input: NewExpenseInput
): Promise<Expense> {

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      shop_id: shopId,
      amount: input.amount,
      category: input.category,
      description: input.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, amount, category, description, created_at')
    .single();

  if (error) {
    console.error('[Expense Supabase] Create error:', error);
    throw new Error(`Failed to create expense: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned after creating expense');
  }

  const expense: Expense = {
    id: data.id,
    amount: data.amount,
    category: data.category as ExpenseCategory,
    description: data.description || undefined,
    createdAt: data.created_at,
  };

  return expense;
}

/**
 * Fetch all expenses for a user
 */
export async function fetchExpenses(userId: string): Promise<Expense[]> {

  const { data, error } = await supabase
    .from('expenses')
    .select('id, amount, category, description, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Expense Supabase] Fetch error:', error);
    throw new Error(`Failed to fetch expenses: ${error.message}`);
  }

  const expenses: Expense[] = (data || []).map((row: any) => ({
    id: row.id,
    amount: row.amount,
    category: row.category as ExpenseCategory,
    description: row.description || undefined,
    createdAt: row.created_at,
  }));

  return expenses;
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  id: string,
  input: NewExpenseInput
): Promise<Expense> {

  const { data, error } = await supabase
    .from('expenses')
    .update({
      amount: input.amount,
      category: input.category,
      description: input.description || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, amount, category, description, created_at')
    .single();

  if (error) {
    console.error('[Expense Supabase] Update error:', error);
    throw new Error(`Failed to update expense: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned after updating expense');
  }

  const expense: Expense = {
    id: data.id,
    amount: data.amount,
    category: data.category as ExpenseCategory,
    description: data.description || undefined,
    createdAt: data.created_at,
  };

  return expense;
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: string): Promise<void> {

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Expense Supabase] Delete error:', error);
    throw new Error(`Failed to delete expense: ${error.message}`);
  }

}

/**
 * Migrate expenses from localStorage to Supabase
 * Call this once during initial app hydration
 */
export async function migrateExpensesFromLocalStorage(
  userId: string,
  shopId: string,
  localExpenses: any[]
): Promise<number> {
  if (!localExpenses || localExpenses.length === 0) {
    return 0;
  }


  let migratedCount = 0;
  const errors: any[] = [];

  for (const localExpense of localExpenses) {
    try {
      // Check if expense already exists in Supabase (by user_id + created_at + amount)
      const { data: existing } = await supabase
        .from('expenses')
        .select('id')
        .eq('user_id', userId)
        .eq('amount', localExpense.amount)
        .gte('created_at', new Date(localExpense.createdAt).toISOString().split('T')[0])
        .lte('created_at', new Date(new Date(localExpense.createdAt).getTime() + 86400000).toISOString())
        .single();

      if (existing) {
        continue;
      }

      // Insert into Supabase
      const { error } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          shop_id: shopId,
          amount: localExpense.amount,
          category: localExpense.category,
          description: localExpense.description || null,
          created_at: localExpense.createdAt,
          updated_at: localExpense.createdAt,
        });

      if (error) {
        console.error('[Expense Migration] Error migrating expense:', error);
        errors.push({ id: localExpense.id, error });
      } else {
        migratedCount++;
      }
    } catch (err) {
      console.error('[Expense Migration] Unexpected error:', err);
      errors.push({ id: localExpense.id, error: err });
    }
  }

  if (errors.length > 0) {
    console.error('[Expense Migration] Failed migrations:', errors);
  }

  return migratedCount;
}
