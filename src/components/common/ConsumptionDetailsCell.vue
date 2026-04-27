<script setup lang="ts">
import { computed, ref } from 'vue';

interface DisplayDetails {
  reason?: string;
  urls?: string[];
  prompt?: string;
}

interface ConsumptionLikeItem {
  displayDetails?: DisplayDetails;
  serviceDetails?: Record<string, any>;
}

const props = withDefaults(
  defineProps<{
    item: ConsumptionLikeItem;
    reasonLabel: string;
    outputsLabel: string;
    promptLabel: string;
    viewAllLabel: string;
    expandLabel: string;
    closeLabel: string;
    emptyText?: string;
    promptPreviewLength?: number;
    urlPreviewCount?: number;
  }>(),
  {
    emptyText: '-',
    promptPreviewLength: 120,
    urlPreviewCount: 2,
  }
);

const dialogOpen = ref(false);
const dialogTitle = ref('');
const dialogContent = ref('');

const reasonText = computed(() => {
  const reason =
    props.item.displayDetails?.reason ??
    props.item.serviceDetails?.reason ??
    props.item.serviceDetails?.metadata?.reason;
  return typeof reason === 'string' && reason.trim() ? reason : undefined;
});

const promptText = computed(() => {
  const prompt =
    props.item.displayDetails?.prompt ??
    props.item.serviceDetails?.prompt ??
    props.item.serviceDetails?.metadata?.prompt;
  return typeof prompt === 'string' && prompt.trim() ? prompt : undefined;
});

const urls = computed(() => {
  const raw =
    props.item.displayDetails?.urls ??
    props.item.serviceDetails?.urls ??
    props.item.serviceDetails?.metadata?.urls;
  if (typeof raw === 'string') return raw.trim() ? [raw.trim()] : [];
  if (!Array.isArray(raw)) return [];
  return raw.filter((u): u is string => typeof u === 'string' && !!u.trim()).map(u => u.trim());
});

const promptPreview = computed(() => {
  if (!promptText.value) return '';
  if (promptText.value.length <= props.promptPreviewLength) return promptText.value;
  return `${promptText.value.slice(0, props.promptPreviewLength)}...`;
});

const hasLongPrompt = computed(
  () => !!promptText.value && promptText.value.length > props.promptPreviewLength
);

const previewUrls = computed(() => urls.value.slice(0, props.urlPreviewCount));

const isEmpty = computed(() => !reasonText.value && urls.value.length === 0 && !promptText.value);

function openDialog(title: string, content: string) {
  dialogTitle.value = title;
  dialogContent.value = content;
  dialogOpen.value = true;
}
</script>

<template>
  <div class="service-details-cell">
    <div v-if="reasonText">
      <span class="detail-label">{{ reasonLabel }}：</span>{{ reasonText }}
    </div>

    <div v-if="urls.length > 0" class="mt-1">
      <span class="detail-label">{{ outputsLabel }}：</span>
      <div v-for="(url, idx) in previewUrls" :key="`url-${idx}`" class="url-line">{{ url }}</div>
      <v-btn
        v-if="urls.length > urlPreviewCount"
        size="x-small"
        variant="text"
        class="px-0"
        @click="openDialog(outputsLabel, urls.join('\n'))"
      >
        {{ viewAllLabel }}（{{ urls.length }}）
      </v-btn>
    </div>

    <div v-if="promptText" class="mt-1">
      <span class="detail-label">{{ promptLabel }}：</span>
      {{ promptPreview }}
      <v-btn
        v-if="hasLongPrompt"
        size="x-small"
        variant="text"
        class="ml-1 px-0"
        @click="openDialog(promptLabel, promptText || '')"
      >
        {{ expandLabel }}
      </v-btn>
    </div>

    <div v-if="isEmpty">{{ emptyText }}</div>

    <v-dialog v-model="dialogOpen" max-width="900">
      <v-card>
        <v-card-title>{{ dialogTitle }}</v-card-title>
        <v-card-text>
          <pre class="dialog-content">{{ dialogContent }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">{{ closeLabel }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.service-details-cell {
  line-height: 1.5;
}

.detail-label {
  font-weight: 600;
}

.url-line {
  word-break: break-all;
}

.dialog-content {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}
</style>
