<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 对话框状态
const inviteDialog = ref(false);
const editMemberDialog = ref(false);
const removeMemberDialog = ref(false);

// 邀请表单
const inviteForm = ref({
  email: '',
  role: 'member',
  message: '',
});

// 编辑成员表单
const editMemberForm = ref({
  id: null as number | null,
  role: '',
  permissions: [] as string[],
});

// 要删除的成员
const memberToRemove = ref<any>(null);

// 角色选项（i18n）
const roles = computed(() => [
  {
    value: 'owner',
    title: t('zerocut.members.roles.owner.title'),
    description: t('zerocut.members.roles.owner.desc'),
    color: 'error',
    icon: 'mdi-crown',
  },
  {
    value: 'admin',
    title: t('zerocut.members.roles.admin.title'),
    description: t('zerocut.members.roles.admin.desc'),
    color: 'warning',
    icon: 'mdi-shield-account',
  },
  {
    value: 'editor',
    title: t('zerocut.members.roles.editor.title'),
    description: t('zerocut.members.roles.editor.desc'),
    color: 'primary',
    icon: 'mdi-pencil',
  },
  {
    value: 'viewer',
    title: t('zerocut.members.roles.viewer.title'),
    description: t('zerocut.members.roles.viewer.desc'),
    color: 'info',
    icon: 'mdi-eye',
  },
  {
    value: 'member',
    title: t('zerocut.members.roles.member.title'),
    description: t('zerocut.members.roles.member.desc'),
    color: 'success',
    icon: 'mdi-account',
  },
]);

// 权限选项（i18n）
const permissions = computed(() => [
  {
    value: 'project.create',
    title: t('zerocut.members.permissions.projectCreate.title'),
    description: t('zerocut.members.permissions.projectCreate.desc'),
  },
  {
    value: 'project.edit',
    title: t('zerocut.members.permissions.projectEdit.title'),
    description: t('zerocut.members.permissions.projectEdit.desc'),
  },
  {
    value: 'project.delete',
    title: t('zerocut.members.permissions.projectDelete.title'),
    description: t('zerocut.members.permissions.projectDelete.desc'),
  },
  {
    value: 'member.invite',
    title: t('zerocut.members.permissions.memberInvite.title'),
    description: t('zerocut.members.permissions.memberInvite.desc'),
  },
  {
    value: 'member.manage',
    title: t('zerocut.members.permissions.memberManage.title'),
    description: t('zerocut.members.permissions.memberManage.desc'),
  },
  {
    value: 'billing.view',
    title: t('zerocut.members.permissions.billingView.title'),
    description: t('zerocut.members.permissions.billingView.desc'),
  },
  {
    value: 'billing.manage',
    title: t('zerocut.members.permissions.billingManage.title'),
    description: t('zerocut.members.permissions.billingManage.desc'),
  },
  {
    value: 'settings.view',
    title: t('zerocut.members.permissions.settingsView.title'),
    description: t('zerocut.members.permissions.settingsView.desc'),
  },
  {
    value: 'settings.manage',
    title: t('zerocut.members.permissions.settingsManage.title'),
    description: t('zerocut.members.permissions.settingsManage.desc'),
  },
]);

// 成员列表
const members = ref([
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: '',
    role: 'owner',
    status: 'active',
    joinedAt: '2024-01-01',
    lastActive: '2024-01-20 15:30:25',
    permissions: [
      'project.create',
      'project.edit',
      'project.delete',
      'member.invite',
      'member.manage',
      'billing.view',
      'billing.manage',
      'settings.view',
      'settings.manage',
    ],
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar: '',
    role: 'admin',
    status: 'active',
    joinedAt: '2024-01-05',
    lastActive: '2024-01-20 14:15:10',
    permissions: [
      'project.create',
      'project.edit',
      'member.invite',
      'member.manage',
      'settings.view',
    ],
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    avatar: '',
    role: 'editor',
    status: 'active',
    joinedAt: '2024-01-10',
    lastActive: '2024-01-20 12:45:30',
    permissions: ['project.create', 'project.edit'],
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice.brown@example.com',
    avatar: '',
    role: 'viewer',
    status: 'pending',
    joinedAt: '2024-01-18',
    lastActive: null,
    permissions: [] as string[],
  },
  {
    id: 5,
    name: 'Charlie Wilson',
    email: 'charlie.wilson@example.com',
    avatar: '',
    role: 'member',
    status: 'inactive',
    joinedAt: '2024-01-12',
    lastActive: '2024-01-15 09:20:15',
    permissions: ['project.edit'],
  },
] as Array<{
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: string;
  joinedAt: string;
  lastActive: string | null;
  permissions: string[];
}>);

