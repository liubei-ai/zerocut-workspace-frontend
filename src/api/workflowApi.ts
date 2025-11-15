import client from './api2client';

export async function listWorkflowRecords(
  workspaceId: string,
  params?: { status?: string; page?: number; pageSize?: number; q?: string }
) {
  const response = await client.get(`/workspaces/${workspaceId}/workflows/records`, { params });
  return response.data;
}

export async function getWorkflowRecord(
  workspaceId: string,
  workflowId: string,
  executeId: string
) {
  const response = await client.get(
    `/workspaces/${workspaceId}/workflows/records/${workflowId}/${executeId}`
  );
  return response.data;
}

export async function saveWorkflowTrace(
  workspaceId: string,
  payload: {
    workflowId: string;
    executeId: string;
    debugUrl?: string;
    status?: string;
    startedAt?: string;
    endedAt?: string;
    source?: string;
    extra?: any;
  }
) {
  const response = await client.post(`/workspaces/${workspaceId}/workflows/trace`, payload);
  return response.data;
}

export async function updateWorkflowTrace(
  workspaceId: string,
  workflowId: string,
  executeId: string,
  payload: Partial<{
    debugUrl: string;
    status: string;
    startedAt: string;
    endedAt: string;
    source: string;
    extra: any;
  }>
) {
  const response = await client.put(
    `/workspaces/${workspaceId}/workflows/trace/${workflowId}/${executeId}`,
    payload
  );
  return response.data;
}
