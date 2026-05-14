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
