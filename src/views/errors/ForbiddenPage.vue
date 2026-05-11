<script setup lang="ts">
// 403 — 越权访问落地页。前端守卫拦截无权限访问后跳到这里。
</script>
<template>
  <v-card variant="flat" height="100vh" class="d-flex align-center justify-center text-center">
    <div>
      <v-icon size="120" color="#00A9D7" class="mb-6">mdi-lock-outline</v-icon>
      <h1 class="text-h4 mb-3">无权限访问</h1>
      <p class="text-body-1 text-medium-emphasis mb-6">
        当前账号没有访问此页面的权限，请联系管理员。
      </p>
      <v-btn flat color="#00A9D7" class="text-white" to="/">返回首页</v-btn>
    </div>
  </v-card>
</template>
