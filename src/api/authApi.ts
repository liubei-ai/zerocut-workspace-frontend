import { type User } from '../types/api';
import apiClient from './client';

export async function syncUserProfile(user: User) {
  return apiClient.post('/auth/sync', user);
}
