<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';

const { error } = useAuth0();
</script>

<template>
  <div>
    <p id="page-description">
      <span>{{ error }}</span>
    </p>
  </div>
</template>
