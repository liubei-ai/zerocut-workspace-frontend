import { type SyncedUser } from '../types/api';
import apiClient from './api2client';

export async function syncAuthingToken(token: string) {
  return apiClient.post<SyncedUser>('/auth/sync', { token });
}

export async function requestAuthingLogout() {
  return apiClient.post('/auth/logout');
}

export async function syncAuth0Token(token: string) {
  return apiClient.post<SyncedUser>('/auth0/sync', { token });
}

export async function requestAuth0Logout() {
  return apiClient.post('/auth0/logout');
}

export async function validateToken() {
  return apiClient.get<User>('/auth/me');
}
