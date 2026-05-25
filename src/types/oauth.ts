/**
 * OAuth 授权服务前端类型。
 *
 * 与 specs/006-oauth-authorize-service/contracts/oauth-api.openapi.yaml 对齐。
 */

/** GET /oauth/apps/:ak 响应 */
export interface OauthAppPublic {
  ak: string;
  name: string;
}

/**
 * OAuth 客户端类型（RFC 6749 §2.1）。
 * - `confidential`：默认。机密客户端，必须持有 sk。
 * - `public`：公共客户端，走 PKCE（RFC 7636），无 sk。适用于纯静态站 / SPA。
 *
 * 注册后**不可更改**。要切换须废弃旧 App + 用新 ak 重新注册。
 */
export enum OauthClientType {
  CONFIDENTIAL = 'confidential',
  PUBLIC = 'public',
}

/** POST /oauth/code 请求 */
export interface IssueCodeRequest {
  ak: string;
  redirectUri: string;
  /** PKCE：BASE64URL(SHA256(code_verifier))，43~128 字符。带则必须同时带 codeChallengeMethod。 */
  codeChallenge?: string;
  /** PKCE 算法；仅支持 S256。 */
  codeChallengeMethod?: 'S256';
}

/** POST /oauth/code 响应 */
export interface IssueCodeResponse {
  code: string;
}

/**
 * OAuth App 生命周期状态。
 * `deprecated` 为不可逆终态——用户在管理页点「废弃」后置为此态。
 */
export enum OauthAppStatus {
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
}

/** POST /oauth/apps 请求（与 POST /oauth/apps/register 同形态） */
export interface CreateOauthAppRequest {
  ak: string;
  redirectUri: string;
  name?: string;
  /** 缺省 confidential。public 强制 PKCE。 */
  clientType?: OauthClientType;
}

/**
 * POST /oauth/apps 响应（创建当次一次性返回明文 sk）。
 *
 * `public` 客户端的 sk 仍然返回（后端 schema 一致），但前端 **不应**展示给用户——
 * PKCE 不依赖 sk，展示反而误导用户去保管不该保管的密钥。
 */
export interface CreateOauthAppResponse {
  ak: string;
  sk: string;
}

/** GET /oauth/apps 列表项（sk 字段已脱敏） */
export interface OauthAppListItem {
  ak: string;
  name: string;
  redirectUri: string;
  skMasked: string;
  status: OauthAppStatus;
  clientType: OauthClientType;
  createdAt: string;
}

/** POST /oauth/apps/:ak/deprecate 响应 */
export interface DeprecateOauthAppResponse {
  ak: string;
  status: 'deprecated';
}
