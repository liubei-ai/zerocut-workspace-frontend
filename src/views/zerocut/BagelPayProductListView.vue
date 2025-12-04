<script setup lang="ts">
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { listBagelPayProducts, type BagelPayProduct } from '@/api/bagelpayApi';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const loading = ref(false);
const products = ref<BagelPayProduct[]>([]);
const error = ref<string | null>(null);

async function fetchProducts() {
  try {
    loading.value = true;
    error.value = null;
    const list = await listBagelPayProducts({ page: 1, limit: 20 });
    products.value = list;
  } catch (e: any) {
    error.value = e?.message || 'Failed to load products';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchProducts);
</script>

<template>
  <div>
    <ResponsivePageHeader :title="t('zerocut.bagelpay.productsTitle')" />

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-shopping-outline</v-icon>
            <span>{{ t('zerocut.bagelpay.productsSubtitle') }}</span>
            <v-spacer></v-spacer>
            <v-btn :loading="loading" variant="text" color="primary" @click="fetchProducts">
              {{ t('common.refresh') }}
            </v-btn>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-row>
              <v-col v-for="item in products" :key="item.id" cols="12" md="4">
                <v-card class="mb-4" variant="outlined">
                  <v-card-title class="text-h6">{{ item.name }}</v-card-title>
                  <v-card-subtitle class="text-caption">
                    {{
                      item.billingType === 'subscription'
                        ? t('zerocut.bagelpay.subscription')
                        : t('zerocut.bagelpay.singlePayment')
                    }}
                  </v-card-subtitle>
                  <v-card-text>
                    <div class="text-h6">
                      {{ item.price }} {{ item.currency }}
                      <span v-if="item.recurringInterval" class="text-caption ml-1">
                        / {{ item.recurringInterval }}
                      </span>
                    </div>
                    <div class="text-body-2 mt-2">{{ item.description }}</div>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      v-if="item.productUrl"
                      :href="item.productUrl"
                      target="_blank"
                      color="primary"
                      variant="flat"
                    >
                      {{ t('zerocut.bagelpay.viewProduct') }}
                      <v-icon end>mdi-open-in-new</v-icon>
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
            <v-skeleton-loader v-if="loading" type="card, card, card"></v-skeleton-loader>
            <div v-if="!loading && products.length === 0" class="text-medium-emphasis">
              {{ t('zerocut.bagelpay.noProducts') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
