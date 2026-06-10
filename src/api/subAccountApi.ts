import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

import type {
  AmountConsumptionRecord,
  ApiResponse,
  PaginationResponse,
  SubAccountSessionInfo,
} from '@/types/api';

import { extractApiMessageFromPayload } from '@/utils/apiError';

/**
 * 子账号专用 axios 实例。
 *
 * 与主站 api2client 隔离：401 不跳主站登录，而是把错误抛回给子账号页面自行处理
 * （登录失败需停留在子账号登录页并提示，会话过期需回子账号登录页）。
 */
const subAccountClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API2_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 携带 httpOnly 子账号 cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

subAccountClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, data, message, details } = response.data;
    if (code === 200 || code === 201 || code === 0) {
      return { ...response, data };
    }
    return Promise.reject({ code, message, details });
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      return Promise.reject({
        code: status,
        message:
          extractApiMessageFromPayload(responseData) ||
          error.response.statusText ||
          error.message ||
          'Request failed',
        details: responseData,
      });
    }
    return Promise.reject({ code: 0, message: 'Network error', details: error });
  }
);

export interface SubAccountConsumptionQuery {
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

/** 子账号登录：workspaceId（16 位字符串）+ 密钥后 8 位 */
export async function subAccountLogin(
  workspaceId: string,
  apiKeySuffix: string
): Promise<SubAccountSessionInfo> {
  const res = await subAccountClient.post<SubAccountSessionInfo>('/sub-account/login', {
    workspaceId,
    apiKeySuffix,
  });
  return res.data;
}

/** 子账号登出 */
export async function subAccountLogout(): Promise<void> {
  await subAccountClient.post('/sub-account/logout');
}

/** 子账号查询消费记录（金额化） */
export async function getSubAccountConsumptionRecords(
  params: SubAccountConsumptionQuery
): Promise<PaginationResponse<AmountConsumptionRecord>> {
  const res = await subAccountClient.get<PaginationResponse<AmountConsumptionRecord>>(
    '/sub-account/consumption/records',
    { params }
  );
  return res.data;
}
