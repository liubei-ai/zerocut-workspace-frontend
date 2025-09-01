# @authing/guard-vue3 快速开始

## 引入并初始化 Guard

```vue
// 代码示例：https://github.com/Authing/Guard/tree/v5/examples/guard-vue3/normal/src/main.ts //
main.ts import { createApp } from 'vue' import { createGuard } from '@authing/guard-vue3' import
'@authing/guard-vue3/dist/esm/guard.min.css' // 你的业务代码根组件 import App from './App.vue' const
app = createApp(App) app.use( createGuard({ appId: "AUTHING_APP_ID", // 如果你使用的是私有化部署的
Authing 服务，需要传入自定义 host，如: // host: 'https://my-authing-app.example.com', //
默认情况下，会使用你在 Authing 控制台中配置的第一个回调地址为此次认证使用的回调地址。 //
如果你配置了多个回调地址，也可以手动指定（此地址也需要加入到应用的「登录回调 URL」中）： //
redirectUri: "YOUR_REDIRECT_URI" }) );
```

## 渲染 Guard

```html
<div id="authing-guard-container"></div>
```

```vue
// 代码示例：https://github.com/Authing/Guard/tree/v5/examples/guard-vue3/normal/src/views/Embed.vue
// Embed.vue import { ref, onMounted } from 'vue' import { useGuard } from '@authing/guard-vue3'
import type { User, RefreshToken, AuthenticationClient } from '@authing/guard-vue3' const guard =
useGuard() onMounted(() => { // 使用 start 方法挂载 Guard 组件到你指定的 DOM 节点，登录成功后返回
userInfo guard.start('#authing-guard-container').then((user: User) => { console.log("userInfo: ",
user) }) })
```
