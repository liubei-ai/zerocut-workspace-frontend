<script setup lang="ts">
// 403 — 越权访问落地页。
// 触发场景：1) 前端路由守卫拦截无 meta.permissions 的访问；
//          2) 后端 admin 接口返回 403，被 api2client 拦截后跳到这里。
</script>
<template>
  <v-card variant="flat" height="100vh" class="d-flex align-center justify-center text-center">
    <div>
      <v-icon size="180" color="#00A9D7" class="mb-6">mdi-lock-outline</v-icon>
      <h1 class="text-h4 mb-3">403 · 无权限访问</h1>
      <p class="text-body-1 text-medium-emphasis mb-6">
        当前账号没有访问此资源的权限，请联系管理员。
      </p>
      <v-btn flat color="#00A9D7" class="mb-4 text-white" to="/">Go Back to Home</v-btn>
    </div>
  </v-card>
</template>
