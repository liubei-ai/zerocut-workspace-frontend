<template>
  <v-container fluid class="pa-6">
    <ResponsivePageHeader title="会员管理" subtitle="查看和管理所有会员订阅信息" />

    <!-- Summary Cards Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <MemberSummaryCards :summary="summary" :loading="summaryLoading" />
      </v-col>
    </v-row>

    <!-- Member List Table -->
    <v-row>
      <v-col cols="12">
        <MemberListTable @summary-updated="handleSummaryUpdated" />
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      @click:close="error = null"
      class="mb-4"
    >
      {{ error }}
    </v-alert>
  </v-container>
</template>

<script setup lang="ts">
import { getMemberSummary, type MemberSummary } from '@/api/memberAdminApi';
import MemberListTable from '@/components/admin/MemberListTable.vue';
import MemberSummaryCards from '@/components/admin/MemberSummaryCards.vue';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { onMounted, ref } from 'vue';

const summary = ref<MemberSummary | null>(null);
const summaryLoading = ref(false);
const error = ref<string | null>(null);

async function loadSummary() {
  summaryLoading.value = true;
  error.value = null;

  try {
    summary.value = await getMemberSummary();
  } catch (err: any) {
    console.error('Failed to load member summary:', err);
    error.value = err.response?.data?.message || '加载会员统计数据失败';
  } finally {
    summaryLoading.value = false;
  }
}

function handleSummaryUpdated(updatedSummary: MemberSummary) {
  // Update summary when table fetches new data (to keep it in sync)
  summary.value = updatedSummary;
  // Clear any previous errors since we successfully got the summary
  error.value = null;
}

onMounted(() => {
  loadSummary();
});
</script>

<style scoped>
/* Page-specific styles can be added here if needed */
</style>
