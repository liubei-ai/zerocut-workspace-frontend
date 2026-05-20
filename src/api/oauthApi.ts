import axios, { AxiosError, AxiosInstance } from 'axios';

import type {
  CreateOauthAppRequest,
  CreateOauthAppResponse,
  DeprecateOauthAppResponse,
  IssueCodeRequest,
  IssueCodeResponse,
  OauthAppListItem,
  OauthAppPublic,
} from '@/types/oauth';

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

/**
 * POST /oauth/apps —— 用户自助创建 App（带登录态）。
 *
 * 与 `POST /oauth/apps/register`（外部发布器走的 NoAuth 入口）相对，这里 ownerUserId
 * 会自动绑定到当前登录用户。响应中的明文 `sk` **仅本次出现**，必须立刻让用户保存。
 */
export async function createMyOauthApp(
  payload: CreateOauthAppRequest
): Promise<CreateOauthAppResponse> {
  try {
    const response = await oauthClient.post<CreateOauthAppResponse>('/oauth/apps', payload);
    return response.data;
  } catch (error) {
    throw toOauthError(error, 'App 创建失败');
  }
}

/** GET /oauth/apps —— 列出当前用户名下所有 App（sk 字段后端已脱敏）。 */
export async function getMyOauthApps(): Promise<OauthAppListItem[]> {
  try {
    const response = await oauthClient.get<OauthAppListItem[]>('/oauth/apps');
    return response.data;
  } catch (error) {
    throw toOauthError(error, 'App 列表加载失败');
  }
}

/**
 * POST /oauth/apps/:ak/deprecate —— 永久废弃指定 App（不可逆）。
 *
 * 调用前必须让用户输入完整 ak 全文做二次确认（在视图层强制）。
 * 调用成功后该 ak 永远不能再被任何人重新注册；如要继续使用须用新 ak 重新创建 App。
 */
export async function deprecateOauthApp(ak: string): Promise<DeprecateOauthAppResponse> {
  try {
    const response = await oauthClient.post<DeprecateOauthAppResponse>(
      `/oauth/apps/${encodeURIComponent(ak)}/deprecate`
    );
    return response.data;
  } catch (error) {
    throw toOauthError(error, '废弃失败');
  }
}
