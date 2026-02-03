<template>
  <div class="video-player">
    <video :src="fileUrl" controls class="video-player__element">
      Your browser does not support the video element.
    </video>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  fileUrl: string;
}>();
</script>

<style scoped lang="scss">
.video-player {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(var(--v-theme-surface-variant));

  &__element {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
