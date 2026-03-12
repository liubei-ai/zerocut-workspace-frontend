<script setup lang="ts">
import type { IMembershipPlanFeature } from '@/api/adminApi';
import featureCatalogRaw from './membership_feature.json';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type CatalogItem = {
  key: string;
  order: number;
  i18nKey?: string;
  label?: string;
};

interface Props {
  modelValue: IMembershipPlanFeature[];
}

interface Emits {
  (e: 'update:modelValue', value: IMembershipPlanFeature[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

const catalogItems = computed<CatalogItem[]>(() => {
  const items = (featureCatalogRaw as unknown as CatalogItem[]) ?? [];
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
});

const catalogKeySet = computed(() => new Set(catalogItems.value.map(i => i.key)));
const presetOptions = computed(() =>
  catalogItems.value.map(i => ({
    value: i.key,
    title: i.label || (i.i18nKey ? t(i.i18nKey) : i.key),
    subtitle: i.key,
  }))
);

const maxCatalogOrder = computed(() =>
  catalogItems.value.reduce((max, i) => Math.max(max, i.order ?? 0), 0)
);

const selectedPresetKeys = ref<string[]>([]);
const customFeatures = ref<Array<{ key: string; label: string }>>([]);
const existingFeatureByKey = ref<Record<string, IMembershipPlanFeature>>({});
const syncingFromProps = ref(false);
const lastEmittedSignature = ref('');

const normalizeKey = (v: string) => (v ?? '').trim();
const normalizeLabel = (v: string) => (v ?? '').trim();

const allKeys = computed(() => {
  const keys = [
    ...selectedPresetKeys.value.map(normalizeKey).filter(Boolean),
    ...customFeatures.value.map(i => normalizeKey(i.key)).filter(Boolean),
  ];
  return keys;
});

const duplicateKeys = computed(() => {
  const counts = allKeys.value.reduce(
    (acc, k) => {
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  return Object.keys(counts).filter(k => counts[k] > 1);
});

const allKeysUnique = computed(() => duplicateKeys.value.length === 0);

const newCustomKey = () => `custom_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

const addCustom = () => {
  customFeatures.value.push({ key: newCustomKey(), label: '' });
};

const removeCustom = (idx: number) => {
  customFeatures.value.splice(idx, 1);
};

const assembledFeatures = computed<IMembershipPlanFeature[]>(() => {
  const selectedSet = new Set(selectedPresetKeys.value.map(normalizeKey).filter(Boolean));

  const presets = catalogItems.value
    .filter(i => selectedSet.has(i.key))
    .map(i => {
      const existing = existingFeatureByKey.value[i.key];
      return {
        ...i,
        ...(existing ?? {}),
        key: i.key,
        order: i.order,
      } as IMembershipPlanFeature;
    });

  const customs = customFeatures.value
    .map((i, idx) => {
      const key = normalizeKey(i.key);
      const label = normalizeLabel(i.label);
      if (!key && !label) return null;
      const existing = existingFeatureByKey.value[key];
      return {
        ...(existing ?? {}),
        key,
        label: label || existing?.label || key,
        order: maxCatalogOrder.value + 10 * (idx + 1),
      } as IMembershipPlanFeature;
    })
    .filter((i): i is IMembershipPlanFeature => !!i);

  return [...presets, ...customs];
});

const buildSignature = (features: IMembershipPlanFeature[]) => {
  const normalized = (features ?? [])
    .filter(f => !!f?.key)
    .map(f => ({
      key: String(f.key),
      label: f.label ?? null,
      i18nKey: (f as any).i18nKey ?? null,
      order: (f as any).order ?? null,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
  return JSON.stringify(normalized);
};

const initFromValue = async (features: IMembershipPlanFeature[]) => {
  syncingFromProps.value = true;

  const map: Record<string, IMembershipPlanFeature> = {};
  for (const f of features ?? []) {
    if (!f?.key) continue;
    map[f.key] = f;
  }
  existingFeatureByKey.value = map;

  const presetKeys: string[] = [];
  const customs: Array<{ key: string; label: string }> = [];

  const keySet = catalogKeySet.value;
  for (const f of features ?? []) {
    const key = normalizeKey(f?.key);
    if (!key) continue;
    if (keySet.has(key)) {
      presetKeys.push(key);
    } else {
      const label = normalizeLabel(f.label || key);
      customs.push({ key, label });
    }
  }

  selectedPresetKeys.value = presetKeys;
  customFeatures.value = customs;

  await nextTick();
  syncingFromProps.value = false;
};

watch(
  () => props.modelValue,
  v => {
    const signature = buildSignature(v ?? []);
    if (signature === lastEmittedSignature.value) return;
    initFromValue(v ?? []);
  },
  { immediate: true }
);

watch(
  [selectedPresetKeys, customFeatures],
  () => {
    if (syncingFromProps.value) return;
    const nextValue = assembledFeatures.value;
    lastEmittedSignature.value = buildSignature(nextValue);
    emit('update:modelValue', nextValue);
  },
  { deep: true }
);

const keyRules = () => [
  (v: string) => !!normalizeKey(v) || 'key 不能为空',
  (v: string) => normalizeKey(v).length <= 100 || 'key 最长 100 字符',
  (v: string) => {
    const key = normalizeKey(v);
    if (!key) return true;
    const count = allKeys.value.filter(k => k === key).length;
    return count <= 1 ? true : 'key 不能重复';
  },
];

const labelRules = () => [
  (v: string) => !!normalizeLabel(v) || '文案不能为空',
  (v: string) => normalizeLabel(v).length <= 200 || '文案最长 200 字符',
];
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-autocomplete
        v-model="selectedPresetKeys"
        :items="presetOptions"
        item-title="title"
        item-value="value"
        label="预置权益（可多选）"
        variant="outlined"
        density="comfortable"
        multiple
        chips
        closable-chips
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" :title="item.raw.title" :subtitle="item.raw.subtitle" />
        </template>
      </v-autocomplete>
    </v-col>

    <v-col cols="12">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-subtitle-1">自定义权益</div>
        <v-btn variant="outlined" size="small" @click="addCustom">
          <v-icon icon="mdi-plus" class="mr-1" />
          新增
        </v-btn>
      </div>

      <v-card variant="outlined">
        <v-card-text class="py-4">
          <v-row v-for="(item, idx) in customFeatures" :key="idx" class="align-center">
            <v-col cols="12" md="5">
              <v-text-field
                v-model="item.label"
                label="展示文案"
                variant="outlined"
                density="comfortable"
                :rules="labelRules()"
              />
            </v-col>
            <v-col cols="12" md="5">
              <v-text-field
                v-model="item.key"
                label="key"
                variant="outlined"
                density="comfortable"
                :rules="keyRules()"
              />
            </v-col>
            <v-col cols="12" md="2" class="d-flex justify-end">
              <v-btn icon variant="text" @click="removeCustom(idx)">
                <v-icon icon="mdi-delete" />
              </v-btn>
            </v-col>
          </v-row>

          <div v-if="customFeatures.length === 0" class="text-medium-emphasis">暂无自定义权益</div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12">
      <v-input
        class="d-none"
        :model-value="allKeysUnique"
        :rules="[(v: boolean) => v || '权益 key 不能重复']"
      />
      <v-alert
        v-if="!allKeysUnique"
        type="error"
        variant="tonal"
        class="mt-2"
        :text="`存在重复 key：${duplicateKeys.join('、')}`"
      />
    </v-col>
  </v-row>
</template>
