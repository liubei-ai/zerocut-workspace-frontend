# SubscriptionSuccessDialog Component Usage Example

## Import and Setup

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import SubscriptionSuccessDialog from '@/components/zerocut/SubscriptionSuccessDialog.vue';

const router = useRouter();
const workspaceStore = useWorkspaceStore();

// Dialog control
const showSuccessDialog = ref(false);
const subscriptionId = ref<number | null>(null);

// Example: After successful payment/subscription
async function handleSubscriptionComplete(newSubscriptionId: number) {
  subscriptionId.value = newSubscriptionId;
  showSuccessDialog.value = true;
}

// Navigate to subscription details page
function handleViewDetails() {
  router.push('/plans-and-billing');
}

function handleDialogClose() {
  console.log('Dialog closed');
}
</script>

<template>
  <div>
    <!-- Your payment/subscription flow -->
    <v-btn @click="handleSubscriptionComplete(123)"> Complete Subscription </v-btn>

    <!-- Success Dialog -->
    <SubscriptionSuccessDialog
      v-model="showSuccessDialog"
      :subscription-id="subscriptionId"
      :workspace-id="workspaceStore.currentWorkspaceId"
      @view-details="handleViewDetails"
      @close="handleDialogClose"
    />
  </div>
</template>
```

## Integration with Payment Dialogs

```vue
<script setup lang="ts">
import { ref } from 'vue';
import MembershipPaymentDialog from '@/components/zerocut/MembershipPaymentDialog.vue';
import SubscriptionSuccessDialog from '@/components/zerocut/SubscriptionSuccessDialog.vue';

const showPaymentDialog = ref(false);
const showSuccessDialog = ref(false);
const completedSubscriptionId = ref<number | null>(null);

function handlePaymentSuccess(subscriptionId: number) {
  // Close payment dialog
  showPaymentDialog.value = false;

  // Show success dialog
  completedSubscriptionId.value = subscriptionId;
  showSuccessDialog.value = true;
}
</script>

<template>
  <div>
    <MembershipPaymentDialog v-model="showPaymentDialog" @success="handlePaymentSuccess" />

    <SubscriptionSuccessDialog
      v-model="showSuccessDialog"
      :subscription-id="completedSubscriptionId"
      :workspace-id="workspaceId"
      @view-details="router.push('/plans-and-billing')"
    />
  </div>
</template>
```

## Props

| Prop             | Type             | Required | Description                                                            |
| ---------------- | ---------------- | -------- | ---------------------------------------------------------------------- |
| `modelValue`     | `boolean`        | Yes      | Controls dialog visibility (v-model)                                   |
| `subscriptionId` | `number \| null` | Yes      | The subscription ID (for tracking, actual data fetched by workspaceId) |
| `workspaceId`    | `string \| null` | Yes      | Workspace ID to fetch subscription details                             |

## Events

| Event               | Payload   | Description                                    |
| ------------------- | --------- | ---------------------------------------------- |
| `update:modelValue` | `boolean` | Emitted when dialog visibility changes         |
| `close`             | None      | Emitted when dialog is closed                  |
| `view-details`      | None      | Emitted when user clicks "View Details" button |

## Features

### Three Display States

1. **Loading State**

   - Shows circular progress indicator
   - Displays "Loading subscription info..." message
   - Automatically shown when dialog opens with valid props

2. **Error State**

   - Shows warning icon
   - Displays error message
   - Provides "View Details" button to navigate even on error
   - Useful for network failures or API issues

3. **Success State**
   - Celebration icon with bounce animation
   - Success title and subtitle
   - Information card with 4 key details:
     - Subscription plan name (Basic/Standard/Premium)
     - Monthly credits quota
     - Subscription type (cycle + renewal method)
     - Current period dates (YYYY-MM-DD format)
   - "View Details" button for navigation

### Data Display

The component automatically formats and displays:

- **Plan Name**: Translated tier name (基础会员/标准会员/高级会员)
- **Monthly Credits**: Formatted with unit (e.g., "1000 积分")
- **Subscription Type**: Combined cycle and renewal info (e.g., "连续包月・自动续费")
- **Period Dates**: Formatted date range (e.g., "2026-01-01 - 2026-01-31")

### i18n Support

All text is fully internationalized with support for:

- Chinese (zhHans) - 简体中文
- English (en)
- Japanese (ja) - 日本語

Keys are under `zerocut.subscriptionSuccess.*`

## Styling

- **Max Width**: 560px for optimal readability
- **Persistent**: Dialog cannot be closed by clicking outside (intentional)
- **Celebration Animation**: Bounce animation on success icon
- **Responsive**: Works on mobile and desktop
- **Material Design 3**: Follows Vuetify 3 design guidelines

## Best Practices

1. **Always provide workspaceId**: The component fetches the current subscription for the workspace
2. **Handle view-details event**: Navigate user to appropriate details page
3. **Don't auto-close too quickly**: Let users see the success state
4. **Error handling**: Component handles API errors gracefully with fallback UI

## Testing Scenarios

- ✅ Dialog opens and fetches subscription data
- ✅ Loading state displayed during API call
- ✅ Success state shows all subscription details
- ✅ Error state allows navigation despite failure
- ✅ All i18n keys work in all languages
- ✅ Celebration animation works
- ✅ Dialog is persistent (no outside click to close)
- ✅ All events are properly emitted

## Notes

- The component uses `getCurrentSubscription(workspaceId)` API, not subscription ID
- Date formatting uses `formatDateShort` utility (YYYY-MM-DD format)
- Component matches the design style of `NewbieCreditsDialog`
- All icons are from Material Design Icons (@mdi)
