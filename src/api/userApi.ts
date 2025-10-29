import type { UserInfoDto } from '../types/api';
import client from './api2client';

/**
 * 获取当前用户信息
 * @returns 用户信息
 */
export async function getCurrentUserInfo(): Promise<UserInfoDto> {
  const response = await client.get('/user/profile');
  return response.data;
}
