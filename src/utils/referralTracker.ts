/**
 * 推广邀请码客户端归因。
 *
 * 流程：
 * 1. App 启动时调用 captureRefFromUrl()：如 URL 含 `?ref=XXXX`，写 cookie + localStorage，
 *    last-click 语义：每次新链接都覆盖旧值（未注册用户）。
 * 2. 注册时调用 getStoredRef()：把 `{ code, seenAt }` 透传给 `/auth/sync` body，
 *    服务端校验窗口期后写 `user_referrals`。
 * 3. Cookie domain `.zerocut.cn`，跨主站 / workspace 共享；非 HttpOnly 供前端可读。
 */

const COOKIE_NAME = 'ref_code';
const COOKIE_SEEN_NAME = 'ref_seen_at';
const STORAGE_KEY = 'zerocut_ref';
const COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 天兜底（实际窗口期服务端按 channel 配置判定）

export interface StoredRef {
  code: string;
  seenAt: string;
  landingHost?: string;
}

function getCookieDomain(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  // 共享 .zerocut.cn 子域
  if (host.endsWith('.zerocut.cn') || host === 'zerocut.cn') return '.zerocut.cn';
  return null;
}

function setCookie(name: string, value: string) {
  const domain = getCookieDomain();
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    `Path=/`,
    `SameSite=Lax`,
  ];
  if (domain) parts.push(`Domain=${domain}`);
  if (window.location.protocol === 'https:') parts.push('Secure');
  document.cookie = parts.join('; ');
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const target = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) {
      return decodeURIComponent(trimmed.slice(target.length));
    }
  }
  return null;
}

/**
 * 启动时调用：如 URL 含 `?ref=`，覆盖之前的归因。
 * 已登录用户访问不会影响 DB 中的归因（user_referrals.user_id 唯一约束）。
 */
export function captureRefFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const rawCode = url.searchParams.get('ref');
    if (!rawCode) return;

    const code = rawCode.trim().toUpperCase();
    if (!code || code.length > 16) return;

    const stored: StoredRef = {
      code,
      seenAt: new Date().toISOString(),
      landingHost: window.location.hostname,
    };

    setCookie(COOKIE_NAME, stored.code);
    setCookie(COOKIE_SEEN_NAME, stored.seenAt);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* 隐私浏览器禁用 localStorage 时忽略 */
    }
  } catch {
    /* URL 解析失败时静默 */
  }
}

/**
 * 注册时调用：拿到 cookie/localStorage 里的 ref，附带给 /auth/sync /auth0/sync。
 */
export function getStoredRef(): StoredRef | null {
  if (typeof window === 'undefined') return null;

  const cookieCode = readCookie(COOKIE_NAME);
  const cookieSeen = readCookie(COOKIE_SEEN_NAME);
  if (cookieCode) {
    return {
      code: cookieCode,
      seenAt: cookieSeen ?? new Date().toISOString(),
      landingHost: window.location.hostname,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRef;
    if (!parsed.code) return null;
    return parsed;
  } catch {
    return null;
  }
}
