<script setup lang="ts">
import LanguageSwitcher from '@/components/toolbar/LanguageSwitcher.vue';
import { useCustomizeThemeStore } from '@/stores/customizeTheme';
import { useDisplay } from 'vuetify';
import ThemeToggle from './ThemeToggle.vue';
import ToolbarUser from './ToolbarUser.vue';

// import ToolbarNotifications from './ToolbarNotifications.vue';
// import { useTodoStore } from '@/views/app/todo/todoStore';

// const todoStore = useTodoStore();
const { mdAndUp } = useDisplay();
const customizeTheme = useCustomizeThemeStore();
const showMobileSearch = ref(false);
</script>

<template>
  <!-- ---------------------------------------------- -->
  <!--App Bar -->
  <!-- ---------------------------------------------- -->
  <v-app-bar :density="mdAndUp ? 'default' : 'compact'">
    <!-- ---------------------------------------------- -->
    <!-- search input mobil -->
    <!-- ---------------------------------------------- -->
    <div class="d-flex flex-fill align-center" v-if="showMobileSearch">
      <v-text-field
        color="primary"
        variant="solo"
        prepend-inner-icon="mdi-magnify"
        append-inner-icon="mdi-close"
        @click:append-inner="showMobileSearch = false"
        hide-details
        placeholder="Search"
      ></v-text-field>
    </div>
    <div v-else class="px-2 d-flex align-center justify-space-between w-100">
      <!-- ---------------------------------------------- -->
      <!-- NavIcon -->
      <!-- ---------------------------------------------- -->
      <v-app-bar-nav-icon
        @click="customizeTheme.mainSidebar = !customizeTheme.mainSidebar"
      ></v-app-bar-nav-icon>

      <v-spacer></v-spacer>

      <div class="d-flex">
        <!-- <v-btn v-if="!mdAndUp" icon @click="showMobileSearch = true">
          <v-icon>mdi-magnify</v-icon>
        </v-btn> -->

        <!-- search input desktop -->
        <!-- <v-btn v-if="mdAndUp" icon>
          <v-badge dot color="success">
            <v-icon>mdi-account-multiple-outline</v-icon>
          </v-badge>
        </v-btn> -->

        <!-- <ToolbarNotifications /> -->

        <!-- <v-btn v-if="mdAndUp" icon to="/apps/todo">
          <v-badge :content="`${todoStore.getTodoList.length} +`" color="error">
            <v-icon>mdi-calendar-check</v-icon>
          </v-badge>
        </v-btn> -->

        <!-- <v-divider vertical thickness="2" inset class="ml-5 mr-1"></v-divider> -->

        <ThemeToggle />
        <LanguageSwitcher />
        <ToolbarUser />
      </div>
    </div>
  </v-app-bar>
</template>

<style scoped lang="scss"></style>
