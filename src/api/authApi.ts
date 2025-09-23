import { type User } from '../types/api';
import apiClient from './api2client';

export async function syncUserProfile(user) {
  return apiClient.post<User>('/auth/sync', user);
}

export async function requestLogout() {
  return apiClient.post('/auth/logout');
}

export async function validateToken() {
  return apiClient.get<User>('/auth/me');
}
