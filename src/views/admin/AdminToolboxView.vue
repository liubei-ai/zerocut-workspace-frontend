<script setup lang="ts">
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import PriceCalculatorTool from '@/views/admin/tools/PriceCalculatorTool.vue';
import { computed, ref, type Component } from 'vue';

// Tool categories
const categories = [
  { key: 'calculator', label: '计算工具', icon: 'mdi-calculator' },
  { key: 'config', label: '配置工具', icon: 'mdi-cog' },
  { key: 'converter', label: '数据转换', icon: 'mdi-swap-horizontal' },
  { key: 'query', label: '查询', icon: 'mdi-magnify' },
  { key: 'test', label: '测试', icon: 'mdi-test-tube' },
];

// Tool definitions
interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  component: Component;
}

const tools: ToolDefinition[] = [
  {
    id: 'price-calculator',
    name: '价格计算器',
    description: '实时计算 AI 模型定价',
    icon: 'mdi-calculator',
    category: 'calculator',
    component: PriceCalculatorTool,
  },
  // Future tools can be added here
];

// State
const selectedCategory = ref('calculator');
const selectedTool = ref<ToolDefinition | null>(null);

// Computed
const filteredTools = computed(() => {
  return tools.filter(tool => tool.category === selectedCategory.value);
});

// Methods
const selectTool = (tool: ToolDefinition) => {
  selectedTool.value = tool;
};

const closeTool = () => {
  selectedTool.value = null;
};

const headerSecondaryActions = computed(() => [
  {
    key: 'close',
    label: '关闭工具',
    icon: 'mdi-close',
    variant: 'outlined' as const,
    disabled: !selectedTool.value,
    onClick: closeTool,
  },
]);
</script>

<template>
  <div>
    <ResponsivePageHeader title="管理员工具箱" :secondary-actions="headerSecondaryActions">
      <template #description>
        <p class="text-medium-emphasis text-sm sm:text-base">
          管理员专用工具集合，包含计算、配置、数据转换等多种实用工具
        </p>
      </template>
    </ResponsivePageHeader>

    <!-- Tool Category Tabs -->
    <v-card class="mb-6" elevation="2">
      <v-tabs v-model="selectedCategory" bg-color="transparent" color="primary" grow>
        <v-tab v-for="category in categories" :key="category.key" :value="category.key">
          <v-icon :icon="category.icon" start></v-icon>
          {{ category.label }}
        </v-tab>
      </v-tabs>
    </v-card>

    <!-- Tool Content Area or Tool Cards Grid -->
    <v-card elevation="2">
      <!-- Show tool content if a tool is selected -->
      <div v-if="selectedTool">
        <v-card-title class="d-flex align-center">
          <v-btn icon="mdi-arrow-left" variant="text" @click="closeTool" class="mr-2"></v-btn>
          <v-icon :icon="selectedTool.icon" class="mr-2"></v-icon>
          {{ selectedTool.name }}
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <component :is="selectedTool.component" v-if="selectedTool.component" />
          <v-alert v-else type="info" variant="tonal"> 该工具暂未实现 </v-alert>
        </v-card-text>
      </div>

      <!-- Show tool cards grid if no tool is selected -->
      <div v-else>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-apps" class="mr-2"></v-icon>
          可用工具
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row v-if="filteredTools.length > 0">
            <v-col v-for="tool in filteredTools" :key="tool.id" cols="12" sm="6" md="4" lg="3">
              <v-card
                :elevation="selectedTool?.id === tool.id ? 8 : 2"
                :class="[
                  'tool-card',
                  'pa-4',
                  'd-flex',
                  'flex-column',
                  'align-center',
                  'text-center',
                  'cursor-pointer',
                  { 'selected-tool': selectedTool?.id === tool.id },
                ]"
                hover
                @click="selectTool(tool)"
              >
                <v-icon :icon="tool.icon" size="64" color="primary" class="mb-4"></v-icon>
                <div class="text-h6 font-weight-bold mb-2">
                  {{ tool.name }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ tool.description }}
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Empty state -->
          <v-alert v-else type="info" variant="tonal" class="text-center">
            <div class="text-h6 mb-2">暂无工具</div>
            <div class="text-body-2">该分类下暂无可用工具</div>
          </v-alert>
        </v-card-text>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.tool-card {
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 200px;
}

.tool-card:hover {
  transform: translateY(-4px);
}

.tool-card.selected-tool {
  border: 2px solid rgb(var(--v-theme-primary));
}

.cursor-pointer {
  cursor: pointer;
}
</style>
