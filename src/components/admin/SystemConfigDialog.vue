<script setup lang="ts">
import type {
  CreateSystemConfigParams,
  SystemConfigEnumOption,
  SystemConfigItem,
  UpdateSystemConfigParams,
} from '@/api/adminApi';
import { getSystemConfigEnums } from '@/api/adminApi';
import { computed, onMounted, ref, watch } from 'vue';

// 值类型枚举
type ValueType = 'string' | 'number' | 'decimal' | 'boolean' | 'json' | 'array';

// Props
interface Props {
  modelValue: boolean;
  config?: SystemConfigItem | null;
}

const props = withDefaults(defineProps<Props>(), {
  config: null,
});

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', data: CreateSystemConfigParams | UpdateSystemConfigParams): void;
}

const emit = defineEmits<Emits>();

// 响应式数据
const loading = ref(false);
const form = ref<any>(null);
const enumsLoading = ref(false);
const valueTypeOptions = ref<SystemConfigEnumOption[]>([]);
const categoryOptions = ref<SystemConfigEnumOption[]>([]);

// 表单数据
const formData = ref({
  configKey: '',
  name: '',
  configValue: '',
  valueType: 'string' as ValueType,
  category: '',
  description: '',
  isEditable: true,
});

// 计算属性
const isEdit = computed(() => !!props.config);
const dialogTitle = computed(() => (isEdit.value ? '编辑配置' : '新建配置'));

// 获取系统配置枚举
const fetchEnums = async () => {
  try {
    enumsLoading.value = true;
    const enums = await getSystemConfigEnums();
    valueTypeOptions.value = enums.valueTypes;
    categoryOptions.value = enums.categories;
  } catch (error) {
    console.error('获取枚举失败:', error);
  } finally {
    enumsLoading.value = false;
  }
};

// 表单验证规则
const rules = {
  configKey: [
    (v: string) => !!v || '配置键不能为空',
    (v: string) =>
      /^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(v) ||
      '配置键格式不正确，只能包含字母、数字、下划线、点和连字符，且必须以字母开头',
    (v: string) => v.length <= 100 || '配置键长度不能超过100个字符',
  ],
  name: [
    (v: string) => !!v || '配置名称不能为空',
    (v: string) => v.length <= 200 || '配置名称长度不能超过200个字符',
  ],
  configValue: [(v: string) => !!v || '配置值不能为空'],
  valueType: [(v: string) => !!v || '值类型不能为空'],
  category: [
    (v: string) => !!v || '配置分类不能为空',
    (v: string) => v.length <= 50 || '配置分类长度不能超过50个字符',
  ],
  description: [(v: string) => !v || v.length <= 500 || '描述长度不能超过500个字符'],
};

// 组件挂载时获取枚举数据
onMounted(() => {
  fetchEnums();
});

// 监听弹窗状态
watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      resetForm();
      if (props.config) {
        // 编辑模式，填充数据
        formData.value = {
          configKey: props.config.configKey,
          name: props.config.name,
          configValue: props.config.configValue,
          valueType: props.config.valueType,
          category: props.config.category,
          description: props.config.description || '',
          isEditable: props.config.isEditable,
        };
      }
    }
  }
);

// 重置表单
const resetForm = () => {
  formData.value = {
    configKey: '',
    name: '',
    configValue: '',
    valueType: 'string',
    category: '',
    description: '',
    isEditable: true,
  };
  form.value?.resetValidation();
};

// 关闭弹窗
const closeDialog = () => {
  emit('update:modelValue', false);
};

// 保存配置
const saveConfig = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  try {
    loading.value = true;

    if (isEdit.value) {
      // 编辑模式，只发送可编辑的字段
      const updateData: UpdateSystemConfigParams = {
        name: formData.value.name,
        configValue: formData.value.configValue,
        description: formData.value.description,
      };
      emit('save', updateData);
    } else {
      // 新建模式
      const createData: CreateSystemConfigParams = {
        configKey: formData.value.configKey,
        name: formData.value.name,
        configValue: formData.value.configValue,
        valueType: formData.value.valueType,
        category: formData.value.category,
        description: formData.value.description,
        isEditable: formData.value.isEditable,
      };
      emit('save', createData);
    }
  } finally {
    loading.value = false;
  }
};

// 验证配置值格式
const validateConfigValue = (value: string, type: ValueType) => {
  if (!value) return '配置值不能为空';

  switch (type) {
  case 'number':
    if (!/^-?\d+$/.test(value)) {
      return '请输入有效的整数';
    }
    break;
  case 'decimal':
    if (!/^-?\d+(\.\d+)?$/.test(value)) {
      return '请输入有效的小数';
    }
    break;
  case 'boolean':
    if (!['true', 'false'].includes(value.toLowerCase())) {
      return '布尔值只能是 true 或 false';
    }
    break;
  case 'json':
    try {
      JSON.parse(value);
    } catch {
      return '请输入有效的JSON格式';
    }
    break;
  case 'array':
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        return '请输入有效的数组格式';
      }
    } catch {
      return '请输入有效的数组格式';
    }
    break;
  }

  return true;
};

