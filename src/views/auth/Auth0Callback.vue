<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth0 } from '@auth0/auth0-vue';

const { error, isLoading, handleRedirectCallback } = useAuth0();
const route = useRoute();
const router = useRouter();

const redirectTarget = computed(() => {
  const redirect = route.query.redirect;

  if (Array.isArray(redirect)) {
    return redirect[0] || '/';
  }

  if (typeof redirect === 'string' && redirect.trim() !== '') {
    return redirect;
  }

  return '/';
});

const displayError = computed(() => {
  if (!error.value) {
    return '';
  }

  const err = error.value as unknown as { message?: string };
  return err.message ?? String(error.value);
});

onMounted(async () => {
  try {
    await handleRedirectCallback();
    await router.replace(redirectTarget.value);
  } catch {
    // Any error during callback handling will be reflected in `error`
  }
});
</script>

<template>
  <div>
    <p id="page-description">
      <span v-if="isLoading">Signing you in, please wait...</span>
      <span v-else-if="displayError">{{ displayError }}</span>
      <span v-else>Redirecting...</span>
    </p>
  </div>
</template>
