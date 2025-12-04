import client from './api2client';

export interface BagelPayProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingType: 'subscription' | 'single_payment';
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | '3months' | '6months';
  productUrl?: string;
}

export async function listBagelPayProducts() {
  const response = await client.get<{ total: number; items: BagelPayProduct[] }>(
    '/bagelpay/products'
  );
  return response.data;
}
