<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 文件输入引用
const fileInput = ref<HTMLInputElement>();

// 当前激活的标签页
const activeTab = ref('profile');

// 用户信息表单
const profileForm = ref({
  username: 'john_doe',
  email: 'john.doe@example.com',
  fullName: 'John Doe',
  phone: '+1 234 567 8900',
  company: 'Tech Corp',
  position: 'Senior Developer',
  bio: '热爱技术的全栈开发者，专注于AI和机器学习领域。',
  avatar: '',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
});

// 安全设置表单
const securityForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  twoFactorEnabled: true,
  loginNotifications: true,
  sessionTimeout: 30,
});

// 偏好设置表单
const preferencesForm = ref({
  theme: 'auto',
  emailNotifications: {
    marketing: false,
    security: true,
    updates: true,
    billing: true,
  },
  privacy: {
    profileVisibility: 'private',
    activityTracking: false,
    dataCollection: true,
  },
  interface: {
    sidebarCollapsed: false,
    compactMode: false,
    animations: true,
  },
});

// API设置表单
const apiForm = ref({
  webhookUrl: '',
  webhookEvents: ['user.created', 'user.updated'],
  rateLimitNotifications: true,
  apiVersion: 'v1',
});

// 对话框状态
const avatarDialog = ref(false);
const deleteAccountDialog = ref(false);
const twoFactorDialog = ref(false);

// 时区选项
const timezones = [
  { value: 'Asia/Shanghai', title: '中国标准时间 (UTC+8)' },
  { value: 'America/New_York', title: '美国东部时间 (UTC-5)' },
  { value: 'Europe/London', title: '英国时间 (UTC+0)' },
  { value: 'Asia/Tokyo', title: '日本标准时间 (UTC+9)' },
  { value: 'Australia/Sydney', title: '澳大利亚东部时间 (UTC+10)' },
];

// 语言选项
const languages = [
  { value: 'zh-CN', title: '简体中文' },
  { value: 'en-US', title: 'English (US)' },
  { value: 'ja-JP', title: '日本語' },
  { value: 'ko-KR', title: '한국어' },
];

// 主题选项
const themes = [
  { value: 'light', title: '浅色主题', icon: 'mdi-white-balance-sunny' },
  { value: 'dark', title: '深色主题', icon: 'mdi-moon-waning-crescent' },
  { value: 'auto', title: '跟随系统', icon: 'mdi-theme-light-dark' },
];

// 隐私选项
const privacyOptions = [
  { value: 'public', title: '公开' },
  { value: 'private', title: '私密' },
  { value: 'friends', title: '仅好友' },
];

// Webhook事件选项
const webhookEvents = [
  { value: 'user.created', title: '用户创建' },
  { value: 'user.updated', title: '用户更新' },
  { value: 'user.deleted', title: '用户删除' },
  { value: 'token.created', title: '密钥创建' },
  { value: 'token.revoked', title: '密钥撤销' },
  { value: 'billing.updated', title: '账单更新' },
];

// API版本选项
const apiVersions = [
  { value: 'v1', title: 'v1.0 (稳定版)' },
  { value: 'v2', title: 'v2.0 (测试版)' },
];

// 会话超时选项
const sessionTimeouts = [
  { value: 15, title: '15分钟' },
  { value: 30, title: '30分钟' },
  { value: 60, title: '1小时' },
  { value: 240, title: '4小时' },
  { value: 480, title: '8小时' },
  { value: 0, title: '永不超时' },
];

// 登录历史
const loginHistory = ref([
  {
    id: 1,
    device: 'Chrome on Windows',
    location: '北京, 中国',
    ip: '192.168.1.100',
    timestamp: '2024-01-20 15:30:25',
    status: 'success',
  },
  {
    id: 2,
    device: 'Safari on iPhone',
    location: '上海, 中国',
    ip: '192.168.1.101',
    timestamp: '2024-01-20 10:15:10',
    status: 'success',
  },
  {
    id: 3,
    device: 'Firefox on Linux',
    location: '深圳, 中国',
    ip: '192.168.1.102',
    timestamp: '2024-01-19 14:22:45',
    status: 'failed',
  },
]);

