<script setup lang="ts">
import type { CreatePersonaParams, PersonaItem, UpdatePersonaParams } from '@/api/adminApi';
import { createPersona, deletePersona, getPersonas, updatePersona } from '@/api/adminApi';
import PersonaDialog from '@/components/admin/PersonaDialog.vue';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { computed, onMounted, ref } from 'vue';

const loading = ref(false);
const personas = ref<PersonaItem[]>([]);
const dialogOpen = ref(false);
const editingPersona = ref<PersonaItem | null>(null);
const deleteDialogOpen = ref(false);
const personaToDelete = ref<PersonaItem | null>(null);
const searchText = ref('');
const snackbar = ref({
  show: false,
  message: '',
  color: 'success' as 'success' | 'error' | 'warning' | 'info',
});

const headers = [
  { title: '名称', key: 'name', sortable: false, width: '200px' },
  { title: '触发词', key: 'triggerPreview', sortable: false },
  { title: '提示词', key: 'promptPreview', sortable: false },
  { title: '更新时间', key: 'updatedAt', sortable: false, width: '160px' },
  { title: '操作', key: 'actions', sortable: false, width: '200px', align: 'center' as const },
];

const filteredItems = computed(() => {
  const q = searchText.value.trim().toLowerCase();
  if (!q) return personas.value;
  return personas.value.filter(
    p => p.name.toLowerCase().includes(q) || p.trigger.toLowerCase().includes(q)
  );
});

const fetchList = async () => {
  loading.value = true;
  try {
    const list = await getPersonas();
    personas.value = list;
  } catch (e: any) {
    showSnackbar(e?.message || '获取列表失败', 'error');
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingPersona.value = null;
  dialogOpen.value = true;
};

const openEdit = (item: PersonaItem) => {
  editingPersona.value = item;
  dialogOpen.value = true;
};

const handleSave = async (data: CreatePersonaParams | UpdatePersonaParams) => {
  try {
    if (editingPersona.value) {
      await updatePersona(editingPersona.value.id, data as UpdatePersonaParams);
      showSnackbar('更新成功', 'success');
    } else {
      await createPersona(data as CreatePersonaParams);
      showSnackbar('创建成功', 'success');
    }
    dialogOpen.value = false;
    await fetchList();
  } catch (e: any) {
    showSnackbar(e?.message || '保存失败', 'error');
  }
};

const openDelete = (item: PersonaItem) => {
  personaToDelete.value = item;
  deleteDialogOpen.value = true;
};

const confirmDelete = async () => {
  if (!personaToDelete.value) return;
  try {
    await deletePersona(personaToDelete.value.id);
    showSnackbar('删除成功', 'success');
    deleteDialogOpen.value = false;
    await fetchList();
  } catch (e: any) {
    showSnackbar(e?.message || '删除失败', 'error');
  }
};

const formatDate = (s: string) => new Date(s).toLocaleString('zh-CN');
const truncate = (s: string, len = 80) => (s?.length > len ? s.slice(0, len) + '...' : s || '-');
const previewDialogOpen = ref(false);
const previewTitle = ref('');
const previewText = ref('');
const openPreview = (title: string, text: string) => {
  previewTitle.value = title;
  previewText.value = text;
  previewDialogOpen.value = true;
};
const showSnackbar = (
  message: string,
  color: 'success' | 'error' | 'warning' | 'info' = 'success'
) => {
  snackbar.value = { show: true, message, color };
};

onMounted(() => {
  fetchList();
});

const headerPrimaryActions = computed(() => [
  {
    key: 'create',
    label: '新建 Persona',
    icon: 'mdi-plus',
    color: 'primary',
    variant: 'flat' as const,
    onClick: openCreate,
  },
]);

const headerSecondaryActions = computed(() => [
  {
    key: 'refresh',
    label: '刷新',
    icon: 'mdi-refresh',
    variant: 'outlined' as const,
    loading: loading.value,
    onClick: fetchList,
  },
]);
</script>

<template>
  <div>
    <ResponsivePageHeader
      title="角色管理"
      :primary-actions="headerPrimaryActions"
      :secondary-actions="headerSecondaryActions"
    >
      <template #description>
        <p class="text-medium-emphasis text-sm sm:text-base">管理员配置触发词与提示词</p>
      </template>
    </ResponsivePageHeader>

    <v-card class="mb-6" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchText"
              label="搜索"
              placeholder="按名称或触发词搜索"
              variant="outlined"
              density="comfortable"
              clearable
              prepend-inner-icon="mdi-magnify"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-account</v-icon>
        角色列表
      </v-card-title>
      <v-data-table :headers="headers" :items="filteredItems" :loading="loading">
        <template #item.triggerPreview="{ item }">
          <div class="clamped-2">{{ item.trigger }}</div>
          <v-btn size="x-small" variant="text" @click="openPreview('触发词', item.trigger)"
            >查看全文</v-btn
          >
        </template>
        <template #item.promptPreview="{ item }">
          <div class="clamped-3">{{ item.prompt }}</div>
          <v-btn size="x-small" variant="text" @click="openPreview('提示词', item.prompt)"
            >查看全文</v-btn
          >
        </template>
        <template #item.updatedAt="{ item }">
          <span>{{ formatDate(item.updatedAt) }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openEdit(item)">编辑</v-btn>
          <v-btn size="small" variant="text" color="error" @click="openDelete(item)">删除</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <PersonaDialog
      :model-value="dialogOpen"
      :persona="editingPersona"
      @update:modelValue="dialogOpen = $event"
      @save="handleSave"
    />

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>确定要删除 "{{ personaToDelete?.name }}" 吗？此操作不可撤销。</v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="deleteDialogOpen = false">取消</v-btn>
          <v-btn color="error" @click="confirmDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="previewDialogOpen" max-width="720">
      <v-card>
        <v-card-title class="text-h6">{{ previewTitle }}</v-card-title>
        <v-card-text>
          <div style="white-space: pre-wrap">{{ previewText }}</div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="previewDialogOpen = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{
      snackbar.message
    }}</v-snackbar>
  </div>
</template>

<style scoped>
.clamped-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.clamped-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