// 筛选选项
const filters = ref({
  role: 'all',
  status: 'all',
  search: '',
});

// 状态选项（i18n）
const statusOptions = computed(() => [
  { value: 'all', title: t('zerocut.members.filters.statusAll') },
  { value: 'active', title: t('zerocut.members.status.active') },
  { value: 'pending', title: t('zerocut.members.status.pending') },
  { value: 'inactive', title: t('zerocut.members.status.inactive') },
]);

// 角色选择项（包含“全部角色”）
const roleSelectItems = computed(() => [
  { value: 'all', title: t('zerocut.members.filters.roleAll') },
  ...roles.value,
]);

// 筛选后的成员列表
const filteredMembers = computed(() => {
  return members.value.filter(member => {
    // 角色筛选
    if (filters.value.role !== 'all' && member.role !== filters.value.role) {
      return false;
    }

    // 状态筛选
    if (filters.value.status !== 'all' && member.status !== filters.value.status) {
      return false;
    }

    // 搜索筛选
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase();
      return (
        member.name.toLowerCase().includes(search) || member.email.toLowerCase().includes(search)
      );
    }

    return true;
  });
});

// 统计数据
const stats = computed(() => {
  return {
    totalMembers: members.value.length,
    activeMembers: members.value.filter(m => m.status === 'active').length,
    pendingMembers: members.value.filter(m => m.status === 'pending').length,
    inactiveMembers: members.value.filter(m => m.status === 'inactive').length,
  };
});

// 表头（i18n）
const tableHeaders = computed(() => [
  { title: t('zerocut.members.table.columns.member'), key: 'member', sortable: true },
  { title: t('zerocut.members.table.columns.role'), key: 'role', sortable: true },
  { title: t('zerocut.members.table.columns.status'), key: 'status', sortable: true },
  { title: t('zerocut.members.table.columns.joinedAt'), key: 'joinedAt', sortable: true },
  { title: t('zerocut.members.table.columns.lastActive'), key: 'lastActive', sortable: true },
  { title: t('zerocut.members.table.columns.actions'), key: 'actions', sortable: false },
]);

// 获取角色信息
const getRoleInfo = (roleValue: string) => {
  return roles.value.find(role => role.value === roleValue) || roles.value[4]; // 默认为member
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
  case 'active':
    return 'success';
  case 'pending':
    return 'warning';
  case 'inactive':
    return 'grey';
  default:
    return 'info';
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
  case 'active':
    return t('zerocut.members.status.active');
  case 'pending':
    return t('zerocut.members.status.pending');
  case 'inactive':
    return t('zerocut.members.status.inactive');
  default:
    return t('zerocut.members.status.unknown');
  }
};

// 邀请成员
const inviteMember = () => {
  if (inviteForm.value.email) {
    const newMember = {
      id: Date.now(),
      name: inviteForm.value.email.split('@')[0],
      email: inviteForm.value.email,
      avatar: '',
      role: inviteForm.value.role,
      status: 'pending',
      joinedAt: new Date().toISOString().split('T')[0],
      lastActive: null,
      permissions: getDefaultPermissions(inviteForm.value.role),
    };

    members.value.push(newMember);
    inviteDialog.value = false;
    resetInviteForm();
  }
};

// 编辑成员
const editMember = (member: any) => {
  editMemberForm.value = {
    id: member.id,
    role: member.role,
    permissions: [...member.permissions],
  };
  editMemberDialog.value = true;
};

// 保存成员编辑
const saveMemberEdit = () => {
  const memberIndex = members.value.findIndex(m => m.id === editMemberForm.value.id);
  if (memberIndex !== -1) {
    members.value[memberIndex].role = editMemberForm.value.role;
    members.value[memberIndex].permissions = [...editMemberForm.value.permissions];
    editMemberDialog.value = false;
  }
};

// 删除成员
const removeMember = (member: any) => {
  memberToRemove.value = member;
  removeMemberDialog.value = true;
};

// 确认删除成员
const confirmRemoveMember = () => {
  if (memberToRemove.value) {
    const memberIndex = members.value.findIndex(m => m.id === memberToRemove.value.id);
    if (memberIndex !== -1) {
      members.value.splice(memberIndex, 1);
    }
    removeMemberDialog.value = false;
    memberToRemove.value = null;
  }
};

