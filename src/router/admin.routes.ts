import type { RouteRecordRaw } from 'vue-router';

import { Permission } from '@/constants/permissions';

const AdminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    name: 'admin',
    redirect: '/admin/workspaces',
    meta: {
      layout: 'landing',
      requiresAuth: true,
      permissions: [Permission.ADMIN_ACCESS],
      category: 'Admin',
    },
    children: [
      {
        path: 'workspaces',
        name: 'admin-workspaces',
        component: () => import('@/views/admin/WorkspaceListPage.vue'),
        meta: {
          title: '工作空间管理',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.WORKSPACE_READ],
        },
      },
      {
        path: 'members',
        name: 'admin-members',
        component: () => import('@/views/admin/MemberManagementPage.vue'),
        meta: {
          title: '会员管理',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.MEMBER_READ],
        },
      },
      {
        path: 'membership-plans',
        name: 'admin-membership-plans',
        component: () => import('@/views/admin/MembershipPlanManagementPage.vue'),
        meta: {
          title: '会员商品管理',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.MEMBERSHIP_PLAN_READ],
        },
      },
      {
        path: 'members/grant',
        name: 'admin-members-grant',
        component: () => import('@/views/admin/MemberGrantPage.vue'),
        meta: {
          title: '开通会员',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.WALLET_GRANT],
        },
      },
      {
        path: 'members/:id',
        name: 'admin-member-detail',
        component: () => import('@/views/admin/MemberDetailPage.vue'),
        meta: {
          title: '会员详情',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.MEMBER_DETAIL_READ],
        },
      },
      {
        path: 'workspaces/:workspaceId/detail',
        name: 'admin-workspace-detail',
        component: () => import('@/views/admin/WorkspaceDetailPage.vue'),
        meta: {
          title: '工作区详情',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.WORKSPACE_READ],
        },
      },
      {
        path: 'system-config',
        name: 'admin-system-config',
        component: () => import('@/views/admin/SystemConfigPage.vue'),
        meta: {
          title: '系统配置管理',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.SYSTEM_CONFIG_READ],
        },
      },
      {
        path: 'system-config-audit',
        name: 'admin-system-config-audit',
        component: () => import('@/views/admin/SystemConfigAuditPage.vue'),
        meta: {
          title: '配置审计日志',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.SYSTEM_CONFIG_AUDIT_READ],
        },
      },
      {
        path: 'workflows',
        name: 'admin-workflows',
        component: () => import('@/views/admin/WorkflowRecordsView.vue'),
        meta: {
          title: '工作流',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.WORKFLOW_MANAGE],
        },
      },
      {
        path: 'personas',
        name: 'admin-personas',
        component: () => import('@/views/admin/PersonaManagementPage.vue'),
        meta: {
          title: 'Persona 管理',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.PERSONA_MANAGE],
        },
      },
      {
        path: 'toolbox',
        name: 'admin-toolbox',
        component: () => import('@/views/admin/AdminToolboxView.vue'),
        meta: {
          title: '工具箱',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.ADMIN_ACCESS],
        },
      },
      {
        path: 'data-report',
        name: 'admin-data-report',
        component: () => import('@/views/admin/DataReportPage.vue'),
        meta: {
          title: '数据报表',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.DATA_REPORT_READ],
        },
      },
      {
        path: 'referral/channels',
        name: 'admin-referral-channels',
        component: () => import('@/views/admin/ReferralChannelListPage.vue'),
        meta: {
          title: '推广渠道',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.REFERRAL_READ],
        },
      },
      {
        path: 'referral/channels/:id',
        name: 'admin-referral-channel-detail',
        component: () => import('@/views/admin/ReferralChannelDetailPage.vue'),
        meta: {
          title: '渠道详情',
          layout: 'landing',
          category: 'Admin',
          requiresAuth: true,
          permissions: [Permission.REFERRAL_READ],
        },
      },
    ],
  },
];

export default AdminRoutes;
