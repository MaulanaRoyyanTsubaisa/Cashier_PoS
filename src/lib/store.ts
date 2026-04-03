import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Product = Tables<'products'>;
export type Transaction = Tables<'transactions'> & { details: TransactionDetail[] };
export type TransactionDetail = Tables<'transaction_details'>;
export type StockMovement = Tables<'stock_movements'>;

// Products
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function addProduct(p: { name: string; price: number; stock: number; category: string }): Promise<Product> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('products').insert({ ...p, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const { error } = await supabase.from('products').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// Transactions
export async function getTransactions(): Promise<Transaction[]> {
  const { data: txs, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  if (!txs || txs.length === 0) return [];

  const { data: details } = await supabase.from('transaction_details').select('*').in('transaction_id', txs.map(t => t.id));

  return txs.map(t => ({
    ...t,
    details: (details || []).filter(d => d.transaction_id === t.id),
  }));
}

export async function saveTransaction(
  cart: { productId: string; productName: string; quantity: number; price: number }[],
  paid: number
): Promise<Transaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const total = cart.reduce((s, i) => s + i.quantity * i.price, 0);

  // Create transaction
  const { data: tx, error: txError } = await supabase.from('transactions').insert({
    user_id: user.id,
    total,
    paid,
    change: paid - total,
  }).select().single();
  if (txError) throw txError;

  // Create details
  const { data: details, error: detError } = await supabase.from('transaction_details').insert(
    cart.map(c => ({
      transaction_id: tx.id,
      product_id: c.productId,
      product_name: c.productName,
      quantity: c.quantity,
      price: c.price,
    }))
  ).select();
  if (detError) throw detError;

  // Update stock & create movements
  for (const item of cart) {
    const { data: product } = await supabase.from('products').select('stock').eq('id', item.productId).single();
    if (product) {
      await supabase.from('products').update({ stock: Math.max(0, product.stock - item.quantity) }).eq('id', item.productId);
    }
    await supabase.from('stock_movements').insert({
      user_id: user.id,
      product_id: item.productId,
      product_name: item.productName,
      type: 'OUT',
      quantity: item.quantity,
      note: `Penjualan #${tx.id.slice(0, 8)}`,
    });
  }

  return { ...tx, details: details || [] };
}

// Stock Movements
export async function getStockMovements(): Promise<StockMovement[]> {
  const { data, error } = await supabase.from('stock_movements').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addStockIn(productId: string, quantity: number, note: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: product } = await supabase.from('products').select('stock, name').eq('id', productId).single();
  if (!product) throw new Error('Product not found');

  await supabase.from('products').update({ stock: product.stock + quantity }).eq('id', productId);
  await supabase.from('stock_movements').insert({
    user_id: user.id,
    product_id: productId,
    product_name: product.name,
    type: 'IN',
    quantity,
    note,
  });
}

export async function adjustStock(productId: string, actualStock: number, note: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: product } = await supabase.from('products').select('stock, name').eq('id', productId).single();
  if (!product) throw new Error('Product not found');

  const diff = actualStock - product.stock;
  await supabase.from('products').update({ stock: actualStock }).eq('id', productId);
  await supabase.from('stock_movements').insert({
    user_id: user.id,
    product_id: productId,
    product_name: product.name,
    type: 'SO',
    quantity: diff,
    note: note || `Stock Opname: ${diff >= 0 ? '+' : ''}${diff}`,
  });
}

// Helpers
export function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
