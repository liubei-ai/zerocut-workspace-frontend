<template>
  <div class="d-flex text-center flex-grow-1">
    <v-card
      variant="outlined"
      class="flex-grow-1 d-flex align-center justify-center flex-column"
    >
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
