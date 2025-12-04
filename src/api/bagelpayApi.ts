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

export interface ListProductsParams {
  page?: number;
  limit?: number;
}

export async function listBagelPayProducts(params: ListProductsParams = {}) {
  const response = await client.get<BagelPayProduct[]>('/bagelpay/products', { params });
  return response.data;
}