// 重新发送邀请
const resendInvite = (member: any) => {
  console.log('重新发送邀请给:', member.email);
};

// 获取默认权限
const getDefaultPermissions = (role: string): string[] => {
  switch (role) {
  case 'owner':
    return permissions.value.map(p => p.value);
  case 'admin':
    return ['project.create', 'project.edit', 'member.invite', 'member.manage', 'settings.view'];
  case 'editor':
    return ['project.create', 'project.edit'];
  case 'viewer':
    return [];
  case 'member':
    return ['project.edit'];
  default:
    return [];
  }
};

// 重置邀请表单
const resetInviteForm = () => {
  inviteForm.value = {
    email: '',
    role: 'member',
    message: '',
  };
};

// 导出成员列表
const exportMembers = () => {
  console.log(t('zerocut.members.actions.export'));
};

onMounted(() => {
  console.log('MemberManagement mounted');
});
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">{{ t('zerocut.members.title') }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis">{{ t('zerocut.members.subtitle') }}</p>
      </div>
      <div class="d-flex ga-2">
        <v-btn variant="outlined" prepend-icon="mdi-download" @click="exportMembers">
          {{ t('zerocut.members.actions.export') }}
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-account-plus" @click="inviteDialog = true">
          {{ t('zerocut.members.actions.invite') }}
        </v-btn>
      </div>
    </div>

    <!-- 统计卡片 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="primary" class="mb-2"> mdi-account-group </v-icon>
          <div class="text-h6 font-weight-bold mb-1">
            {{ stats.totalMembers }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t('zerocut.members.stats.total') }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="success" class="mb-2"> mdi-account-check </v-icon>
          <div class="text-h6 font-weight-bold mb-1">
            {{ stats.activeMembers }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t('zerocut.members.stats.active') }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="warning" class="mb-2"> mdi-account-clock </v-icon>
          <div class="text-h6 font-weight-bold mb-1">
            {{ stats.pendingMembers }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t('zerocut.members.stats.pending') }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="grey" class="mb-2"> mdi-account-off </v-icon>
          <div class="text-h6 font-weight-bold mb-1">
            {{ stats.inactiveMembers }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t('zerocut.members.stats.inactive') }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 筛选器 -->
    <v-card class="mb-6" elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-filter</v-icon>
        {{ t('zerocut.members.filters.title') }}
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.search"
              :label="t('zerocut.members.filters.searchLabel')"
              prepend-inner-icon="mdi-magnify"
              :placeholder="t('zerocut.members.filters.searchPlaceholder')"
              clearable
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="filters.role"
              :items="roleSelectItems"
              item-title="title"
              item-value="value"
              :label="t('zerocut.members.filters.roleLabel')"
              prepend-inner-icon="mdi-account-cog"
            ></v-select>
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              :label="t('zerocut.members.filters.statusLabel')"
              prepend-inner-icon="mdi-check-circle"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 成员列表 -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-account-group</v-icon>
        {{ t('zerocut.members.table.title') }}
      </v-card-title>

      <v-data-table
        :headers="tableHeaders"
        :items="filteredMembers"
        item-value="id"
        class="elevation-0"
        :items-per-page="10"
      >
        <template #item.member="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="40" class="mr-3">
              <v-img v-if="item.avatar" :src="item.avatar" :alt="item.name"></v-img>
              <v-icon v-else>mdi-account-circle</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-2 font-weight-medium">
                {{ item.name }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ item.email }}
              </div>
            </div>
          </div>
        </template>

        <template #item.role="{ item }">
          <div class="d-flex align-center">
            <v-icon
              :icon="getRoleInfo(item.role).icon"
              :color="getRoleInfo(item.role).color"
              size="20"
              class="mr-2"
            ></v-icon>
            <div>
              <div class="text-subtitle-2">
                {{ getRoleInfo(item.role).title }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{
                  t('zerocut.members.role.permissions_count', { count: item.permissions.length })
                }}
              </div>
            </div>
          </div>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <template #item.joinedAt="{ item }">
          {{ item.joinedAt }}
        </template>

        <template #item.lastActive="{ item }">
          <span v-if="item.lastActive" class="text-body-2">
            {{ item.lastActive }}
          </span>
          <span v-else class="text-medium-emphasis">-</span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              v-if="item.status === 'pending'"
              icon="mdi-email-send"
              size="small"
              variant="text"
              color="primary"
              @click="resendInvite(item)"
            >
              <v-icon>mdi-email-send</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ t('zerocut.members.actions.resendInviteTooltip') }}
              </v-tooltip>
            </v-btn>

            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="primary"
              @click="editMember(item)"
              :disabled="item.role === 'owner'"
            >
              <v-icon>mdi-pencil</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ t('zerocut.members.actions.editMemberTooltip') }}
              </v-tooltip>
            </v-btn>

            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="removeMember(item)"
              :disabled="item.role === 'owner'"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ t('zerocut.members.actions.removeMemberTooltip') }}
              </v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- 邀请成员对话框 -->
    <v-dialog v-model="inviteDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-account-plus</v-icon>
          {{ t('zerocut.members.inviteDialog.title') }}
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-text-field
              v-model="inviteForm.email"
              :label="t('zerocut.members.inviteDialog.emailLabel')"
              type="email"
              prepend-inner-icon="mdi-email"
              required
              :rules="[
                v => !!v || t('zerocut.members.inviteDialog.rules.emailRequired'),
                v => /.+@.+\..+/.test(v) || t('zerocut.members.inviteDialog.rules.emailInvalid'),
              ]"
              class="mb-4"
            ></v-text-field>

            <v-select
              v-model="inviteForm.role"
              :items="roles.filter(r => r.value !== 'owner')"
              item-title="title"
              item-value="value"
              :label="t('zerocut.members.inviteDialog.roleLabel')"
              prepend-inner-icon="mdi-account-cog"
              class="mb-4"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-icon :icon="item.raw.icon" :color="item.raw.color"></v-icon>
                  </template>
                  <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>

            <v-textarea
              v-model="inviteForm.message"
              :label="t('zerocut.members.inviteDialog.messageLabel')"
              prepend-inner-icon="mdi-message-text"
              rows="3"
              :placeholder="t('zerocut.members.inviteDialog.messagePlaceholder')"
            ></v-textarea>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="
              inviteDialog = false;
              resetInviteForm();
            "
          >
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="inviteMember"
            :disabled="!inviteForm.email || !/.+@.+\..+/.test(inviteForm.email)"
          >
            {{ t('zerocut.members.inviteDialog.send') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 编辑成员对话框 -->
    <v-dialog v-model="editMemberDialog" max-width="700">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-account-edit</v-icon>
          {{ t('zerocut.members.editDialog.title') }}
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-select
              v-model="editMemberForm.role"
              :items="roles.filter(r => r.value !== 'owner')"
              item-title="title"
              item-value="value"
              :label="t('zerocut.members.editDialog.roleLabel')"
              prepend-inner-icon="mdi-account-cog"
              class="mb-4"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-icon :icon="item.raw.icon" :color="item.raw.color"></v-icon>
                  </template>
                  <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>

            <v-divider class="mb-4"></v-divider>

            <div class="text-subtitle-1 font-weight-medium mb-3">
              {{ t('zerocut.members.editDialog.customPermissions') }}
            </div>

            <v-row>
              <v-col v-for="permission in permissions" :key="permission.value" cols="12" md="6">
                <v-checkbox
                  v-model="editMemberForm.permissions"
                  :value="permission.value"
                  :label="permission.title"
                  :hint="permission.description"
                  persistent-hint
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editMemberDialog = false"> {{ t('common.cancel') }} </v-btn>
          <v-btn color="primary" variant="flat" @click="saveMemberEdit">
            {{ t('zerocut.members.editDialog.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除成员确认对话框 -->
    <v-dialog v-model="removeMemberDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">
          <v-icon class="mr-2">mdi-alert</v-icon>
          {{ t('zerocut.members.removeDialog.title') }}
        </v-card-title>

        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-4">
            {{ t('zerocut.members.removeDialog.confirm', { name: memberToRemove?.name }) }}
          </v-alert>

          <p class="text-body-2 text-medium-emphasis">
            {{ t('zerocut.members.removeDialog.desc') }}
          </p>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="removeMemberDialog = false">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="flat" @click="confirmRemoveMember">
            {{ t('zerocut.members.removeDialog.confirmButton') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}

.v-data-table {
  border-radius: 0;
}

.v-list-item-subtitle {
  opacity: 0.7;
  font-size: 0.75rem;
}
</style>
