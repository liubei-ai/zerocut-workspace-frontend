<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
// 路由可通过 meta.wide 让内容区占满宽度（默认居中、最大 480px）
const wide = computed(() => Boolean(route.meta?.wide));
</script>

<template>
  <div class="d-flex flex-grow-1 text-center">
    <v-card variant="outlined" class="d-flex align-center flex-column flex-grow-1 justify-center">
      <div class="layout-content ma-auto w-full" :class="{ 'layout-content--wide': wide }">
        <slot></slot>
      </div>
      <div class="pa-5">Liubei AI 2025 © All Rights Reserved</div>
    </v-card>
  </div>
</template>

<style lang="scss" scoped>
.layout-content {
  max-width: 480px;
}

.layout-content--wide {
  max-width: 80%;
}
</style>
