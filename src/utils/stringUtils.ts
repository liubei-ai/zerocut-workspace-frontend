/**
 * 脱敏API密钥显示
 * @param apiKey 原始API密钥
 * @returns 脱敏后的API密钥
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 8) {
    return apiKey;
  }
  const start = apiKey.substring(0, 19); // 前3位固定是'sk-'，4-19是 workspaceId
  const end = apiKey.substring(apiKey.length - 8);
  const middle = '*'.repeat(4); // 固定9个星号
  return `${start}${middle}${end}`;
}
