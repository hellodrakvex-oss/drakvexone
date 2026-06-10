import { supabase } from './client';
import type { CustomerDue, NewDueInput, UpdateDueInput, DueStatus } from '@/lib/due/types';

/**
 * Create a new customer due in Supabase
 */
export async function createDue(
  userId: string,
  shopId: string,
  input: NewDueInput
): Promise<CustomerDue> {

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('customer_dues')
    .insert({
      user_id: userId,
      shop_id: shopId,
      customer_name: input.customerName,
      amount: input.amount,
      due_date: input.dueDate,
      phone: input.phone || '',  // Default to empty string if not provided
      status: 'pending',
      created_at: now,
      updated_at: now,
    })
    .select(
      'id, customer_name, amount, paid_amount, due_date, phone, notes, status, created_at, updated_at, paid_at'
    )
    .single();

  if (error) {
    console.error('[Due Supabase] Create error:', error);
    throw new Error(`Failed to create due: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned after creating due');
  }

  const due: CustomerDue = {
    id: data.id,
    customerName: data.customer_name,
    amount: data.amount,
    paidAmount: data.paid_amount || 0,
    dueDate: data.due_date,
    phone: data.phone || undefined,
    notes: data.notes || undefined,
    status: data.status as DueStatus,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    paidAt: data.paid_at || undefined,
    payments: [],
  };

  return due;
}

/**
 * Fetch all customer dues for a user
 */
export async function fetchDues(userId: string): Promise<CustomerDue[]> {

  const { data, error } = await supabase
    .from('customer_dues')
    .select('id, customer_name, amount, paid_amount, due_date, phone, notes, status, created_at, updated_at, paid_at, due_payments(id, amount, payment_date, notes, created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Due Supabase] Fetch error:', error);
    throw new Error(`Failed to fetch dues: ${error.message}`);
  }

  const dues: CustomerDue[] = (data || []).map((row: any) => ({
    id: row.id,
    customerName: row.customer_name,
    amount: row.amount,
    paidAmount: row.paid_amount || 0,
    dueDate: row.due_date,
    phone: row.phone || undefined,
    notes: row.notes || undefined,
    status: row.status as DueStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    paidAt: row.paid_at || undefined,
    payments: (row.due_payments || [])
      .map((p: any) => ({
        id: p.id,
        dueId: row.id,
        amount: p.amount,
        paymentDate: p.payment_date,
        notes: p.notes || undefined,
        createdAt: p.created_at,
      }))
      .sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()),
  }));

  return dues;
}

/**
 * Update an existing customer due
 */
export async function updateDue(
  id: string,
  input: UpdateDueInput
): Promise<CustomerDue> {

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('customer_dues')
    .update({
      customer_name: input.customerName,
      amount: input.amount,
      due_date: input.dueDate,
      phone: input.phone || '',  // Default to empty string if not provided
      notes: input.notes || null,
      updated_at: now,
    })
    .eq('id', id)
    .select(
      'id, customer_name, amount, paid_amount, due_date, phone, notes, status, created_at, updated_at, paid_at, due_payments(id, amount, payment_date, notes, created_at)'
    )
    .single();

  if (error) {
    console.error('[Due Supabase] Update error:', error);
    throw new Error(`Failed to update due: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned after updating due');
  }

  const due: CustomerDue = {
    id: data.id,
    customerName: data.customer_name,
    amount: data.amount,
    paidAmount: data.paid_amount || 0,
    dueDate: data.due_date,
    phone: data.phone || undefined,
    notes: data.notes || undefined,
    status: data.status as DueStatus,
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

  return due;
}

/**
 * Add a partial payment to a customer due
 */
export async function addPayment(
  userId: string,
  dueId: string,
  amount: number,
  notes?: string
): Promise<void> {

  const { error } = await supabase.from('due_payments').insert({
    user_id: userId,
    due_id: dueId,
    amount,
    notes: notes || null,
  });

  if (error) {
    console.error('[Due Supabase] Add payment error:', error);
    throw new Error(`Failed to add payment: ${error.message}`);
  }
}

/**
 * Delete a payment from a customer due
 */
export async function deletePayment(
  paymentId: string
): Promise<void> {

  const { error } = await supabase.from('due_payments').delete().eq('id', paymentId);

  if (error) {
    console.error('[Due Supabase] Delete payment error:', error);
    throw new Error(`Failed to delete payment: ${error.message}`);
  }
}

/**
 * Mark a customer due as paid in full
 */
export async function markDueAsPaid(id: string, userId: string): Promise<CustomerDue> {

  // Fetch the current remaining balance
  const { data: currentDue, error: fetchError } = await supabase
    .from('customer_dues')
    .select('amount, paid_amount')
    .eq('id', id)
    .single();

  if (fetchError || !currentDue) {
    throw new Error('Could not fetch due to mark as paid');
  }

  const remaining = currentDue.amount - (currentDue.paid_amount || 0);

  if (remaining > 0) {
    await addPayment(userId, id, remaining, 'Full settlement');
  }

  // The DB trigger will automatically update the due status to 'paid'.
  // We need to fetch and return the updated due to the frontend.
  const { data, error } = await supabase
    .from('customer_dues')
    .select(
      'id, customer_name, amount, paid_amount, due_date, phone, notes, status, created_at, updated_at, paid_at, due_payments(id, amount, payment_date, notes, created_at)'
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('Failed to retrieve updated due');
  }

  const due: CustomerDue = {
    id: data.id,
    customerName: data.customer_name,
    amount: data.amount,
    paidAmount: data.paid_amount || 0,
    dueDate: data.due_date,
    phone: data.phone || undefined,
    notes: data.notes || undefined,
    status: data.status as DueStatus,
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

  return due;
}

/**
 * Delete a customer due
 */
export async function deleteDue(id: string): Promise<void> {

  const { error } = await supabase
    .from('customer_dues')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Due Supabase] Delete error:', error);
    throw new Error(`Failed to delete due: ${error.message}`);
  }

}

/**
 * Migrate customer dues from localStorage to Supabase
 * Call this once during initial app hydration
 */
export async function migrateDuesFromLocalStorage(
  userId: string,
  shopId: string,
  localDues: any[]
): Promise<number> {
  if (!localDues || localDues.length === 0) {
    return 0;
  }


  let migratedCount = 0;
  const errors: any[] = [];

  for (const localDue of localDues) {
    try {
      // Check if due already exists in Supabase (by user_id + customer_name + created_at + amount)
      const { data: existing } = await supabase
        .from('customer_dues')
        .select('id')
        .eq('user_id', userId)
        .eq('customer_name', localDue.customerName)
        .eq('amount', localDue.amount)
        .gte('created_at', new Date(localDue.createdAt).toISOString().split('T')[0])
        .lte('created_at', new Date(new Date(localDue.createdAt).getTime() + 86400000).toISOString())
        .single();

      if (existing) {
        continue;
      }

      // Insert into Supabase
      const { error } = await supabase
        .from('customer_dues')
        .insert({
          user_id: userId,
          shop_id: shopId,
          customer_name: localDue.customerName,
          amount: localDue.amount,
          due_date: localDue.dueDate,
          phone: localDue.phone || '',  // Default to empty string if not provided
          notes: localDue.notes || null,
          status: localDue.status || 'pending',
          created_at: localDue.createdAt,
          updated_at: localDue.updatedAt || localDue.createdAt,
          paid_at: localDue.paidAt || null,
        });

      if (error) {
        console.error('[Due Migration] Error migrating due:', error);
        errors.push({ id: localDue.id, error });
      } else {
        migratedCount++;
      }
    } catch (err) {
      console.error('[Due Migration] Unexpected error:', err);
      errors.push({ id: localDue.id, error: err });
    }
  }

  if (errors.length > 0) {
    console.error('[Due Migration] Failed migrations:', errors);
  }

  return migratedCount;
}
