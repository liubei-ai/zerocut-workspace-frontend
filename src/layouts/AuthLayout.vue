<template>
  <div class="d-flex flex-grow-1 text-center">
    <v-card variant="outlined" class="d-flex align-center flex-column flex-grow-1 justify-center">
      <div class="layout-content ma-auto w-full">
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
</style>
