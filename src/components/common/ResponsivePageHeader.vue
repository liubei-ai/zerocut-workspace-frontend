<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

type PageAction = {
  key: string;
  label: string;
  icon?: string;
  variant?: 'flat' | 'outlined' | 'text' | 'elevated';
  color?: string;
  size?: 'x-small' | 'small' | 'default' | 'large';
  loading?: boolean;
  disabled?: boolean;
  to?: any;
  onClick?: () => void;
};

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
  primaryActions: { type: Array as () => PageAction[], default: () => [] },
  secondaryActions: { type: Array as () => PageAction[], default: () => [] },
  breakpoint: { type: String as () => 'sm' | 'md', default: 'sm' },
  wrapLongText: { type: Boolean, default: false },
});

const router = useRouter();

function handleAction(action: PageAction) {
  if (action.disabled) return;
  if (action.to) {
    router.push(action.to);
    return;
  }
  if (action.onClick) action.onClick();
}

const containerBreakClasses = computed(() => {
  return props.breakpoint === 'md'
    ? 'flex flex-col gap-3 md:flex-row md:items-center md:justify-between'
    : 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between';
});

const secondaryInlineClass = computed(() => {
  return props.breakpoint === 'md' ? '!hidden md:inline-flex' : '!hidden sm:inline-flex';
});

const menuHiddenClass = computed(() => {
  return props.breakpoint === 'md' ? 'md:hidden' : 'sm:hidden';
});
</script>

<template>
  <div class="mb-6">
    <div :class="containerBreakClasses">
      <div>
        <h1 class="font-bold mb-1 text-2xl sm:text-3xl md:text-3xl">{{ title }}</h1>
        <div v-if="$slots.description">
          <slot name="description" />
        </div>
        <p
          v-else-if="subtitle"
          :class="[
            'text-medium-emphasis',
            'text-sm',
            'sm:text-base',
            wrapLongText ? 'break-all' : '',
          ]"
        >
          {{ subtitle }}
        </p>
        <slot name="extra" />
      </div>
      <div class="flex flex-wrap gap-2 sm:justify-end md:justify-end">
        <v-btn
          v-if="showBack"
          variant="outlined"
          prepend-icon="mdi-arrow-left"
          @click="router.back()"
        >
          返回
        </v-btn>
        <template v-for="action in primaryActions" :key="action.key">
          <v-btn
            :color="action.color"
            :variant="action.variant || 'flat'"
            :prepend-icon="action.icon"
            :size="action.size || 'default'"
            :loading="action.loading"
            :disabled="action.disabled"
            @click="handleAction(action)"
          >
            {{ action.label }}
          </v-btn>
        </template>
        <template v-for="action in secondaryActions" :key="action.key + '-inline'">
          <v-btn
            :class="secondaryInlineClass"
            :color="action.color || undefined"
            :variant="action.variant || 'outlined'"
            :prepend-icon="action.icon"
            :size="action.size || 'small'"
            :loading="action.loading"
            :disabled="action.disabled"
            @click="handleAction(action)"
          >
            {{ action.label }}
          </v-btn>
        </template>
        <v-menu v-if="secondaryActions && secondaryActions.length" :class="menuHiddenClass">
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="outlined" icon="mdi-dots-horizontal" size="small" />
          </template>
          <v-list>
            <v-list-item
              v-for="action in secondaryActions"
              :key="action.key + '-menu'"
              @click="handleAction(action)"
            >
              <v-icon v-if="action.icon" class="mr-2">{{ action.icon }}</v-icon>
              {{ action.label }}
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>
  </div>
</template>
