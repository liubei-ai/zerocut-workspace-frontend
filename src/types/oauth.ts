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

/** POST /oauth/code 请求 */
export interface IssueCodeRequest {
  ak: string;
  redirectUri: string;
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
}

/** POST /oauth/apps 响应（创建当次一次性返回明文 sk） */
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
  createdAt: string;
}

/** POST /oauth/apps/:ak/deprecate 响应 */
export interface DeprecateOauthAppResponse {
  ak: string;
  status: 'deprecated';
}
