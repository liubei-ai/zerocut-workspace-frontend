<template>
  <div class="subject-list">
    <div class="subject-list__header">
      <v-text-field
        v-model="searchQuery"
        :label="$t('common.search')"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        class="mb-4"
        @update:model-value="handleSearch"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showCreateDialog = true" class="mb-4">
        {{ $t('resource.createSubject') }}
      </v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-empty-state
      v-if="!loading && subjects.length === 0"
      :icon="'mdi-account'"
      :headline="$t('resource.subjectsPlaceholder')"
      :title="$t('resource.subjectsDescription')"
    />

    <v-row v-else>
      <v-col v-for="subject in subjects" :key="subject.id" cols="12" sm="6" md="4">
        <SubjectCard :subject="subject" @edit="handleEditSubject" @delete="handleDeleteSubject" />
      </v-col>
    </v-row>

    <!-- Pagination -->
    <div v-if="!loading && totalSubjects > limit" class="d-flex justify-center mt-6">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        @update:model-value="handlePageChange"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <CreateSubjectDialog
      v-model="showCreateDialog"
      :edit-subject="editingSubject"
      :library-id="libraryId"
      @save="handleSaveSubject"
      @close="handleDialogClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useResourceStore } from '@/stores/resourceStore';
import SubjectCard from './SubjectCard.vue';
import CreateSubjectDialog from './CreateSubjectDialog.vue';

interface Subject {
  id: string;
  name: string;
  voice?: string;
  styles: string[];
  description?: string;
  referenceImages: any[];
  createdAt: string;
  updatedAt: string;
}

const props = defineProps<{
  libraryId: string;
}>();

const emit = defineEmits<{
  update: [];
}>();

const resourceStore = useResourceStore();

const loading = ref(false);
const searchQuery = ref('');
const showCreateDialog = ref(false);
const editingSubject = ref<Subject | null>(null);
const currentPage = ref(1);
const limit = ref(12);
const subjects = ref<Subject[]>([]);
const totalSubjects = ref(0);

const totalPages = computed(() => Math.ceil(totalSubjects.value / limit.value));

const fetchSubjects = async (page: number = 1) => {
  loading.value = true;
  try {
    const response = await resourceStore.fetchSubjects(props.libraryId, page, limit.value);
    subjects.value = response.data;
    totalSubjects.value = response.total;
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  currentPage.value = 1;
  // TODO: Implement search filtering
  await fetchSubjects(1);
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchSubjects(page);
};

const handleEditSubject = (subject: Subject) => {
  editingSubject.value = subject;
  showCreateDialog.value = true;
};

const handleDeleteSubject = async (subjectId: string) => {
  if (confirm('Are you sure you want to delete this subject?')) {
    try {
      await resourceStore.deleteSubject(subjectId);
      emit('update');
      await fetchSubjects(currentPage.value);
    } catch (error) {
      console.error('Failed to delete subject:', error);
    }
  }
};

const handleSaveSubject = async () => {
  editingSubject.value = null;
  await fetchSubjects(currentPage.value);
  emit('update');
};

const handleDialogClose = () => {
  editingSubject.value = null;
  showCreateDialog.value = false;
};

onMounted(() => {
  fetchSubjects();
});
</script>

<style scoped lang="scss">
.subject-list {
  &__header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: flex-end;

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: stretch;

      .v-btn {
        width: 100%;
      }
    }
  }
}
</style>
