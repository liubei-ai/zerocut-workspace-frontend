import apiClient from './api2client';

export type AccountStatus = 'normal' | 'expiring_soon' | 'expired';

export interface XiaoYanqueAccountListItem {
  id: number;
  phone: string;
  nearestExpiry: number | null;
  status: AccountStatus;
  cookies: CookieItem[];
  createdAt: string;
  updatedAt: string;
}

export interface XiaoYanqueAccountListResponse {
  list: XiaoYanqueAccountListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface QueryXiaoYanqueAccountsParams {
  page?: number;
  limit?: number;
  phone?: string;
}

export interface CookieItem {
  domain: string;
  name: string;
  value: string;
  path: string;
  expirationDate?: number;
  session: boolean;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
  hostOnly: boolean;
  storeId?: string;
  id?: number;
}

export interface CreateXiaoYanqueAccountParams {
  phone: string;
  cookies: CookieItem[];
}

export interface UpdateXiaoYanqueAccountCookiesParams {
  cookies: CookieItem[];
}

export async function listXiaoYanqueAccounts(params: QueryXiaoYanqueAccountsParams = {}) {
  const response = await apiClient.get<XiaoYanqueAccountListResponse>(
    '/admin/xiaoyanque-accounts',
    { params }
  );
  return response.data;
}

export async function createXiaoYanqueAccount(params: CreateXiaoYanqueAccountParams) {
  const response = await apiClient.post<XiaoYanqueAccountListItem>(
    '/admin/xiaoyanque-accounts',
    params
  );
  return response;
}

export async function updateXiaoYanqueAccountCookies(
  id: number,
  params: UpdateXiaoYanqueAccountCookiesParams
) {
  const response = await apiClient.put<XiaoYanqueAccountListItem>(
    `/admin/xiaoyanque-accounts/${id}/cookies`,
    params
  );
  return response.data;
}

export async function deleteXiaoYanqueAccount(id: number) {
  const response = await apiClient.delete<{ message: string }>(`/admin/xiaoyanque-accounts/${id}`);
  return response.data;
}
