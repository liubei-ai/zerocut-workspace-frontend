import type {
  PaginationResponse,
  ProjectOverviewItem,
  ProjectRecordsResponse,
  VideoWorkflowRecordItem,
  VideoWorkflowSource,
} from '@/types/api';

import client from './api2client';

export async function listVideoProjects(
  workspaceId: string,
  params: {
    source: VideoWorkflowSource;
    page?: number;
    limit?: number;
  }
): Promise<PaginationResponse<ProjectOverviewItem>> {
  const response = await client.get<PaginationResponse<ProjectOverviewItem>>(
    `/workspaces/${workspaceId}/video-projects`,
    { params }
  );
  return response.data;
}

export async function listVideoWorkflowRecords(
  workspaceId: string,
  params: {
    source: VideoWorkflowSource;
    page?: number;
    limit?: number;
  }
): Promise<PaginationResponse<VideoWorkflowRecordItem>> {
  const response = await client.get<PaginationResponse<VideoWorkflowRecordItem>>(
    `/workspaces/${workspaceId}/video-workflow-records`,
    { params }
  );
  return response.data;
}

export async function listVideoProjectRecords(
  workspaceId: string,
  projectId: number | string,
  params: {
    source: VideoWorkflowSource;
    page?: number;
    limit?: number;
  }
): Promise<ProjectRecordsResponse> {
  const response = await client.get<ProjectRecordsResponse>(
    `/workspaces/${workspaceId}/video-projects/${projectId}/records`,
    { params }
  );
  return response.data;
}
