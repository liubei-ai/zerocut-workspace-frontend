import axios, { AxiosError, AxiosInstance } from 'axios';

import type { IssueCodeRequest, IssueCodeResponse, OauthAppPublic } from '@/types/oauth';

/**
 * OAuth 端点专用 axios 实例。
 *
 * 与 `api2client.ts` 的关键区别：**不挂载响应解包拦截器**。
 * 原因：后端的 `/oauth/*` 端点全部使用 `@NoTransform()`，返回 OAuth 标准 wire format
 * （`{ ak, name }` / `{ code }` 等），没有 `{ code, message, data }` 外层包裹。
 * 沿用 api2client 会让拦截器把这些原始返回值识别为「未知 code」从而 reject。
 *
 * 见 specs/006-oauth-authorize-service/contracts/oauth-api.openapi.yaml。
 */
const oauthClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API2_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 携带 zerocut-token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

/** 把 HttpExceptionFilter 的错误体抽出友好 message。 */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  return fallback;
}

export class OauthApiError extends Error {
  constructor(
    public readonly status: number | undefined,
    message: string
  ) {
    super(message);
    this.name = 'OauthApiError';
  }
}

function toOauthError(error: unknown, fallback: string): OauthApiError {
  if (error instanceof AxiosError) {
    return new OauthApiError(error.response?.status, extractErrorMessage(error, fallback));
  }
  return new OauthApiError(undefined, fallback);
}

/** GET /oauth/apps/:ak —— 公开查询 App 展示信息。 */
export async function getOauthApp(ak: string): Promise<OauthAppPublic> {
  try {
    const response = await oauthClient.get<OauthAppPublic>(`/oauth/apps/${encodeURIComponent(ak)}`);
    return response.data;
  } catch (error) {
    throw toOauthError(error, '应用查询失败');
  }
}

/** POST /oauth/code —— 用平台登录态签发一次性授权码。 */
export async function issueOauthCode(payload: IssueCodeRequest): Promise<IssueCodeResponse> {
  try {
    const response = await oauthClient.post<IssueCodeResponse>('/oauth/code', payload);
    return response.data;
  } catch (error) {
    throw toOauthError(error, '授权码签发失败');
  }
}
