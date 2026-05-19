import { type SyncedUser } from '../types/api';
import { getStoredRef } from '../utils/referralTracker';
import apiClient from './api2client';

function buildAttributionPayload(extra?: Record<string, unknown>) {
  const ref = getStoredRef();
  if (!ref) return extra;
  return {
    ...extra,
    refCode: ref.code,
    refSeenAt: ref.seenAt,
    refLandingHost: ref.landingHost,
  };
}

export async function syncAuthingToken(token: string, wechatIdentities) {
  return apiClient.post<SyncedUser>('/auth/sync', buildAttributionPayload(wechatIdentities), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function requestAuthingLogout() {
  return apiClient.post('/auth/logout');
}

export async function syncAuth0Token(token: string) {
  return apiClient.post<SyncedUser>('/auth0/sync', buildAttributionPayload(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function requestAuth0Logout() {
  return apiClient.post('/auth0/logout');
}

export async function validateToken() {
  return apiClient.get<User>('/auth/me');
}
