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
    ],
  },
];

export default AdminRoutes;
