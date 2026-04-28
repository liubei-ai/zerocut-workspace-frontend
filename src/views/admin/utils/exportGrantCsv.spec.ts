import { describe, expect, it } from 'vite-plus/test';

import type { GrantResult, LookupResult } from '@/api/memberAdminApi';

import { buildGrantResultCsv } from './exportGrantCsv';

const fixtureGrant: GrantResult = {
  batchId: 42,
  summary: { total: 3, success: 2, skipped: 1, failed: 0 },
  results: [
    {
      workspaceId: 'wks_aaaaaaaaaaaa01',
      phone: '13800000001',
      status: 'success',
      subscriptionId: 101,
      orderId: 201,
      orderNo: 'SUB_STANDARD_x_001',
      creditsGranted: 8000,
      currentCredits: 8000,
    },
    {
      workspaceId: 'wks_aaaaaaaaaaaa02',
      phone: '13800000002',
      status: 'success',
      subscriptionId: 102,
      orderId: 202,
      orderNo: 'SUB_STANDARD_x_002',
      creditsGranted: 8000,
      currentCredits: 12000,
    },
    {
      workspaceId: 'wks_aaaaaaaaaaaa03',
      phone: '13800000003',
      status: 'skipped',
      failureReason: '已有有效订阅 STANDARD_AUTO_MONTHLY 至 2026-05-30',
    },
  ],
};

const fixtureLookup: LookupResult = {
  summary: { total: 3, found: 3, notFound: 0 },
  results: [
    {
      phone: '13800000001',
      found: true,
      user: { userId: 1, name: '张三', registeredAt: '2024-01-01' },
      workspaces: [{ workspaceId: 'wks_aaaaaaaaaaaa01', name: '张三的空间', isDefault: true }],
    },
    {
      phone: '13800000002',
      found: true,
      user: { userId: 2, name: '李"四"', registeredAt: '2024-02-01' },
      workspaces: [{ workspaceId: 'wks_aaaaaaaaaaaa02', name: '李四的空间', isDefault: true }],
    },
    {
      phone: '13800000003',
      found: true,
      user: { userId: 3, name: '王五', registeredAt: '2024-03-01' },
      workspaces: [{ workspaceId: 'wks_aaaaaaaaaaaa03', name: '王五的空间', isDefault: true }],
    },
  ],
};

describe('buildGrantResultCsv', () => {
  it('starts with UTF-8 BOM for Excel compatibility', () => {
    const csv = buildGrantResultCsv(fixtureGrant);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('emits header row + one row per result, in declared column order', () => {
    const csv = buildGrantResultCsv(fixtureGrant);
    const lines = csv.replace(/^﻿/, '').split('\r\n').filter(Boolean);
    expect(lines).toHaveLength(1 + fixtureGrant.results.length);
    expect(lines[0]).toBe(
      [
        '"手机号"',
        '"用户姓名"',
        '"Workspace 名称"',
        '"Workspace ID"',
        '"状态"',
        '"订单号"',
        '"发放积分"',
        '"操作后总积分"',
        '"失败/跳过原因"',
      ].join(',')
    );
  });

  it('translates status to Chinese label', () => {
    const csv = buildGrantResultCsv(fixtureGrant);
    expect(csv).toContain('"成功"');
    expect(csv).toContain('"跳过"');
  });

  it('joins user/workspace names from lookup context when provided', () => {
    const csv = buildGrantResultCsv(fixtureGrant, { lookupItems: fixtureLookup.results });
    // 第一行：13800000001 / 张三 / 张三的空间
    const lines = csv.replace(/^﻿/, '').split('\r\n');
    const dataRow = lines[1];
    expect(dataRow).toContain('"13800000001"');
    expect(dataRow).toContain('"张三"');
    expect(dataRow).toContain('"张三的空间"');
  });

  it('escapes embedded double quotes by doubling them', () => {
    const csv = buildGrantResultCsv(fixtureGrant, { lookupItems: fixtureLookup.results });
    // user.name 是 `李"四"`，应该出现 `"李""四"""`
    expect(csv).toContain('"李""四"""');
  });

  it('outputs empty cells (not undefined) when fields are missing', () => {
    const csv = buildGrantResultCsv(fixtureGrant);
    // skipped 行没有 orderNo / creditsGranted / currentCredits → 应输出 ""
    const lines = csv.replace(/^﻿/, '').split('\r\n');
    const skippedLine = lines.find(l => l.includes('13800000003'))!;
    // 检查没有出现 undefined / null 字面量
    expect(skippedLine).not.toContain('undefined');
    expect(skippedLine).not.toContain('null');
  });
});
