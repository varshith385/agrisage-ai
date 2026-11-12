import { apiRequest } from './client';
import { AgentRunItem, AgentRunRequest, OrchestratorRunResult } from '../types/api';

export const agentsApi = {
  triggerRun: async (payload: AgentRunRequest): Promise<OrchestratorRunResult> => {
    return apiRequest<OrchestratorRunResult>('/api/v1/agents/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listRuns: async (params?: {
    farm_id?: number;
    agent_name?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AgentRunItem[]> => {
    const searchParams = new URLSearchParams();
    if (params?.farm_id !== undefined) searchParams.append('farm_id', params.farm_id.toString());
    if (params?.agent_name) searchParams.append('agent_name', params.agent_name);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());

    const qs = searchParams.toString();
    const endpoint = `/api/v1/agents/runs${qs ? `?${qs}` : ''}`;
    return apiRequest<AgentRunItem[]>(endpoint);
  },

  getRunDetail: async (runIdentifier: string): Promise<AgentRunItem[]> => {
    return apiRequest<AgentRunItem[]>(`/api/v1/agents/runs/${encodeURIComponent(runIdentifier)}`);
  },
};
