<template>
  <div class="image-viewer">
    <v-img :src="fileUrl" cover height="200" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  fileUrl: string;
}>();
</script>

<style scoped lang="scss">
.image-viewer {
  width: 100%;
  height: 100%;
}
</style>
