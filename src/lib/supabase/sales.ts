import { supabase } from './client';
import type { NewSaleInput, Sale, PaymentMethod } from '@/lib/sales/types';

export async function getUserShopId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();


  if (error || !data) {
    console.error('[Sales API] Failed to fetch shop id', error);
    return null;
  }
  return data.id;
}

export async function getSales(shopId: string): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Sales API] Failed to fetch sales:', error);
    throw error;
  }

  return data.map((row) => ({
    id: row.id,
    amount: row.amount,
    customerName: row.customer_name || undefined,
    phone: row.phone || undefined,
    itemName: row.description || undefined,
    paymentMethod: row.payment_method as PaymentMethod,
    notes: row.reference_number || undefined,
    createdAt: row.created_at,
  }));
}

export async function createSale(
  userId: string,
  shopId: string,
  input: NewSaleInput
): Promise<Sale> {
  const { data, error } = await supabase
    .from('sales')
    .insert({
      user_id: userId,
      shop_id: shopId,
      amount: input.amount,
      customer_name: input.customerName || null,
      phone: input.phone || null,
      description: input.itemName || null,
      payment_method: input.paymentMethod,
      reference_number: input.notes || null,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('[Sales API] Failed to create sale:', error);
    throw error;
  }

  return {
    id: data.id,
    amount: data.amount,
    customerName: data.customer_name || undefined,
    phone: data.phone || undefined,
    itemName: data.description || undefined,
    paymentMethod: data.payment_method as PaymentMethod,
    notes: data.reference_number || undefined,
    createdAt: data.created_at,
  };
}

export async function updateSale(saleId: string, input: NewSaleInput): Promise<Sale> {
  const { data, error } = await supabase
    .from('sales')
    .update({
      amount: input.amount,
      customer_name: input.customerName || null,
      phone: input.phone || null,
      description: input.itemName || null,
      payment_method: input.paymentMethod,
      reference_number: input.notes || null,
    })
    .eq('id', saleId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[Sales API] Failed to update sale:', error);
    throw error;
  }

  return {
    id: data.id,
    amount: data.amount,
    customerName: data.customer_name || undefined,
    phone: data.phone || undefined,
    itemName: data.description || undefined,
    paymentMethod: data.payment_method as PaymentMethod,
    notes: data.reference_number || undefined,
    createdAt: data.created_at,
  };
}

export async function deleteSale(saleId: string): Promise<void> {
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', saleId);

  if (error) {
    console.error('[Sales API] Failed to delete sale:', error);
    throw error;
  }
}
