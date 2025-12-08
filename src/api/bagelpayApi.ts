import { type Product as BagelPayProduct } from 'bagelpay';
import client from './api2client';

export async function listBagelPayProducts() {
  const response = await client.get<{ total: number; items: BagelPayProduct[] }>(
    '/bagelpay/products'
  );
  return response.data;
}
