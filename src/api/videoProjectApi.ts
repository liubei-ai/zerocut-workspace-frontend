import type { ApiResponse, VideoProject } from '../types/api';
import client from './client';

/**
 * 获取视频项目列表
 * @param params 查询参数
 * @returns 视频项目列表
 */
export async function getVideoProjects(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<ApiResponse<{ projects: VideoProject[]; total: number }>> {
  const response = await client.get('/api/video-project', { params });
  return response.data;
}

/**
 * 获取视频项目详情
 * @param projectId 项目ID
 * @returns 视频项目详情
 */
export async function getVideoProject(projectId: number): Promise<ApiResponse<VideoProject>> {
  const response = await client.get(`/api/video-project/${projectId}`);
  return response.data;
}

/**
 * 创建视频项目
 * @param projectData 项目数据
 * @returns 创建的视频项目
 */
export async function createVideoProject(projectData: {
  title: string;
  description?: string;
  config?: any;
}): Promise<ApiResponse<VideoProject>> {
  const response = await client.post('/api/video-project', projectData);
  return response.data;
}

/**
 * 更新视频项目
 * @param projectId 项目ID
 * @param updateData 更新数据
 * @returns 更新的视频项目
 */
export async function updateVideoProject(
  projectId: number,
  updateData: Partial<VideoProject>
): Promise<ApiResponse<VideoProject>> {
  const response = await client.patch(`/api/video-project/${projectId}`, updateData);
  return response.data;
}

/**
 * 删除视频项目
 * @param projectId 项目ID
 * @returns 删除结果
 */
export async function deleteVideoProject(projectId: number): Promise<ApiResponse<void>> {
  const response = await client.delete(`/api/video-project/${projectId}`);
  return response.data;
}

/**
 * 复制视频项目
 * @param projectId 项目ID
 * @param newTitle 新项目标题
 * @returns 复制的视频项目
 */
export async function duplicateVideoProject(
  projectId: number,
  newTitle: string
): Promise<ApiResponse<VideoProject>> {
  const response = await client.post(`/api/video-project/${projectId}/duplicate`, {
    title: newTitle,
  });
  return response.data;
}

/**
 * 生成视频
 * @param params 生成参数
 * @returns 生成任务信息
 */
export async function generateVideo(params: {
  workspace?: string;
  prompt?: string;
  config?: any;
}): Promise<ApiResponse<{ taskId: string; status: string }>> {
  const response = await client.get('/generate', { params });
  return response.data;
}

/**
 * 获取视频生成状态
 * @param taskId 任务ID
 * @returns 生成状态
 */
export async function getGenerationStatus(taskId: string): Promise<
  ApiResponse<{
    taskId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: {
      videoUrl: string;
      thumbnailUrl?: string;
      duration?: number;
    };
    error?: string;
  }>
> {
  const response = await client.get(`/api/generation/status/${taskId}`);
  return response.data;
}

/**
 * 取消视频生成
 * @param taskId 任务ID
 * @returns 取消结果
 */
export async function cancelGeneration(taskId: string): Promise<ApiResponse<void>> {
  const response = await client.post(`/api/generation/cancel/${taskId}`);
  return response.data;
}

/**
 * 获取视频模板列表
 * @param params 查询参数
 * @returns 模板列表
 */
export async function getVideoTemplates(params?: {
  category?: string;
  tags?: string[];
  search?: string;
}): Promise<
  ApiResponse<
    Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      tags: string[];
      thumbnailUrl: string;
      config: any;
    }>
  >
> {
  const response = await client.get('/api/video-templates', { params });
  return response.data;
}

/**
 * 从模板创建项目
 * @param templateId 模板ID
 * @param projectData 项目数据
 * @returns 创建的项目
 */
export async function createProjectFromTemplate(
  templateId: string,
  projectData: {
    title: string;
    description?: string;
    customizations?: any;
  }
): Promise<ApiResponse<VideoProject>> {
  const response = await client.post(
    `/api/video-templates/${templateId}/create-project`,
    projectData
  );
  return response.data;
}

/**
 * 获取项目历史版本
 * @param projectId 项目ID
 * @returns 历史版本列表
 */
export async function getProjectVersions(projectId: number): Promise<
  ApiResponse<
    Array<{
      id: string;
      version: string;
      description: string;
      createdAt: string;
      config: any;
    }>
  >
> {
  const response = await client.get(`/api/video-project/${projectId}/versions`);
  return response.data;
}

/**
 * 恢复项目版本
 * @param projectId 项目ID
 * @param versionId 版本ID
 * @returns 恢复结果
 */
export async function restoreProjectVersion(
  projectId: number,
  versionId: string
): Promise<ApiResponse<VideoProject>> {
  const response = await client.post(
    `/api/video-project/${projectId}/versions/${versionId}/restore`
  );
  return response.data;
}
