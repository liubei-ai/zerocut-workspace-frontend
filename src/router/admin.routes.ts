import type { RouteRecordRaw } from 'vue-router';

const AdminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    name: 'admin',
    redirect: '/admin/workspaces',
    meta: {
      layout: 'landing',
      requiresAuth: true,
      requiresSuperAdmin: true,
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
          requiresSuperAdmin: true,
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
          requiresSuperAdmin: true,
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
          requiresSuperAdmin: true,
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
          requiresSuperAdmin: true,
        },
      },
    ],
  },
];

export default AdminRoutes;
