<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';

const { loginWithRedirect } = useAuth0();
</script>

<template>
  <div>
    <v-btn @click="loginWithRedirect">Login with Auth0</v-btn>
  </div>
</template>
