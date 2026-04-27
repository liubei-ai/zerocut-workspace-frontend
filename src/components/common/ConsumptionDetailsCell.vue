<script setup lang="ts">
import { computed, ref } from 'vue';

interface DisplayDetails {
  reason?: string;
  urls?: string[];
  prompt?: string;
}

interface ConsumptionLikeItem {
  prompt?: string;
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
    mode?: 'inline' | 'button';
    actionLabel?: string;
    actionIcon?: string;
    actionTooltip?: string;
    dialogTitle?: string;
    noOutputsText?: string;
    noPromptText?: string;
    openLinkLabel?: string;
  }>(),
  {
    emptyText: '-',
    promptPreviewLength: 120,
    urlPreviewCount: 2,
    mode: 'inline',
    actionLabel: '查看',
    actionIcon: 'mdi-eye-outline',
    actionTooltip: '查看提示词和生成物',
    dialogTitle: '提示词和生成物',
    noOutputsText: '-',
    noPromptText: '-',
    openLinkLabel: '打开链接',
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
    props.item.prompt ??
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
const imageUrls = computed(() => urls.value.filter(isLikelyImageUrl));
const nonImageUrls = computed(() => urls.value.filter(url => !isLikelyImageUrl(url)));

const isEmpty = computed(() => !reasonText.value && urls.value.length === 0 && !promptText.value);

function openDialog(title: string, content: string) {
  dialogTitle.value = title;
  dialogContent.value = content;
  dialogOpen.value = true;
}

function openDetailsDialog() {
  dialogTitle.value = props.dialogTitle;
  dialogContent.value = '';
  dialogOpen.value = true;
}

function isLikelyImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    return /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(pathname);
  } catch {
    return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(url.toLowerCase());
  }
}
</script>

<template>
  <div class="service-details-cell">
    <div v-if="mode === 'button'" class="reason-row">
      <div class="reason-text">
        {{ reasonText || emptyText }}
      </div>
      <v-tooltip location="top">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            :icon="actionIcon"
            size="small"
            variant="text"
            color="primary"
            :aria-label="actionLabel"
            class="action-btn"
            @click="openDetailsDialog"
          />
        </template>
        <span>{{ actionTooltip }}</span>
      </v-tooltip>
    </div>
    <template v-else>
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
    </template>

    <v-dialog v-model="dialogOpen" max-width="960">
      <v-card>
        <v-card-title>{{ dialogTitle }}</v-card-title>
        <v-card-text>
          <template v-if="mode === 'button'">
            <div class="section-title">{{ outputsLabel }}</div>
            <div v-if="urls.length === 0" class="text-medium-emphasis">{{ noOutputsText }}</div>
            <v-row v-if="imageUrls.length > 0" dense>
              <v-col v-for="(url, idx) in imageUrls" :key="`preview-image-${idx}`" cols="12" md="6">
                <v-card variant="outlined">
                  <v-img :src="url" height="220" cover class="bg-grey-lighten-3">
                    <template #error>
                      <div class="d-flex align-center text-medium-emphasis h-100 justify-center">
                        {{ noOutputsText }}
                      </div>
                    </template>
                  </v-img>
                  <v-card-text>
                    <a :href="url" target="_blank" rel="noopener noreferrer" class="url-link">
                      {{ openLinkLabel }}
                    </a>
                    <div class="url-line mt-1">{{ url }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <div v-if="nonImageUrls.length > 0" class="mt-3">
              <div class="text-caption text-medium-emphasis mb-2">URL</div>
              <div v-for="(url, idx) in nonImageUrls" :key="`preview-url-${idx}`" class="mb-2">
                <a :href="url" target="_blank" rel="noopener noreferrer" class="url-link">
                  {{ openLinkLabel }}
                </a>
                <div class="url-line mt-1">{{ url }}</div>
              </div>
            </div>

            <div class="section-title mt-4">{{ promptLabel }}</div>
            <pre v-if="promptText" class="dialog-content">{{ promptText }}</pre>
            <div v-else class="text-medium-emphasis">{{ noPromptText }}</div>
          </template>
          <template v-else>
            <pre class="dialog-content">{{ dialogContent }}</pre>
          </template>
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

.reason-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.reason-text {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-btn {
  flex-shrink: 0;
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
  max-height: 320px;
  overflow: auto;
}

.section-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.url-link {
  text-decoration: none;
}
</style>
