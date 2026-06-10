<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { useSubAccountStore } from '@/stores/subAccountStore';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const subAccountStore = useSubAccountStore();

const workspaceId = ref('');
const apiKeySuffix = ref('');
const error = ref('');
const submitting = ref(false);

const submit = async () => {
  error.value = '';
  const wsId = workspaceId.value.trim();
  const suffix = apiKeySuffix.value.trim();
  if (wsId.length !== 16 || suffix.length !== 8) {
    error.value = t('zerocut.subAccount.login.invalidInput');
    return;
  }

  submitting.value = true;
  try {
    await subAccountStore.login(wsId, suffix);
    const redirect = (route.query.redirect as string) || '/sub-account/consumption';
    router.replace(redirect);
  } catch {
    error.value = t('zerocut.subAccount.login.failed');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="pa-4 text-left">
    <h2 class="text-h5 mb-1 text-center">{{ t('zerocut.subAccount.login.title') }}</h2>
    <p class="text-body-2 text-medium-emphasis mb-6 text-center">
      {{ t('zerocut.subAccount.login.subtitle') }}
    </p>

    <v-form @submit.prevent="submit">
      <v-text-field
        v-model="workspaceId"
        :label="t('zerocut.subAccount.login.workspaceIdLabel')"
        :placeholder="t('zerocut.subAccount.login.workspaceIdPlaceholder')"
        maxlength="16"
        variant="outlined"
        class="mb-3"
      ></v-text-field>

      <v-text-field
        v-model="apiKeySuffix"
        :label="t('zerocut.subAccount.login.suffixLabel')"
        :placeholder="t('zerocut.subAccount.login.suffixPlaceholder')"
        maxlength="8"
        variant="outlined"
        class="mb-2"
      ></v-text-field>

      <v-alert v-if="error" type="error" density="compact" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>

      <v-btn
        type="submit"
        color="primary"
        block
        size="large"
        :loading="submitting"
        :disabled="submitting"
      >
        {{ t('zerocut.subAccount.login.submit') }}
      </v-btn>
    </v-form>
  </div>
</template>
