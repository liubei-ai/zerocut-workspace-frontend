import moment from 'moment';

import type { GrantResult, GrantResultItem, LookupResultItem } from '@/api/memberAdminApi';

const CSV_BOM = '﻿';

const STATUS_LABEL: Record<GrantResultItem['status'], string> = {
  success: '成功',
  skipped: '跳过',
  failed: '失败',
};

/**
 * 把单元格值转义为 CSV 字段：
 * - 包裹双引号
 * - 内部双引号转义为 ""
 * - undefined / null 输出为带引号的空单元格 `""`
 */
function escapeCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

interface ExportContext {
  /** 用于把 workspaceId 反查到 workspace 名称、用户姓名（可选；缺失时留空） */
  lookupItems?: LookupResultItem[];
}

/**
 * 生成开通会员结果 CSV 文本（含 UTF-8 BOM，兼容 Excel）。
 *
 * 列序：手机号, 用户姓名, Workspace 名称, Workspace ID, 状态, 订单号, 发放积分, 操作后总积分, 失败/跳过原因
 */
export function buildGrantResultCsv(grantResult: GrantResult, ctx: ExportContext = {}): string {
  const header = [
    '手机号',
    '用户姓名',
    'Workspace 名称',
    'Workspace ID',
    '状态',
    '订单号',
    '发放积分',
    '操作后总积分',
    '失败/跳过原因',
  ];

  // 建立 phone+workspaceId → {userName, workspaceName} 的查找索引
  const lookupIndex = new Map<string, { userName?: string; workspaceName?: string }>();
  if (ctx.lookupItems) {
    for (const lk of ctx.lookupItems) {
      if (!lk.found || !lk.user || !lk.workspaces) continue;
      for (const ws of lk.workspaces) {
        lookupIndex.set(`${lk.phone}|${ws.workspaceId}`, {
          userName: lk.user.name,
          workspaceName: ws.name,
        });
      }
    }
  }

  const rows: string[] = [header.map(escapeCell).join(',')];

  for (const r of grantResult.results) {
    const meta = lookupIndex.get(`${r.phone}|${r.workspaceId}`) ?? {};
    rows.push(
      [
        r.phone,
        meta.userName ?? '',
        meta.workspaceName ?? '',
        r.workspaceId,
        STATUS_LABEL[r.status],
        r.orderNo ?? '',
        r.creditsGranted ?? '',
        r.currentCredits ?? '',
        r.failureReason ?? '',
      ]
        .map(escapeCell)
        .join(',')
    );
  }

  return CSV_BOM + rows.join('\r\n') + '\r\n';
}

/**
 * 触发浏览器下载该批次的结果 CSV。
 *
 * 文件名：`grant-result-${batchId}-YYYYMMDD-HHmm.csv`
 */
export function downloadGrantResultCsv(grantResult: GrantResult, ctx: ExportContext = {}): void {
  const csv = buildGrantResultCsv(grantResult, ctx);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const ts = moment().format('YYYYMMDD-HHmm');
  const filename = `grant-result-${grantResult.batchId}-${ts}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // link.click() 触发的下载在某些浏览器（Firefox/Safari）下是异步读取 blob 的，
  // 同步立即 revoke 可能让下载读到空内容；延迟一段时间再回收。
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
