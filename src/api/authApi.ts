import { type SyncedUser } from '../types/api';
import apiClient from './api2client';

export async function syncUserProfile(user) {
  return apiClient.post<SyncedUser>('/auth/sync', user);
}

export async function requestLogout() {
  return apiClient.post('/auth/logout');
}

export async function validateToken() {
  return apiClient.get<User>('/auth/me');
}
