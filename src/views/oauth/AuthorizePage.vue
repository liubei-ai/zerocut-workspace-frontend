<template>
  <div class="oauth-authorize">
    <!-- 状态 1：URL 参数不合法 -->
    <template v-if="status === 'invalid'">
      <h2 class="text-h6 mb-3">{{ t('oauth.linkInvalid') }}</h2>
      <p class="text-body-2 text-medium-emphasis">
        {{ invalidReason || t('oauth.linkInvalidDetail') }}
      </p>
    </template>

    <!-- 状态 2：App 加载中 -->
    <template v-else-if="status === 'loading'">
      <v-progress-circular indeterminate color="primary" class="my-6" />
      <p class="text-body-2 text-medium-emphasis">{{ t('oauth.loading') }}</p>
    </template>

    <!-- 状态 3a：App 不存在 -->
    <template v-else-if="status === 'app-not-found'">
      <h2 class="text-h6 mb-3">{{ t('oauth.appNotFound') }}</h2>
      <p class="text-body-2 text-medium-emphasis">{{ t('oauth.appNotFoundDetail') }}</p>
    </template>

    <!-- 状态 3b：已登录 + App 已加载 → 授权确认 -->
    <template v-else-if="status === 'ready' && app">
      <h2 class="text-h6 mb-2">{{ app.name }}</h2>
      <p class="text-body-2 text-medium-emphasis mb-6">{{ t('oauth.requestingAccess') }}</p>

      <v-card variant="tonal" class="pa-4 mb-6 text-left">
        <div class="text-caption text-medium-emphasis">{{ t('oauth.currentUserLabel') }}</div>
        <div class="text-body-1 mt-1">{{ currentUserLabel }}</div>
      </v-card>

      <div class="d-flex ga-2 justify-end">
        <v-btn variant="text" :disabled="submitting" @click="onCancel">
          {{ t('oauth.cancel') }}
        </v-btn>
        <v-btn color="primary" :loading="submitting" @click="onAuthorize">
          {{ t('oauth.authorize') }}
        </v-btn>
      </div>
    </template>

    <!-- 错误 Snackbar（授权失败等） -->
    <v-snackbar v-model="showError" color="error" timeout="5000" location="top">
      {{ errorMessage }}
      <template #actions>
        <v-btn variant="text" color="white" @click="showError = false">
          {{ $t('common.close') }}
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import type { OauthAppPublic } from '@/types/oauth';

import { getOauthApp, issueOauthCode, OauthApiError } from '@/api/oauthApi';
import { useUserStore } from '@/stores/userStore';

/**
 * OAuth 授权确认页（FR-015 四态机）。
 *
 * 见 specs/006-oauth-authorize-service/spec.md。
 */

type Status = 'invalid' | 'loading' | 'app-not-found' | 'ready';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const status = ref<Status>('loading');
const invalidReason = ref<string>('');
const app = ref<OauthAppPublic | null>(null);
const submitting = ref(false);
const showError = ref(false);
const errorMessage = ref('');

const ak = computed(() => normalizeQuery(route.query.ak));
const redirectUri = computed(() => normalizeQuery(route.query.redirect_uri));
const state = computed(() => normalizeQuery(route.query.state) ?? '');
/**
 * PKCE（RFC 7636）。公共客户端必传；机密客户端可选。
 * 本页不做格式校验，原样透传给 `/oauth/code`，由服务端 DTO 兜底
 * （正则与 server/src/modules/oauth/dto/issue-code.dto.ts 一致）。
 */
const codeChallenge = computed(() => normalizeQuery(route.query.code_challenge));
const codeChallengeMethod = computed(() => {
  const v = normalizeQuery(route.query.code_challenge_method);
  return v === 'S256' ? ('S256' as const) : undefined;
});

const currentUserLabel = computed(() => {
  const u = userStore.userInfo;
  if (!u) return '';
  return u.name || u.username || u.email || `#${u.id ?? ''}`;
});

