<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore';
import { AuthingWxmp } from '@authing/weixin-official-account';

const router = useRouter();
const authStore = useAuthStore();

const authingWx = new AuthingWxmp({
  host: import.meta.env.VITE_AUTHING_HOST,
  appId: import.meta.env.VITE_AUTHING_APP_ID,
  identifier: import.meta.env.VITE_AUTHING_IDENTIFIER,
  redirectUrl: import.meta.env.VITE_AUTHING_REDIRECT,
});

onMounted(async () => {
  try {
    const response = authingWx.getUserInfo();
    if (response.ok && response.userInfo) {
      console.log('authing callback', response.userInfo);
      await authStore.setAuthToken((response.userInfo as unknown as { token: string }).token);
      await router.push('/');
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
});
</script>
