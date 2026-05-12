/**
 * 系统级权限点（claims-based authorization）。
 *
 * ⚠️ 必须与 server/src/common/authz/permission.enum.ts 字符串值保持完全一致。
 *     新增 / 重命名 / 删除时同步两份；CI 在仓库根运行 `pnpm check:perms` 防漂移。
 */
export const Permission = {
  // 后台总开关
  ADMIN_ACCESS: 'admin.access',

  // 系统配置
  SYSTEM_CONFIG_READ: 'system_config.read',
  SYSTEM_CONFIG_WRITE: 'system_config.write',
  SYSTEM_CONFIG_AUDIT_READ: 'system_config.audit.read',
  AUDIT_LOG_READ: 'audit_log.read',

  // 工作空间
  WORKSPACE_READ: 'workspace.read',
  WORKSPACE_WRITE: 'workspace.write',
  WORKSPACE_DELETE: 'workspace.delete',
  WORKSPACE_CROSS_ACCESS: 'workspace.cross_access',

  // 成员
  MEMBER_READ: 'member.read',
  MEMBER_LOOKUP: 'member.lookup',
  MEMBER_DETAIL_READ: 'member.detail.read',
  MEMBER_WRITE: 'member.write',
  USER_ROLE_ASSIGN: 'user.role.assign',

  // 钱包/积分
  WALLET_READ: 'wallet.read',
  WALLET_GRANT: 'wallet.grant',
  WALLET_RECHARGE_RECORDS_READ: 'wallet.recharge_records.read',
  CREDIT_STATS_READ: 'credit_stats.read',

  // 套餐/订单
  MEMBERSHIP_PLAN_READ: 'membership_plan.read',
  MEMBERSHIP_PLAN_WRITE: 'membership_plan.write',
  ORDER_READ: 'order.read',
  TEST_PACKAGE_PURCHASE: 'test_package.purchase',

  // 资源（admin 视角）
  WORKFLOW_MANAGE: 'workflow.manage',
  PERSONA_MANAGE: 'persona.manage',
  BOT_CREATE: 'bot.create',
  RESOURCE_CROSS_ACCESS: 'resource.cross_access',

  // 报表
  DATA_REPORT_READ: 'data_report.read',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
