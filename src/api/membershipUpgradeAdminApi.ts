import type {
  UpgradeAdminList,
  UpgradeAdminUpgradeDetail,
  UpgradeAdminAction,
} from './membershipUpgradeApi';

import client from './api2client';
const base = '/admin/subscription-upgrades';
export const membershipUpgradeAdminApi = {
  async list(
    params: {
      cursor?: string;
      limit?: number;
      state?: string;
      accountId?: string;
      hasUnresolvedIssue?: string;
    } = {}
  ) {
    return (await client.get<UpgradeAdminList>(base, { params })).data;
  },
  async detail(id: string, auditCursor?: string) {
    return (
      await client.get<UpgradeAdminUpgradeDetail>(`${base}/${encodeURIComponent(id)}`, {
        params: { auditCursor },
      })
    ).data;
  },
  async action(id: string, body: UpgradeAdminAction, key: string) {
    return (
      await client.post<UpgradeAdminUpgradeDetail>(
        `${base}/${encodeURIComponent(id)}/actions`,
        body,
        { headers: { 'Idempotency-Key': key } }
      )
    ).data;
  },
};
