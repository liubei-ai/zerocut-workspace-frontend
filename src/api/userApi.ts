import type { ApiResponse, HomepageResponseDto, UserProfile } from '../types/api';
import client from './api2Client';

/**
 * 获取用户档案信息
 * @param userId 用户ID
 * @returns 用户档案信息
 */
export async function getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
  const response = await client.get(`/api/user-profile/${userId}`);
  return response.data;
}

/**
 * 更新用户档案信息
 * @param userId 用户ID
 * @param profileData 用户档案数据
 * @returns 更新结果
 */
export async function updateUserProfile(
  userId: string,
  profileData: Partial<UserProfile>
): Promise<ApiResponse<UserProfile>> {
  const response = await client.patch(`/api/user-profile/${userId}`, profileData);
  return response.data;
}

/**
 * 获取当前用户档案信息
 * @returns 当前用户档案信息
 */
export async function getCurrentUserProfile(): Promise<ApiResponse<UserProfile>> {
  const response = await client.get('/api/user-profile');
  return response.data;
}

/**
 * 更新当前用户档案信息
 * @param profileData 用户档案数据
 * @returns 更新结果
 */
export async function updateCurrentUserProfile(
  profileData: Partial<UserProfile>
): Promise<ApiResponse<UserProfile>> {
  const response = await client.patch('/api/user-profile', profileData);
  return response.data;
}

/**
 * 删除用户账户
 * @param userId 用户ID
 * @returns 删除结果
 */
export async function deleteUser(userId: string) {
  const response = await client.delete(`/api/user-profile/${userId}`);
  return response.data;
}

/**
 * 获取用户主页数据（包含工作空间列表）
 * @returns 主页数据
 */
export async function getHomepageData(): Promise<HomepageResponseDto> {
  const response = await client.get('/homepage');
  return response.data;
}

/**
 * 获取用户列表（管理员功能）
 * @param params 查询参数
 * @returns 用户列表
 */
export async function getUserList(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}): Promise<{ users: UserProfile[]; total: number }> {
  const response = await client.get('/api/users', { params });
  return response.data;
}

/**
 * 更新用户状态（管理员功能）
 * @param userId 用户ID
 * @param status 用户状态
 * @returns 更新结果
 */
export async function updateUserStatus(
  userId: string,
  status: 'active' | 'inactive' | 'suspended'
): Promise<UserProfile> {
  const response = await client.patch(`/api/users/${userId}/status`, { status });
  return response.data;
}

/**
 * 重置用户密码（管理员功能）
 * @param userId 用户ID
 * @returns 重置结果
 */
export async function resetUserPassword(userId: string): Promise<{ temporaryPassword: string }> {
  const response = await client.post(`/api/users/${userId}/reset-password`);
  return response.data;
}
