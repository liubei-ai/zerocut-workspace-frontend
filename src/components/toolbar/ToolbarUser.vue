<!--
* @Component: ToolbarNotifications
* @Maintainer: J.K. Yang
* @Description:
-->
<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { computed } from 'vue';
import StatusMenu from './StatusMenu.vue';

const userStore = useUserStore();
const authStore = useAuthStore();

const userName = computed(() => {
  if (!userStore.isLoggedIn) return 'Guest';
  return userStore.username || 'Unknown User';
});

const userEmail = computed(() => {
  if (!userStore.isLoggedIn) return 'Please login';
  return userStore.email || 'No email';
});

// 计算用户头像
const userAvatar = computed(() => {
  if (!userStore.isLoggedIn) return null;
  return userStore.avatar || null; // 返回用户头像URL，如果没有则返回null使用首字母头像
});

// 获取用户名首字母用于头像显示
const userInitials = computed(() => {
  const name = userName.value;
  if (name && name !== 'Guest' && name !== 'Unknown User') {
    return name.charAt(0).toUpperCase();
  }
  return userStore.isLoggedIn ? 'U' : 'G'; // 已登录显示 U (User)，未登录显示 G (Guest)
});

const handleLogout = () => {
  authStore.logout();
};

const navs: Array<{
  title: string;
  key: string;
  link: string;
  icon: string;
}> = [
  // {
  //   title: 'Profile Details',
  //   key: 'menu.profileDetails',
  //   link: '/profile',
  //   icon: 'mdi-account-box-outline',
  // },
  // {
  //   title: 'Plans and Billing',
  //   key: 'menu.plansAndBilling',
  //   link: '/plans-and-billing',
  //   icon: 'mdi-credit-card-outline',
  // },
  // {
  //   title: 'Team',
  //   key: 'menu.team',
  //   link: '/team',
  //   icon: 'mdi-account-group-outline',
  // },
  // {
  //   title: 'API Dashboard',
  //   key: 'menu.apiDashboard',
  //   link: '/api-dashboard',
  //   icon: 'mdi-monitor-dashboard',
  // },
  // {
  //   title: 'Integrations',
  //   key: 'menu.integrations',
  //   link: '/integrations',
  //   icon: 'mdi-puzzle-outline',
  // },
  // {
  //   title: 'Ask the Community',
  //   key: 'menu.askCommunity',
  //   link: '/ask-the-community',
  //   icon: 'mdi-help-circle-outline',
  // },
];
</script>

<template>
  <v-menu :close-on-content-click="false" location="bottom right" transition="slide-y-transition">
    <!-- ---------------------------------------------- -->
    <!-- Activator Btn -->
    <!-- ---------------------------------------------- -->
    <template v-slot:activator="{ props }">
      <v-btn class="mx-2" icon v-bind="props">
        <v-badge content="2" color="success" dot bordered>
          <v-avatar size="40" :color="userAvatar ? undefined : 'primary'">
            <img v-if="userAvatar" :src="userAvatar" :alt="userName" />
            <span v-else class="text-white font-weight-bold">{{ userInitials }}</span>
          </v-avatar>
        </v-badge>
      </v-btn>
    </template>
    <v-card max-width="300">
      <v-list lines="three" density="compact">
        <!-- ---------------------------------------------- -->
        <!-- Profile Area -->
        <!-- ---------------------------------------------- -->
        <v-list-item>
          <template v-slot:prepend>
            <v-avatar size="40" :color="userAvatar ? undefined : 'primary'">
              <img v-if="userAvatar" :src="userAvatar" :alt="userName" />
              <span v-else class="text-white font-weight-bold">{{ userInitials }}</span>
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-bold text-primary">
            {{ userName }}
            <StatusMenu />
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ userEmail }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <v-divider />
      <!-- ---------------------------------------------- -->
      <!-- Menu Area -->
      <!-- ---------------------------------------------- -->

      <v-list variant="flat" elevation="0" :lines="false" density="compact">
        <v-list-item
          color="primary"
          v-for="(nav, i) in navs"
          :key="i"
          :to="nav.link"
          link
          density="compact"
        >
          <template v-slot:prepend>
            <v-avatar size="30">
              <v-icon>{{ nav.icon }}</v-icon>
            </v-avatar>
          </template>

          <div>
            <v-list-item-subtitle class="text-body-2">{{ nav.title }}</v-list-item-subtitle>
          </div>
        </v-list-item>
      </v-list>

      <!-- <v-divider /> -->
      <!-- ---------------------------------------------- -->
      <!-- Logout Area -->
      <!-- ---------------------------------------------- -->
      <v-list variant="flat" elevation="0" :lines="false" density="compact">
        <!-- <v-list-item color="primary" to="nav.link" link density="compact">
          <template v-slot:prepend>
            <v-avatar size="30">
              <v-icon>mdi-lifebuoy</v-icon>
            </v-avatar>
          </template>

          <div>
            <v-list-item-subtitle class="text-body-2"> Help Center </v-list-item-subtitle>
          </div>
        </v-list-item> -->
        <v-list-item color="primary" link @click="handleLogout" density="compact">
          <template v-slot:prepend>
            <v-avatar size="30">
              <v-icon>mdi-logout</v-icon>
            </v-avatar>
          </template>

          <div>
            <v-list-item-subtitle class="text-body-2">
              {{ $t('menu.logout') }}
            </v-list-item-subtitle>
          </div>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<style scoped lang="scss">
// ::v-deep .v-list-item__append,
// ::v-deep .v-list-item__prepend {
//   height: 100%;
// }
</style>
