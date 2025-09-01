<script setup lang="ts">
import ActivityCard from '@/components/dashboard/ActivityCard.vue';
import SalesCard from '@/components/dashboard/SalesCard.vue';
import SourcesCard from '@/components/dashboard/SourcesCard.vue';
import TableCard from '@/components/dashboard/TableCard.vue';
import TicketsCard from '@/components/dashboard/TicketsCard.vue';
// import TrackCard from "@/components/dashboard/TrackCard.vue";
import TaskCard from '@/components/dashboard/ChartCard.vue';
import TodoCard from '@/components/dashboard/TodoCard.vue';
</script>

<template>
  <div class="pa-5">
    <!-- ---------------------------------------------- -->
    <!---First Row -->
    <!-- ---------------------------------------------- -->
    <v-row class="flex-0" dense>
      <v-col cols="12" xl="4">
        <!-- Sales Card -->
        <v-card class="card-shadow" height="420">
          <!-- <sales-card></sales-card> -->
          <SalesCard
            :value="1837.32"
            class="h-100"
            :percentage="3.2"
            style="min-height: 380px"
            :percentage-label="$t('dashboard.lastweek')"
            :action-label="$t('dashboard.viewReport')"
          ></SalesCard>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" xl="4">
        <!-- Activity Card -->
        <v-card class="card-shadow" height="420">
          <ActivityCard></ActivityCard>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" xl="4">
        <!-- Trafiic Card-->
        <v-card class="card-shadow h-full" height="420">
          <SourcesCard></SourcesCard>
        </v-card>
      </v-col>
    </v-row>
    <!-- ---------------------------------------------- -->
    <!---Second Row -->
    <!-- ---------------------------------------------- -->
    <v-row class="card-shadow flex-grow-0" dense>
      <v-col cols="12" xl="6">
        <!-- Table Card-->
        <v-card class="card-shadow" height="420">
          <TableCard></TableCard>
        </v-card>
      </v-col>
      <v-col cols="12" xl="6">
        <!-- Task Card-->
        <v-card class="card-shadow" height="420">
          <TaskCard></TaskCard>
        </v-card>
      </v-col>
    </v-row>
    <!-- ---------------------------------------------- -->
    <!---Third Row -->
    <!-- ---------------------------------------------- -->
    <v-row class="card-shadow flex-grow-0" dense>
      <v-col cols="12" xl="6">
        <!-- Target Card-->
        <v-card class="card-shadow" height="420"><TodoCard></TodoCard></v-card>
      </v-col>
      <v-col cols="12" xl="6">
        <v-card class="card-shadow" height="420"><TicketsCard></TicketsCard> </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<style lang="scss" scoped></style>