// 表单验证状态
const isProfileValid = ref(true);
const isSecurityValid = ref(true);
const isPreferencesValid = ref(true);
const isApiValid = ref(true);

// 密码强度计算
const passwordStrength = computed(() => {
  const password = securityForm.value.newPassword;
  if (!password) return 0;

  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[a-z]/.test(password)) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;

  return strength;
});

// 密码强度颜色
const passwordStrengthColor = computed(() => {
  const strength = passwordStrength.value;
  if (strength < 50) return 'error';
  if (strength < 75) return 'warning';
  return 'success';
});

// 密码强度文本
const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value;
  if (strength < 25) return '很弱';
  if (strength < 50) return '弱';
  if (strength < 75) return '中等';
  if (strength < 100) return '强';
  return '很强';
});

// 保存用户信息
const saveProfile = () => {
  console.log('保存用户信息:', profileForm.value);
  // 模拟保存
};

// 保存安全设置
const saveSecurity = () => {
  if (securityForm.value.newPassword !== securityForm.value.confirmPassword) {
    console.error('密码确认不匹配');
    return;
  }
  console.log('保存安全设置:', securityForm.value);
  // 模拟保存
};

// 保存偏好设置
const savePreferences = () => {
  console.log('保存偏好设置:', preferencesForm.value);
  // 模拟保存
};

// 保存API设置
const saveApiSettings = () => {
  console.log('保存API设置:', apiForm.value);
  // 模拟保存
};

