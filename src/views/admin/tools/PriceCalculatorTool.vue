<script setup lang="ts">
import { getSystemConfigByKey } from '@/api/adminApi';
import type { Category } from '@/types/pricing';
import { computed, onMounted, ref, watch } from 'vue';

// State
const loading = ref(false);
const error = ref<string | null>(null);
const pricingData = ref<Category[]>([]);

// User selections
const categoryIndex = ref(0);
const modelIndex = ref(0);
const resolutionIndex = ref(0);
const duration = ref(1);
const audioOption = ref<string>('silent');

// Result
const priceResult = ref('---');

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success' as 'success' | 'error' | 'warning' | 'info',
});

// Computed properties
const currentCategory = computed(() => pricingData.value[categoryIndex.value]);
const currentModel = computed(() => currentCategory.value?.models[modelIndex.value]);
const currentResolution = computed(() => currentModel.value?.resolutions[resolutionIndex.value]);

const categoryOptions = computed(() => {
  return pricingData.value.map((cat, index) => ({
    title: cat.name,
    value: index,
  }));
});

const modelOptions = computed(() => {
  if (!currentCategory.value) return [];
  return currentCategory.value.models.map((model, index) => ({
    title: model.name,
    value: index,
  }));
});

const resolutionOptions = computed(() => {
  if (!currentModel.value) return [];
  return currentModel.value.resolutions.map((res, index) => ({
    title: res.name,
    value: index,
  }));
});

const audioOptions = computed(() => {
  if (!currentResolution.value?.audio_options) return [];
  return Object.keys(currentResolution.value.audio_options).map(key => ({
    title: key === 'silent' ? '静音' : '音频',
    value: key,
  }));
});

// Conditional display logic
const showResolutionSelector = computed(() => {
  return currentModel.value && currentModel.value.resolutions.length > 1;
});

const showDurationSlider = computed(() => {
  return currentModel.value?.unit === '秒';
});

const showAudioOptions = computed(() => {
  return currentResolution.value?.audio_options !== undefined;
});

const durationMin = computed(() => {
  return currentResolution.value?.time_range?.min || 1;
});

const durationMax = computed(() => {
  return currentResolution.value?.time_range?.max || 10;
});

const durationStep = computed(() => {
  return currentResolution.value?.time_range?.step || 1;
});

// Load pricing data
const loadPricingData = async () => {
  try {
    loading.value = true;
    error.value = null;

    const response = await getSystemConfigByKey('public_cerevox_zerocut_pricing');

    // Parse configValue JSON string
    const parsedData = JSON.parse(response.configValue);

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error('定价数据为空或格式不正确');
    }

    pricingData.value = parsedData;

    // Initialize selections
    categoryIndex.value = 0;
    modelIndex.value = 0;
    resolutionIndex.value = 0;
    resetDurationAndAudio();

    showSnackbar('定价数据加载成功', 'success');
  } catch (error) {
    console.error('Failed to load pricing data:', error);
    error.value = error?.response?.data?.message || error?.message || '加载定价数据失败';
    showSnackbar(error.value, 'error');
  } finally {
    loading.value = false;
  }
};

// Pricing calculation
const calculatePrice = () => {
  if (!currentResolution.value) {
    priceResult.value = '---';
    return;
  }

  const resolution = currentResolution.value;
  const model = currentModel.value;
  let price = 0;

  // Rule 1: Fixed price (for unit="张" or "条" or "次")
  if (resolution.price !== undefined && ['张', '条', '次'].includes(model?.unit || '')) {
    price = resolution.price;
  }
  // Rule 3: Time-based with audio options
  else if (resolution.audio_options) {
    const selectedAudio = resolution.audio_options[audioOption.value as 'silent' | 'audio'];
    if (selectedAudio) {
      const minDuration = resolution.time_range?.min || 1;
      const extraDuration = Math.max(0, duration.value - minDuration);
      price = selectedAudio.min_price + extraDuration * selectedAudio.additional_price_per_second;
    }
  }
  // Rule 2: Time-based with incremental pricing
  else if (
    resolution.min_price !== undefined &&
    resolution.additional_price_per_second !== undefined
  ) {
    const minDuration = resolution.time_range?.min || 1;
    const extraDuration = Math.max(0, duration.value - minDuration);
    price = resolution.min_price + extraDuration * resolution.additional_price_per_second;
  }
  // Rule 4: Simple multiplication (fallback)
  else if (resolution.price !== undefined && model?.unit === '秒') {
    price = resolution.price * duration.value;
  }

  priceResult.value = price.toFixed(2);
};

// Reset helpers
const resetDurationAndAudio = () => {
  if (currentResolution.value?.time_range) {
    duration.value = currentResolution.value.time_range.min;
  } else {
    duration.value = 1;
  }

  if (currentResolution.value?.audio_options) {
    const firstOption = Object.keys(currentResolution.value.audio_options)[0];
    audioOption.value = firstOption || 'silent';
  }
};

// Watchers for auto-reset and calculation
watch(categoryIndex, () => {
  modelIndex.value = 0;
  resolutionIndex.value = 0;
  resetDurationAndAudio();
});

watch(modelIndex, () => {
  resolutionIndex.value = 0;
  resetDurationAndAudio();
});

watch(resolutionIndex, () => {
  resetDurationAndAudio();
});

watch([categoryIndex, modelIndex, resolutionIndex, duration, audioOption], () => {
  calculatePrice();
});

