<template>
  <v-card elevation="2">
    <v-card-title class="d-flex align-center bg-primary">
      <v-icon class="mr-2">mdi-calendar-range</v-icon>
      周期信息
    </v-card-title>
    <v-card-text class="pt-4">
      <v-row>
        <v-col cols="12" md="6">
          <v-list density="comfortable" class="bg-transparent">
            <v-list-item v-if="detail.termStartAt">
              <template #prepend>
                <v-icon color="success">mdi-calendar-start</v-icon>
              </template>
              <v-list-item-title>订阅期开始</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(detail.termStartAt) }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="detail.termEndAt">
              <template #prepend>
                <v-icon color="error">mdi-calendar-end</v-icon>
              </template>
              <v-list-item-title>订阅期结束</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(detail.termEndAt) }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="detail.currentPeriodStartAt">
              <template #prepend>
                <v-icon color="info">mdi-calendar-arrow-right</v-icon>
              </template>
              <v-list-item-title>当前周期开始</v-list-item-title>
              <v-list-item-subtitle>{{
                formatDate(detail.currentPeriodStartAt)
              }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-col>

        <v-col cols="12" md="6">
          <v-list density="comfortable" class="bg-transparent">
            <v-list-item v-if="detail.currentPeriodEndAt">
              <template #prepend>
                <v-icon color="info">mdi-calendar-arrow-left</v-icon>
              </template>
              <v-list-item-title>当前周期结束</v-list-item-title>
              <v-list-item-subtitle>{{
                formatDate(detail.currentPeriodEndAt)
              }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="detail.nextActionAt">
              <template #prepend>
                <v-icon color="warning">mdi-calendar-clock</v-icon>
              </template>
              <v-list-item-title>下次操作时间</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(detail.nextActionAt) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { MemberDetail } from '@/api/memberAdminApi';
import { formatDate } from '@/utils/date';

defineProps<{
  detail: MemberDetail;
}>();
</script>

<style scoped>
/* Component-specific styles */
</style>
