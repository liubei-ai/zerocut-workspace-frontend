import { Permission } from '@/constants/permissions';

/**
 * 后台管理侧栏。`permission` 字段决定该项对哪些角色可见，
 * 与 `src/router/admin.routes.ts` 里同路径的 `meta.permissions` 保持一致。
 */
export default [
  {
    key: 'menu.adminWorkspaceList',
    link: '/admin/workspaces',
    icon: 'mdi-domain',
    permission: Permission.WORKSPACE_READ,
  },
  {
    key: 'menu.adminMembers',
    link: '/admin/members',
    icon: 'mdi-account-group',
    permission: Permission.MEMBER_READ,
  },
  {
    key: 'menu.adminMembershipPlans',
    link: '/admin/membership-plans',
    icon: 'mdi-package-variant',
    permission: Permission.MEMBERSHIP_PLAN_READ,
  },
  {
    key: 'menu.adminSystemConfig',
    link: '/admin/system-config',
    icon: 'mdi-cog',
    permission: Permission.SYSTEM_CONFIG_READ,
  },
  {
    key: 'menu.adminPersonas',
    link: '/admin/personas',
    icon: 'mdi-account',
    permission: Permission.PERSONA_MANAGE,
  },
  {
    key: 'menu.workflows',
    link: '/admin/workflows',
    icon: 'mdi-clipboard-list-outline',
    permission: Permission.WORKFLOW_MANAGE,
  },
  {
    key: 'menu.adminToolbox',
    link: '/admin/toolbox',
    icon: 'mdi-toolbox',
    permission: Permission.ADMIN_ACCESS,
  },
  {
    key: 'menu.adminDataReport',
    link: '/admin/data-report',
    icon: 'mdi-chart-line',
    permission: Permission.DATA_REPORT_READ,
  },
];