// 上传头像
const uploadAvatar = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    // 模拟上传
    const reader = new FileReader();
    reader.onload = e => {
      profileForm.value.avatar = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// 删除账户
const deleteAccount = () => {
  console.log('删除账户');
  deleteAccountDialog.value = false;
};

// 启用/禁用双因素认证
const toggleTwoFactor = () => {
  if (securityForm.value.twoFactorEnabled) {
    twoFactorDialog.value = true;
  } else {
    securityForm.value.twoFactorEnabled = false;
  }
};

// 测试Webhook
const testWebhook = () => {
  console.log('测试Webhook');
};

// 重置API密钥
const resetApiKey = () => {
  console.log('重置API密钥');
};

onMounted(() => {
  console.log('PersonalSettings mounted');
});
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold mb-2">个人设置</h1>
      <p class="text-subtitle-1 text-medium-emphasis">管理您的个人信息、安全设置和偏好配置</p>
    </div>

    <!-- 标签页 -->
    <v-tabs v-model="activeTab" class="mb-6">
      <v-tab value="profile">
        <v-icon class="mr-2">mdi-account</v-icon>
        个人信息
      </v-tab>
      <v-tab value="security">
        <v-icon class="mr-2">mdi-shield-account</v-icon>
        安全设置
      </v-tab>
      <v-tab value="preferences">
        <v-icon class="mr-2">mdi-cog</v-icon>
        偏好设置
      </v-tab>
      <v-tab value="api">
        <v-icon class="mr-2">mdi-api</v-icon>
        API设置
      </v-tab>
    </v-tabs>

    <!-- 个人信息标签页 -->
    <v-window v-model="activeTab">
      <v-window-item value="profile">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-account-edit</v-icon>
            个人信息
          </v-card-title>

          <v-card-text>
            <v-form v-model="isProfileValid">
              <v-row>
                <!-- 头像上传 -->
                <v-col cols="12" class="text-center mb-4">
                  <v-avatar size="120" class="mb-4">
                    <v-img v-if="profileForm.avatar" :src="profileForm.avatar" alt="Avatar"></v-img>
                    <v-icon v-else size="60">mdi-account-circle</v-icon>
                  </v-avatar>
                  <div>
                    <v-btn
                      color="primary"
                      variant="outlined"
                      prepend-icon="mdi-camera"
                      @click="avatarDialog = true"
                    >
                      更换头像
                    </v-btn>
                  </div>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileForm.username"
                    label="用户名"
                    prepend-inner-icon="mdi-account"
                    required
                    :rules="[v => !!v || '用户名不能为空']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileForm.email"
                    label="邮箱地址"
                    type="email"
                    prepend-inner-icon="mdi-email"
                    required
                    :rules="[
                      v => !!v || '邮箱不能为空',
                      v => /.+@.+\..+/.test(v) || '邮箱格式不正确',
                    ]"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileForm.fullName"
                    label="真实姓名"
                    prepend-inner-icon="mdi-card-account-details"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileForm.phone"
                    label="手机号码"
                    prepend-inner-icon="mdi-phone"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileForm.company"
                    label="公司"
                    prepend-inner-icon="mdi-office-building"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileForm.position"
                    label="职位"
                    prepend-inner-icon="mdi-briefcase"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="profileForm.timezone"
                    :items="timezones"
                    item-title="title"
                    item-value="value"
                    label="时区"
                    prepend-inner-icon="mdi-clock"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="profileForm.language"
                    :items="languages"
                    item-title="title"
                    item-value="value"
                    label="语言"
                    prepend-inner-icon="mdi-translate"
                  ></v-select>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="profileForm.bio"
                    label="个人简介"
                    prepend-inner-icon="mdi-text"
                    rows="3"
                    counter="200"
                    :rules="[v => !v || v.length <= 200 || '个人简介不能超过200字符']"
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="flat" @click="saveProfile" :disabled="!isProfileValid">
              保存更改
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-window-item>

      <!-- 安全设置标签页 -->
      <v-window-item value="security">
        <v-row>
          <v-col cols="12" md="8">
            <!-- 密码设置 -->
            <v-card class="mb-6" elevation="2">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-lock</v-icon>
                密码设置
              </v-card-title>

              <v-card-text>
                <v-form v-model="isSecurityValid">
                  <v-text-field
                    v-model="securityForm.currentPassword"
                    label="当前密码"
                    type="password"
                    prepend-inner-icon="mdi-lock"
                    required
                    class="mb-4"
                  ></v-text-field>

                  <v-text-field
                    v-model="securityForm.newPassword"
                    label="新密码"
                    type="password"
                    prepend-inner-icon="mdi-lock-plus"
                    :rules="[v => !v || v.length >= 8 || '密码至少8位字符']"
                    class="mb-2"
                  ></v-text-field>

                  <!-- 密码强度指示器 -->
                  <div v-if="securityForm.newPassword" class="mb-4">
                    <div class="d-flex justify-space-between align-center mb-1">
                      <span class="text-caption">密码强度:</span>
                      <span class="text-caption" :class="`text-${passwordStrengthColor}`">
                        {{ passwordStrengthText }}
                      </span>
                    </div>
                    <v-progress-linear
                      :model-value="passwordStrength"
                      :color="passwordStrengthColor"
                      height="4"
                    ></v-progress-linear>
                  </div>

                  <v-text-field
                    v-model="securityForm.confirmPassword"
                    label="确认新密码"
                    type="password"
                    prepend-inner-icon="mdi-lock-check"
                    :rules="[v => !v || v === securityForm.newPassword || '密码确认不匹配']"
                  ></v-text-field>
                </v-form>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  variant="flat"
                  @click="saveSecurity"
                  :disabled="!isSecurityValid"
                >
                  更新密码
                </v-btn>
              </v-card-actions>
            </v-card>

            <!-- 双因素认证 -->
            <v-card class="mb-6" elevation="2">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-two-factor-authentication</v-icon>
                双因素认证
              </v-card-title>

              <v-card-text>
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-subtitle-1 font-weight-medium mb-1">启用双因素认证</div>
                    <div class="text-body-2 text-medium-emphasis">为您的账户添加额外的安全保护</div>
                  </div>
                  <v-switch
                    v-model="securityForm.twoFactorEnabled"
                    color="primary"
                    @change="toggleTwoFactor"
                  ></v-switch>
                </div>
              </v-card-text>
            </v-card>

            <!-- 其他安全设置 -->
            <v-card elevation="2">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-security</v-icon>
                其他安全设置
              </v-card-title>

              <v-card-text>
                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <div class="text-subtitle-1 font-weight-medium mb-1">登录通知</div>
                    <div class="text-body-2 text-medium-emphasis">新设备登录时发送邮件通知</div>
                  </div>
                  <v-switch v-model="securityForm.loginNotifications" color="primary"></v-switch>
                </div>

                <v-select
                  v-model="securityForm.sessionTimeout"
                  :items="sessionTimeouts"
                  item-title="title"
                  item-value="value"
                  label="会话超时"
                  prepend-inner-icon="mdi-timer"
                ></v-select>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <!-- 登录历史 -->
            <v-card elevation="2">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-history</v-icon>
                登录历史
              </v-card-title>

              <v-card-text>
                <div v-for="login in loginHistory" :key="login.id" class="mb-4">
                  <div class="d-flex align-center mb-1">
                    <v-icon
                      :color="login.status === 'success' ? 'success' : 'error'"
                      size="16"
                      class="mr-2"
                    >
                      {{ login.status === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                    </v-icon>
                    <span class="text-body-2 font-weight-medium">
                      {{ login.device }}
                    </span>
                  </div>
                  <div class="text-caption text-medium-emphasis ml-6">
                    {{ login.location }}<br />
                    {{ login.timestamp }}
                  </div>
                  <v-divider
                    v-if="login.id !== loginHistory[loginHistory.length - 1].id"
                    class="mt-3"
                  ></v-divider>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- 偏好设置标签页 -->
      <v-window-item value="preferences">
        <v-row>
          <v-col cols="12" md="6">
            <!-- 界面设置 -->
            <v-card class="mb-6" elevation="2">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-palette</v-icon>
                界面设置
              </v-card-title>

              <v-card-text>
                <v-select
                  v-model="preferencesForm.theme"
                  :items="themes"
                  item-title="title"
                  item-value="value"
                  label="主题"
                  class="mb-4"
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-icon :icon="item.raw.icon"></v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>

                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <div class="text-subtitle-1 font-weight-medium mb-1">侧边栏折叠</div>
                    <div class="text-body-2 text-medium-emphasis">默认折叠侧边栏</div>
                  </div>
                  <v-switch
                    v-model="preferencesForm.interface.sidebarCollapsed"
                    color="primary"
                  ></v-switch>
                </div>

                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <div class="text-subtitle-1 font-weight-medium mb-1">紧凑模式</div>
                    <div class="text-body-2 text-medium-emphasis">减少界面元素间距</div>
                  </div>
                  <v-switch
                    v-model="preferencesForm.interface.compactMode"
                    color="primary"
                  ></v-switch>
                </div>

                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-subtitle-1 font-weight-medium mb-1">动画效果</div>
                    <div class="text-body-2 text-medium-emphasis">启用界面动画效果</div>
                  </div>
                  <v-switch
                    v-model="preferencesForm.interface.animations"
                    color="primary"
                  ></v-switch>
                </div>
              </v-card-text>
            </v-card>

            <!-- 隐私设置 -->
            <v-card elevation="2">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-shield-account</v-icon>
                隐私设置
              </v-card-title>

              <v-card-text>
                <v-select
                  v-model="preferencesForm.privacy.profileVisibility"
                  :items="privacyOptions"
                  item-title="title"
                  item-value="value"
                  label="个人资料可见性"
                  class="mb-4"
                ></v-select>

                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <div class="text-subtitle-1 font-weight-medium mb-1">活动跟踪</div>
                    <div class="text-body-2 text-medium-emphasis">允许跟踪使用活动</div>
                  </div>
                  <v-switch
                    v-model="preferencesForm.privacy.activityTracking"
                    color="primary"
                  ></v-switch>
                </div>

                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-subtitle-1 font-weight-medium mb-1">数据收集</div>
                    <div class="text-body-2 text-medium-emphasis">允许收集匿名使用数据</div>
                  </div>
                  <v-switch
                    v-model="preferencesForm.privacy.dataCollection"
                    color="primary"
                  ></v-switch>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <!-- 通知设置 -->
            <v-card elevation="2">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-bell</v-icon>
                通知设置
              </v-card-title>

              <v-card-text>
                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <div class="text-subtitle-1 font-weight-medium mb-1">营销邮件</div>
                    <div class="text-body-2 text-medium-emphasis">接收产品更新和优惠信息</div>
                  </div>
                  <v-switch
                    v-model="preferencesForm.emailNotifications.marketing"
                    color="primary"
                  ></v-switch>
                </div>

                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <div class="text-subtitle-1 font-weight-medium mb-1">安全通知</div>
                    <div class="text-body-2 text-medium-emphasis">账户安全相关通知</div>
                  </div>
                  <v-switch
                    v-model="preferencesForm.emailNotifications.security"
                    color="primary"
                  ></v-switch>
                </div>

                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <div class="text-subtitle-1 font-weight-medium mb-1">系统更新</div>
                    <div class="text-body-2 text-medium-emphasis">系统维护和更新通知</div>
                  </div>
                  <v-switch
                    v-model="preferencesForm.emailNotifications.updates"
                    color="primary"
                  ></v-switch>
                </div>

                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-subtitle-1 font-weight-medium mb-1">账单通知</div>
                    <div class="text-body-2 text-medium-emphasis">账单和付款相关通知</div>
                  </div>
                  <v-switch
                    v-model="preferencesForm.emailNotifications.billing"
                    color="primary"
                  ></v-switch>
                </div>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="flat" @click="savePreferences"> 保存设置 </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- API设置标签页 -->
      <v-window-item value="api">
        <v-row>
          <v-col cols="12" md="8">
            <!-- Webhook设置 -->
            <v-card class="mb-6" elevation="2">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-webhook</v-icon>
                Webhook设置
              </v-card-title>

              <v-card-text>
                <v-form v-model="isApiValid">
                  <v-text-field
                    v-model="apiForm.webhookUrl"
                    label="Webhook URL"
                    prepend-inner-icon="mdi-link"
                    placeholder="https://your-domain.com/webhook"
                    :rules="[v => !v || /^https?:\/\/.+/.test(v) || 'URL格式不正确']"
                    class="mb-4"
                  ></v-text-field>

                  <v-select
                    v-model="apiForm.webhookEvents"
                    :items="webhookEvents"
                    item-title="title"
                    item-value="value"
                    label="订阅事件"
                    multiple
                    chips
                    prepend-inner-icon="mdi-bell"
                    class="mb-4"
                  ></v-select>

                  <div class="d-flex justify-space-between align-center mb-4">
                    <div>
                      <div class="text-subtitle-1 font-weight-medium mb-1">速率限制通知</div>
                      <div class="text-body-2 text-medium-emphasis">达到API速率限制时发送通知</div>
                    </div>
                    <v-switch v-model="apiForm.rateLimitNotifications" color="primary"></v-switch>
                  </div>

                  <v-select
                    v-model="apiForm.apiVersion"
                    :items="apiVersions"
                    item-title="title"
                    item-value="value"
                    label="API版本"
                    prepend-inner-icon="mdi-api"
                  ></v-select>
                </v-form>
              </v-card-text>

              <v-card-actions>
                <v-btn
                  variant="outlined"
                  prepend-icon="mdi-test-tube"
                  @click="testWebhook"
                  :disabled="!apiForm.webhookUrl"
                >
                  测试Webhook
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  variant="flat"
                  @click="saveApiSettings"
                  :disabled="!isApiValid"
                >
                  保存设置
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <!-- API密钥管理 -->
            <v-card elevation="2">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-key</v-icon>
                API密钥
              </v-card-title>

              <v-card-text>
                <div class="text-body-2 text-medium-emphasis mb-4">
                  您的API密钥用于访问我们的服务。请妥善保管，不要与他人分享。
                </div>

                <v-text-field
                  label="当前API密钥"
                  value="sk-1234567890abcdef..."
                  readonly
                  type="password"
                  append-inner-icon="mdi-content-copy"
                  class="mb-4"
                ></v-text-field>

                <v-btn
                  color="warning"
                  variant="outlined"
                  prepend-icon="mdi-refresh"
                  block
                  @click="resetApiKey"
                >
                  重置API密钥
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- 危险操作区域 -->
    <v-card class="mt-6" elevation="2" color="error" variant="outlined">
      <v-card-title class="d-flex align-center text-error">
        <v-icon class="mr-2">mdi-alert</v-icon>
        危险操作
      </v-card-title>

      <v-card-text>
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-subtitle-1 font-weight-medium mb-1">删除账户</div>
            <div class="text-body-2 text-medium-emphasis">
              永久删除您的账户和所有相关数据。此操作不可撤销。
            </div>
          </div>
          <v-btn
            color="error"
            variant="outlined"
            prepend-icon="mdi-delete"
            @click="deleteAccountDialog = true"
          >
            删除账户
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- 头像上传对话框 -->
    <v-dialog v-model="avatarDialog" max-width="400">
      <v-card>
        <v-card-title>更换头像</v-card-title>

        <v-card-text>
          <div class="text-center">
            <input
              type="file"
              accept="image/*"
              style="display: none"
              ref="fileInput"
              @change="uploadAvatar"
            />
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-upload"
              @click="fileInput?.click()"
            >
              选择图片
            </v-btn>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="avatarDialog = false"> 取消 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除账户确认对话框 -->
    <v-dialog v-model="deleteAccountDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">
          <v-icon class="mr-2">mdi-alert</v-icon>
          确认删除账户
        </v-card-title>

        <v-card-text>
          <v-alert type="error" variant="tonal" class="mb-4">
            <strong>警告:</strong> 此操作将永久删除您的账户和所有相关数据，包括:
          </v-alert>

          <ul class="mb-4">
            <li>个人信息和设置</li>
            <li>所有项目和文件</li>
            <li>使用记录和统计数据</li>
            <li>API密钥和密钥</li>
          </ul>

          <p class="text-body-2 text-medium-emphasis">
            请输入您的用户名 <strong>{{ profileForm.username }}</strong> 以确认删除:
          </p>

          <v-text-field label="确认用户名" placeholder="请输入用户名" required></v-text-field>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteAccountDialog = false"> 取消 </v-btn>
          <v-btn color="error" variant="flat" @click="deleteAccount"> 确认删除 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 双因素认证设置对话框 -->
    <v-dialog v-model="twoFactorDialog" max-width="500">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-two-factor-authentication</v-icon>
          设置双因素认证
        </v-card-title>

        <v-card-text>
          <div class="text-center mb-4">
            <v-img
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
              width="200"
              height="200"
              class="mx-auto mb-4"
            ></v-img>
            <p class="text-body-2">请使用您的认证应用扫描上方二维码，然后输入6位验证码:</p>
          </div>

          <v-text-field
            label="验证码"
            placeholder="请输入6位验证码"
            maxlength="6"
            required
          ></v-text-field>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="twoFactorDialog = false"> 取消 </v-btn>
          <v-btn color="primary" variant="flat"> 验证并启用 </v-btn>
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

.v-window-item {
  padding: 0;
}

.v-tab {
  text-transform: none;
}
</style>
