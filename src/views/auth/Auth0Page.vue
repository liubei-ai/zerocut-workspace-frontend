<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import { ref } from 'vue';

const { loginWithRedirect } = useAuth0();

const errorMessage = ref<string | null>(null);

const handleLogin = async () => {
  errorMessage.value = null;
  try {
    await loginWithRedirect();
  } catch (error: unknown) {
    console.error('Auth0 login failed', error);
    errorMessage.value = 'Login failed. Please try again.';
  }
};
</script>

<template>
  <div>
    <v-btn @click="handleLogin">Login with Auth0</v-btn>
    <div v-if="errorMessage" class="text-error mt-2">
      {{ errorMessage }}
    </div>
  </div>
</template>
