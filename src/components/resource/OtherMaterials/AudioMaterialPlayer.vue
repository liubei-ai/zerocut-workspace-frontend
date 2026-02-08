<template>
  <div class="audio-player">
    <div class="audio-player__icon">
      <v-icon icon="mdi-music" size="64" color="purple" />
    </div>
    <div class="audio-player__controls">
      <audio :src="fileUrl" controls class="audio-player__element">
        Your browser does not support the audio element.
      </audio>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  fileUrl: string;
}>();
</script>

<style scoped lang="scss">
.audio-player {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgb(var(--v-theme-surface-variant));

  &__icon {
    margin-bottom: 1rem;
  }

  &__controls {
    width: 100%;
  }

  &__element {
    width: 100%;
    max-width: 300px;
  }
}
</style>
