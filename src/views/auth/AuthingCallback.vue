<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore';
import { AuthingWxmp } from '@authing/weixin-official-account';

const router = useRouter();
const authStore = useAuthStore();

const authingWx = new AuthingWxmp({
  host: import.meta.env.VITE_AUTHING_HOST,
  appId: import.meta.env.VITE_AUTHING_APP_ID,
  redirectUrl: import.meta.env.VITE_AUTHING_REDIRECT,
  identifier: import.meta.env.VITE_AUTHING_IDENTIFIER,
});

interface AuthingUserInfo {
  token: string;
  identities: {
    provider: string;
    type: string;
    token: string;
    userIdInIdp: string;
  }[];
}

onMounted(async () => {
  try {
    const response = authingWx.getUserInfo();
    if (response.ok && response.userInfo) {
      const userInfo = response.userInfo as unknown as AuthingUserInfo;
      const wechatOpenId = userInfo.identities.find(
        identity => identity.provider === 'wechat' && identity.type === 'openid'
      );
      const wechatUnionId = userInfo.identities.find(
        identity => identity.provider === 'wechat' && identity.type === 'unionid'
      );
      await authStore.setAuthToken(userInfo.token, {
        openid: wechatOpenId?.userIdInIdp,
        unionid: wechatUnionId?.userIdInIdp,
      });
      await router.push('/');
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
});
</script>