// Snackbar helper
const showSnackbar = (
  message: string,
  color: 'success' | 'error' | 'warning' | 'info' = 'success'
) => {
  snackbar.value = {
    show: true,
    message,
    color,
  };
};

// Retry loading
const retryLoad = () => {
  loadPricingData();
};

// Mount
onMounted(() => {
  loadPricingData();
});
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="text-h6 mt-4">加载定价数据中...</div>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4" prominent>
      <div class="text-h6 mb-2">加载失败</div>
      <div class="text-body-2 mb-4">{{ error }}</div>
      <v-btn color="error" variant="outlined" prepend-icon="mdi-refresh" @click="retryLoad">
        重试
      </v-btn>
    </v-alert>

    <!-- Calculator Form -->
    <div v-else-if="pricingData.length > 0">
      <v-row>
        <!-- Form Inputs Column -->
        <v-col cols="12" md="6">
          <v-card elevation="0" class="pa-4">
            <div class="text-h6 mb-4 d-flex align-center">
              <v-icon icon="mdi-form-select" class="mr-2"></v-icon>
              选择参数
            </div>

            <!-- Category Selector -->
            <v-select
              v-model="categoryIndex"
              :items="categoryOptions"
              label="模型分类"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-shape"
              hint="选择 AI 模型分类"
              persistent-hint
              class="mb-4"
            ></v-select>

            <!-- Model Selector -->
            <v-select
              v-model="modelIndex"
              :items="modelOptions"
              label="模型名称"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-cpu-64-bit"
              hint="选择具体 AI 模型"
              persistent-hint
              class="mb-4"
            ></v-select>

            <!-- Resolution Selector (conditional) -->
            <v-select
              v-if="showResolutionSelector"
              v-model="resolutionIndex"
              :items="resolutionOptions"
              label="分辨率"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-monitor-screenshot"
              hint="选择输出分辨率"
              persistent-hint
              class="mb-4"
            ></v-select>

            <!-- Duration Slider (conditional) -->
            <div v-if="showDurationSlider" class="mb-4">
              <div class="text-subtitle-2 mb-2">
                <v-icon icon="mdi-clock-outline" size="small" class="mr-1"></v-icon>
                时长: {{ duration }} 秒
              </div>
              <v-slider
                v-model="duration"
                :min="durationMin"
                :max="durationMax"
                :step="durationStep"
                thumb-label
                color="primary"
                track-color="grey-lighten-2"
                class="mt-2"
              >
                <template #prepend>
                  <div class="text-caption">{{ durationMin }}s</div>
                </template>
                <template #append>
                  <div class="text-caption">{{ durationMax }}s</div>
                </template>
              </v-slider>
            </div>

            <!-- Audio Options (conditional) -->
            <div v-if="showAudioOptions" class="mb-4">
              <div class="text-subtitle-2 mb-2">
                <v-icon icon="mdi-volume-high" size="small" class="mr-1"></v-icon>
                音频选项
              </div>
              <v-btn-toggle
                v-model="audioOption"
                color="primary"
                variant="outlined"
                divided
                mandatory
                class="w-100"
              >
                <v-btn
                  v-for="option in audioOptions"
                  :key="option.value"
                  :value="option.value"
                  class="flex-grow-1"
                >
                  <v-icon
                    :icon="option.value === 'silent' ? 'mdi-volume-off' : 'mdi-music'"
                    start
                  ></v-icon>
                  {{ option.title }}
                </v-btn>
              </v-btn-toggle>
            </div>
          </v-card>
        </v-col>

        <!-- Price Display Column -->
        <v-col cols="12" md="6">
          <v-card
            elevation="4"
            class="pa-6 text-center price-card"
            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          >
            <div class="text-h5 mb-2" style="color: rgba(255, 255, 255, 0.9)">计算结果</div>
            <v-divider class="my-4" style="border-color: rgba(255, 255, 255, 0.3)"></v-divider>
            <div class="text-h2 font-weight-bold mb-2" style="color: white">
              {{ priceResult }}
            </div>
            <div class="text-h6" style="color: rgba(255, 255, 255, 0.9)">积分</div>

            <!-- Calculation Details -->
            <v-card
              v-if="currentModel && currentResolution"
              class="mt-6 pa-4"
              elevation="0"
              color="rgba(255, 255, 255, 0.15)"
            >
              <div class="text-body-2" style="color: rgba(255, 255, 255, 0.9)">
                <div class="mb-2"><strong>分类:</strong> {{ currentCategory?.name }}</div>
                <div class="mb-2"><strong>模型:</strong> {{ currentModel.name }}</div>
                <div v-if="showResolutionSelector" class="mb-2">
                  <strong>分辨率:</strong> {{ currentResolution.name }}
                </div>
                <div v-if="showDurationSlider" class="mb-2">
                  <strong>时长:</strong> {{ duration }} {{ currentModel.unit }}
                </div>
                <div v-if="showAudioOptions">
                  <strong>音频:</strong> {{ audioOption === 'silent' ? '静音' : '音频' }}
                </div>
              </div>
            </v-card>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Empty State -->
    <v-alert v-else type="info" variant="tonal" class="text-center">
      <div class="text-h6 mb-2">暂无定价数据</div>
      <div class="text-body-2">请联系管理员配置定价信息</div>
    </v-alert>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false"> 关闭 </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped>
.price-card {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.w-100 {
  width: 100%;
}
</style>
