import client from './api2client';

export interface BagelPayProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingType: 'subscription';
  recurringInterval?: 'monthly' | 'yearly';
  productUrl?: string;
}

export async function listBagelPayProducts() {
  const response = await client.get<{ total: number; items: BagelPayProduct[] }>(
    '/bagelpay/products'
  );
  return response.data;
}
