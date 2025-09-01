# 获取用户信息

```ts
class Guard {
  async trackSession(): Promise<User | null> {}
}
```

```vue
<script lang="ts" setup>
// 代码示例：https://github.com/Authing/Guard/tree/v5/examples/guard-vue3/normal/src/views/Embed.vue
import { useGuard } from '@authing/guard-vue3';

import type { User } from '@authing/guard-vue3';

const guard = useGuard();

const getUserInfo = async () => {
  // 获取用户信息
  const userInfo: User | null = await guard.trackSession();
  console.log('userInfo: ', userInfo);
};
</script>
```
