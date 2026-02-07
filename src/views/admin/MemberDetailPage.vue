<template>
  <v-container fluid>
    <!-- Breadcrumb Navigation -->
    <v-breadcrumbs :items="breadcrumbs" class="pa-0 mb-4">
      <template #divider>
        <v-icon>mdi-chevron-right</v-icon>
      </template>
    </v-breadcrumbs>

    <!-- Loading State -->
    <div v-if="loading" class="mt-4">
      <v-skeleton-loader type="article, article, article"></v-skeleton-loader>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mt-4">
      {{ error }}
    </v-alert>

    <!-- Detail Content -->
    <div v-else-if="detail">
      <!-- Page Header -->
      <v-row class="mb-4">
        <v-col cols="12">
          <div class="d-flex align-center">
            <v-btn icon variant="text" @click="goBack" class="mr-2">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <div>
              <h1 class="text-h4">会员详情</h1>
              <p class="text-subtitle-1 text-medium-emphasis">
                订阅ID: {{ detail.subscriptionId }} | 工作空间: {{ detail.workspaceId }}
              </p>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Subscription Overview Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <SubscriptionOverviewSection :detail="detail" />
        </v-col>
      </v-row>

      <!-- Lifecycle Dates Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <LifecycleDatesSection :detail="detail" />
        </v-col>
      </v-row>

      <!-- Payment History Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <PaymentHistorySection :orders="detail.orders" />
        </v-col>
      </v-row>

      <!-- Credit Grants Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <CreditGrantsSection :credit-grants="detail.creditGrants" />
        </v-col>
      </v-row>

      <!-- Credit Periods Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <CreditPeriodsSection :credit-periods="detail.creditPeriods" />
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { getMemberDetail, type MemberDetail } from '@/api/memberAdminApi';
import CreditGrantsSection from '@/components/admin/CreditGrantsSection.vue';
import CreditPeriodsSection from '@/components/admin/CreditPeriodsSection.vue';
import LifecycleDatesSection from '@/components/admin/LifecycleDatesSection.vue';
import PaymentHistorySection from '@/components/admin/PaymentHistorySection.vue';
import SubscriptionOverviewSection from '@/components/admin/SubscriptionOverviewSection.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const detail = ref<MemberDetail | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const subscriptionId = computed(() => {
  const id = route.params.id;
  return typeof id === 'string' ? parseInt(id, 10) : 0;
});

const breadcrumbs = computed(() => [
  {
    title: '会员管理',
    disabled: false,
    href: '/admin/members',
  },
  {
    title: '会员详情',
    disabled: true,
  },
]);

async function loadDetail() {
  if (!subscriptionId.value) {
    error.value = '无效的订阅ID';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    detail.value = await getMemberDetail(subscriptionId.value);
  } catch (err: any) {
    console.error('Failed to load member detail:', err);
    error.value = err.response?.data?.message || '加载会员详情失败';
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/admin/members');
}

onMounted(() => {
  loadDetail();
});
</script>

<style scoped>
/* Page-specific styles */
</style>
