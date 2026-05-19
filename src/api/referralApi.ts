import apiClient from './api2client';

export type ReferralChannelPlatform = 'wechat' | 'xhs' | 'bilibili' | 'douyin' | 'other';

export interface ReferralChannel {
  id: number;
  name: string;
  platform: ReferralChannelPlatform;
  contact?: string;
  note?: string;
  attributionWindowDays: number;
  ownerUserId?: number | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralChannelWithStats extends ReferralChannel {
  inviteCodeCount: number;
  registeredUsers: number;
  paidUsers: number;
  gmvCents: number;
}

export interface ReferralInviteCode {
  id: number;
  code: string;
  channelId: number;
  remark?: string;
  enabled: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralInviteCodeWithStats extends ReferralInviteCode {
  registeredUsers: number;
  gmvCents: number;
}

export interface ReferralChannelDetail {
  channel: ReferralChannel;
  inviteCodes: ReferralInviteCodeWithStats[];
}

export interface ReferralChannelUserRow {
  userId: number;
  userPhone?: string;
  userEmail?: string;
  userName?: string;
  inviteCodeId: number;
  inviteCode: string;
  registeredAt: string;
  landingHost?: string;
  firstSeenAt?: string;
  rechargeCents: number;
  subscriptionCents: number;
  giveCents: number;
  gmvCents: number;
}

export interface ReferralChannelUsersResponse {
  total: number;
  page: number;
  limit: number;
  list: ReferralChannelUserRow[];
}

export interface CreateChannelPayload {
  name: string;
  platform: ReferralChannelPlatform;
  contact?: string;
  note?: string;
  attributionWindowDays: number;
  ownerUserId?: number;
}

export type UpdateChannelPayload = Partial<CreateChannelPayload>;

export interface CreateInviteCodePayload {
  remark?: string;
  expiresAt?: string;
  enabled?: boolean;
  code?: string;
}

export interface UpdateInviteCodePayload {
  remark?: string;
  expiresAt?: string | null;
  enabled?: boolean;
}

export async function listReferralChannels(): Promise<ReferralChannelWithStats[]> {
  const response = await apiClient.get<ReferralChannelWithStats[]>('/admin/referral/channels');
  return response.data;
}

export async function getReferralChannelDetail(id: number): Promise<ReferralChannelDetail> {
  const response = await apiClient.get<ReferralChannelDetail>(`/admin/referral/channels/${id}`);
  return response.data;
}

export async function createReferralChannel(
  payload: CreateChannelPayload
): Promise<ReferralChannel> {
  const response = await apiClient.post<ReferralChannel>('/admin/referral/channels', payload);
  return response.data;
}

export async function updateReferralChannel(
  id: number,
  payload: UpdateChannelPayload
): Promise<ReferralChannel> {
  const response = await apiClient.patch<ReferralChannel>(
    `/admin/referral/channels/${id}`,
    payload
  );
  return response.data;
}

export async function createInviteCode(
  channelId: number,
  payload: CreateInviteCodePayload
): Promise<ReferralInviteCode> {
  const response = await apiClient.post<ReferralInviteCode>(
    `/admin/referral/channels/${channelId}/invite-codes`,
    payload
  );
  return response.data;
}

export async function updateInviteCode(
  id: number,
  payload: UpdateInviteCodePayload
): Promise<ReferralInviteCode> {
  const response = await apiClient.patch<ReferralInviteCode>(
    `/admin/referral/invite-codes/${id}`,
    payload
  );
  return response.data;
}

export async function deleteInviteCode(id: number): Promise<void> {
  await apiClient.delete(`/admin/referral/invite-codes/${id}`);
}

export async function listChannelUsers(
  channelId: number,
  params: { page?: number; limit?: number; inviteCodeId?: number; paidOnly?: 'true' | 'false' } = {}
): Promise<ReferralChannelUsersResponse> {
  const response = await apiClient.get<ReferralChannelUsersResponse>(
    `/admin/referral/channels/${channelId}/users`,
    { params }
  );
  return response.data;
}
