import { Primitive } from '@tiptap/vue-3';
import { CheckoutResponse, type Product as BagelPayProduct } from 'bagelpay';
import client from './api2client';

interface BagelPayProducts {
  total: number;
  items: BagelPayProduct[];
}

export async function listBagelPayProducts() {
  const response = await client.get<BagelPayProducts>('/bagelpay/products');
  return response.data;
}

export interface CreateCheckoutPayload {
  productId: string;
  workspaceId: string;
  metadata: Record<string, Primitive>;
}

export async function createCheckout(payload: CreateCheckoutPayload) {
  const res = await client.post<CheckoutResponse>('/bagelpay/checkout', payload);
  return res.data;
}