function normalizeQuery(v: unknown): string | undefined {
  if (typeof v === 'string' && v.length > 0) return v;
  return undefined;
}

/**
 * 允许 https://... 或 http://localhost(:port)?(/...)?。
 * 与服务端 server/src/modules/oauth/dto/register-app.dto.ts REDIRECT_URI_PATTERN 一致。
 *
 * 安全性：localhost 只解析到本机，远程攻击者无法借此把用户重定向到攻击者控制的地址；
 * 这是 RFC 8252（Native Apps OAuth）推荐做法。其余 http:// 仍然拒绝，防止
 * 开放重定向（open redirect）攻击。
 */
const REDIRECT_URI_PATTERN = /^(https:\/\/|http:\/\/localhost(:\d+)?(\/|$))/;

/** 同站路径白名单（FR-019），只允许 `/...`，禁掉 `//` 和 `/\\`。 */
function isSafeRedirect(value: unknown): value is string {
  return typeof value === 'string' && /^\/(?!\/|\\)/.test(value);
}

function showSnackbar(message: string) {
  errorMessage.value = message;
  showError.value = true;
}

onMounted(async () => {
  // —— 状态 1：URL 参数不合法 ——
  if (!ak.value || !redirectUri.value) {
    status.value = 'invalid';
    return;
  }
  if (!REDIRECT_URI_PATTERN.test(redirectUri.value)) {
    status.value = 'invalid';
    invalidReason.value = t('oauth.invalidRedirect');
    return;
  }

  // —— 状态 2：未登录 → 跳登录页并保留参数 ——
  if (!userStore.isLoggedIn) {
    const target = route.fullPath;
    if (!isSafeRedirect(target)) {
      // 兜底：不该发生，因为 route.fullPath 本就是站内路径
      status.value = 'invalid';
      return;
    }
    const authRouteName =
      import.meta.env.VITE_AUTH_MODE === 'auth0' ? 'auth-auth0' : 'auth-authing';
    await router.replace({ name: authRouteName, query: { redirect: target } });
    return;
  }

  // —— 状态 3：拉 App 信息 ——
  try {
    app.value = await getOauthApp(ak.value);
    status.value = 'ready';
  } catch (error) {
    if (error instanceof OauthApiError && error.status === 404) {
      status.value = 'app-not-found';
    } else {
      status.value = 'invalid';
      invalidReason.value = error instanceof Error ? error.message : t('oauth.linkInvalidDetail');
    }
  }
});

async function onAuthorize() {
  if (!ak.value || !redirectUri.value) return;
  if (!REDIRECT_URI_PATTERN.test(redirectUri.value)) {
    showSnackbar(t('oauth.invalidRedirect'));
    return;
  }
  submitting.value = true;
  try {
    const { code } = await issueOauthCode({
      ak: ak.value,
      redirectUri: redirectUri.value,
      // PKCE 透传：成对传入或一起省略（service 层会校验配对）
      ...(codeChallenge.value && codeChallengeMethod.value
        ? {
            codeChallenge: codeChallenge.value,
            codeChallengeMethod: codeChallengeMethod.value,
          }
        : {}),
    });
    const sep = redirectUri.value.includes('?') ? '&' : '?';
    const target = `${redirectUri.value}${sep}code=${encodeURIComponent(code)}&state=${encodeURIComponent(state.value)}`;
    // 这里必须用 location 跳出 SPA，目标是 `*.zerocut.vip` 跨站
    window.location.replace(target);
  } catch (error) {
    const message =
      error instanceof OauthApiError && error.message ? error.message : t('oauth.issueCodeFailed');
    showSnackbar(message);
  } finally {
    submitting.value = false;
  }
}

function onCancel() {
  // 仅返回上一页；如无历史则跳到 /
  if (window.history.length > 1) {
    router.back();
  } else {
    router.replace('/');
  }
}
</script>

<style scoped>
.oauth-authorize {
  padding: 24px;
}
</style>
