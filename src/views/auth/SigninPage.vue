<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const refLoginForm = ref();
const username = ref('alice01');
const password = ref('123456');
const isFormValid = ref(true);

// show password field
const showPassword = ref(false);

const handleLogin = async () => {
  const { valid } = await refLoginForm.value.validate();
  if (valid) {
    authStore.clearError();
    const success = await authStore.loginWithUsernameAndPassword(
      username.value,
      password.value
    );

    if (success) {
      // Handle redirect after successful login
      const redirectPath = route.query.redirect as string;
      if (redirectPath) {
        router.push(redirectPath);
      }
      // Note: Navigation to dashboard is handled in the store
    }
  }
};

// Validation Rules
const usernameRules = ref([
  (v: string) => !!v || 'Username is required',
  (v: string) =>
    (v && v.length >= 3) || 'Username must be at least 3 characters',
  (v: string) =>
    (v && v.length <= 50) || 'Username must be less than 50 characters',
]);

const passwordRules = ref([
  (v: string) => !!v || 'Password is required',
  (v: string) =>
    (v && v.length >= 6) || 'Password must be at least 6 characters',
  (v: string) =>
    (v && v.length <= 50) || 'Password must be less than 50 characters',
]);
</script>
<template>
  <v-card color="white" class="pa-3 ma-3" elevation="3">
    <v-card-title class="my-4 text-h4">
      <span class="flex-fill"> Welcome to Liubei AI </span>
    </v-card-title>
    <v-card-subtitle>Sign in to your account</v-card-subtitle>
    <!-- sign in form -->

    <v-card-text>
      <v-form
        ref="refLoginForm"
        class="text-left"
        v-model="isFormValid"
        lazy-validation
      >
        <v-text-field
          ref="refUsername"
          v-model="username"
          required
          :error="!!authStore.error"
          :label="$t('login.username')"
          density="default"
          variant="underlined"
          color="primary"
          bg-color="#fff"
          :rules="usernameRules"
          name="username"
          outlined
          validateOn="blur"
          placeholder="admin"
          @keyup.enter="handleLogin"
          @change="authStore.clearError"
        ></v-text-field>
        <v-text-field
          ref="refPassword"
          v-model="password"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          :type="showPassword ? 'text' : 'password'"
          :error="!!authStore.error"
          :error-messages="authStore.error"
          :label="$t('login.password')"
          placeholder="123456"
          density="default"
          variant="underlined"
          color="primary"
          bg-color="#fff"
          :rules="passwordRules"
          name="password"
          outlined
          validateOn="blur"
          @change="authStore.clearError"
          @keyup.enter="handleLogin"
          @click:append-inner="showPassword = !showPassword"
        ></v-text-field>
        <v-btn
          :loading="authStore.loading"
          :disabled="authStore.loading"
          block
          size="x-large"
          color="primary"
          @click="handleLogin"
          class="mt-2"
          >{{ $t('login.button') }}</v-btn
        >

        <div v-if="authStore.error" class="error--text my-2">
          {{ authStore.error }}
        </div>
      </v-form></v-card-text
    >
  </v-card>
</template>
