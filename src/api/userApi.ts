import type { UserInfoDto, UserWorkspaceDto } from '../types/api';
import client from './api2client';

/**
 * 获取当前用户信息
 * @returns 用户信息
 */
export async function getCurrentUserInfo(): Promise<UserInfoDto> {
  const response = await client.get('/self/profile');
  return response.data;
}

/**
 * 获取用户的工作空间列表
 * @returns 工作空间列表
 */
export async function getWorkspaces(): Promise<UserWorkspaceDto[]> {
  const response = await client.get('/self/workspaces');
  return response.data;
}
