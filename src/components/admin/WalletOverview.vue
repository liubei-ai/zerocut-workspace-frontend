<script setup lang="ts">
import type { WalletInfo } from '@/api/walletApi';

const props = defineProps<{ walletInfo?: WalletInfo }>();
const emit = defineEmits<{ (e: 'view-expired'): void }>();
function openExpired() {
  emit('view-expired');
}
</script>

<template>
  <v-row class="mb-6">
    <v-col cols="12">
      <v-row>
        <v-col cols="12" sm="6" md="3" lg="3" xl="3">
          <v-card class="pa-4 text-center" elevation="2">
            <v-icon size="32" color="primary" class="mb-2">mdi-wallet</v-icon>
            <div class="text-h6 font-weight-bold mb-1">
              {{ props.walletInfo?.availableCredits || 0 }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('zerocut.wallet.availableCredits') }}
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3" lg="3" xl="3">
          <v-card class="pa-4 text-center" elevation="2">
            <v-icon size="32" color="success" class="mb-2">mdi-account-cash</v-icon>
            <div class="text-h6 font-weight-bold mb-1">
              ¥{{ props.walletInfo?.userRechargeAmount || 0 }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('zerocut.wallet.userRechargeAmount') }}
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3" lg="3" xl="3">
          <v-card class="pa-4 text-center" elevation="2">
            <v-icon size="32" color="info" class="mb-2">mdi-cash-plus</v-icon>
            <div class="text-h6 font-weight-bold mb-1">
              {{ props.walletInfo?.userRechargeCredits || 0 }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('zerocut.wallet.userRechargeCredits') }}
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3" lg="3" xl="3">
          <v-card class="pa-4 text-center" elevation="2">
            <v-icon size="32" color="orange" class="mb-2">mdi-gift</v-icon>
            <div class="text-h6 font-weight-bold mb-1">
              {{ props.walletInfo?.platformGiftCredits || 0 }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('zerocut.wallet.platformGiftCredits') }}
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3" lg="3" xl="3">
          <v-card class="pa-4 text-center" elevation="2">
            <v-icon size="32" color="error" class="mb-2">mdi-trending-down</v-icon>
            <div class="text-h6 font-weight-bold mb-1">
              {{ props.walletInfo?.totalCreditsConsumption || 0 }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('zerocut.wallet.totalCreditsConsumption') }}
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3" lg="3" xl="3">
          <v-card class="pa-4 text-center" elevation="2">
            <v-icon size="32" color="error" class="mb-2">mdi-alert</v-icon>
            <div class="text-h6 font-weight-bold mb-1">
              {{ props.walletInfo?.totalExpiredCredits || 0 }}
            </div>
            <div class="text-caption text-medium-emphasis">
              <v-btn variant="text" size="small" color="primary" @click="openExpired">{{
                $t('zerocut.wallet.viewExpiredCredits')
              }}</v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}
.v-card:hover {
  transform: translateY(-2px);
}
</style>