// 格式化配置值
const formatConfigValue = () => {
  const { valueType, configValue } = formData.value;

  switch (valueType) {
  case 'boolean':
    formData.value.configValue = configValue.toLowerCase();
    break;
  case 'json':
  case 'array':
    try {
      const parsed = JSON.parse(configValue);
      formData.value.configValue = JSON.stringify(parsed, null, 2);
    } catch {
      // 保持原值
    }
    break;
  }
};

// 获取配置值输入提示
const getValuePlaceholder = (type: ValueType) => {
  switch (type) {
  case 'string':
    return '请输入字符串值';
  case 'number':
    return '请输入整数，如：123';
  case 'decimal':
    return '请输入小数，如：123.45';
  case 'boolean':
    return '请输入 true 或 false';
  case 'json':
    return '请输入JSON格式，如：{"key": "value"}';
  case 'array':
    return '请输入数组格式，如：["item1", "item2"]';
  default:
    return '请输入配置值';
  }
};

// 获取配置值输入类型
const getValueInputType = (type: ValueType) => {
  switch (type) {
  case 'json':
  case 'array':
    return 'textarea';
  default:
    return 'text';
  }
};
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="600"
    persistent
  >
    <v-card>
      <v-card-title class="text-h6 d-flex align-center">
        <v-icon class="mr-2">{{ isEdit ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
        {{ dialogTitle }}
      </v-card-title>

      <v-card-text>
        <v-form ref="form" @submit.prevent="saveConfig">
          <v-row>
            <!-- 配置键 -->
            <v-col cols="12">
              <v-text-field
                v-model="formData.configKey"
                label="配置键"
                placeholder="请输入配置键，如：app.name"
                variant="outlined"
                density="comfortable"
                :rules="rules.configKey"
                :disabled="isEdit"
                :hint="isEdit ? '编辑模式下配置键不可修改' : '配置键用于唯一标识配置项'"
                persistent-hint
              />
            </v-col>

            <!-- 配置名称 -->
            <v-col cols="12">
              <v-text-field
                v-model="formData.name"
                label="配置名称"
                placeholder="请输入配置名称"
                variant="outlined"
                density="comfortable"
                :rules="rules.name"
              />
            </v-col>

            <!-- 配置分类 -->
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.category"
                label="配置分类"
                :items="categoryOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                :rules="rules.category"
                :disabled="isEdit"
                :loading="enumsLoading"
                :hint="isEdit ? '编辑模式下配置分类不可修改' : '选择配置分类用于组织配置项'"
                persistent-hint
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="item.raw.description" />
                </template>
              </v-select>
            </v-col>

            <!-- 值类型 -->
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.valueType"
                label="值类型"
                :items="valueTypeOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                :rules="rules.valueType"
                :disabled="isEdit"
                :loading="enumsLoading"
                :hint="isEdit ? '编辑模式下值类型不可修改' : '选择配置值的数据类型'"
                persistent-hint
                @update:model-value="formatConfigValue"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="item.raw.description" />
                </template>
              </v-select>
            </v-col>

            <!-- 可编辑状态 -->
            <v-col cols="12">
              <v-switch
                v-model="formData.isEditable"
                label="可编辑配置"
                color="primary"
                :hint="formData.isEditable ? '此配置可以被编辑和删除' : '此配置为只读配置'"
                persistent-hint
                inset
              />
            </v-col>

            <!-- 配置值 -->
            <v-col cols="12">
              <v-textarea
                v-if="getValueInputType(formData.valueType) === 'textarea'"
                v-model="formData.configValue"
                label="配置值"
                :placeholder="getValuePlaceholder(formData.valueType)"
                variant="outlined"
                density="comfortable"
                :rules="[
                  ...rules.configValue,
                  (v: string) => validateConfigValue(v, formData.valueType),
                ]"
                rows="4"
                auto-grow
              />
              <v-text-field
                v-else
                v-model="formData.configValue"
                label="配置值"
                :placeholder="getValuePlaceholder(formData.valueType)"
                variant="outlined"
                density="comfortable"
                :rules="[
                  ...rules.configValue,
                  (v: string) => validateConfigValue(v, formData.valueType),
                ]"
              />
            </v-col>

            <!-- 描述 -->
            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="描述"
                placeholder="请输入配置描述（可选）"
                variant="outlined"
                density="comfortable"
                :rules="rules.description"
                rows="2"
                auto-grow
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="closeDialog" :disabled="loading"> 取消 </v-btn>
        <v-btn color="primary" variant="flat" @click="saveConfig" :loading="loading">
          {{ isEdit ? '更新' : '创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
