import {
  Workspace,
  DocumentFile,
  FileContent,
  Scan,
  ScanIssue,
  RuleDefinition,
  DashboardMetrics,
  ScanRunOptions
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Workspaces
  async listWorkspaces(): Promise<Workspace[]> {
    return request<Workspace[]>('/workspaces');
  },

  async createWorkspace(name: string, description?: string): Promise<Workspace> {
    return request<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  async seedSampleWorkspace(): Promise<Workspace> {
    return request<Workspace>('/workspaces/seed-sample', {
      method: 'POST',
    });
  },

  async getWorkspace(id: string): Promise<Workspace> {
    return request<Workspace>(`/workspaces/${id}`);
  },

  async importZip(workspaceId: string, file: File): Promise<{ status: string; extracted_files_count: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ status: string; extracted_files_count: number }>(`/workspaces/${workspaceId}/import-zip`, {
      method: 'POST',
      body: formData,
    });
  },

  // Files
  async listFiles(workspaceId: string): Promise<DocumentFile[]> {
    return request<DocumentFile[]>(`/workspaces/${workspaceId}/files`);
  },

  async getFileContent(workspaceId: string, path: string): Promise<FileContent> {
    return request<FileContent>(`/workspaces/${workspaceId}/files/content?path=${encodeURIComponent(path)}`);
  },

  async updateFileContent(workspaceId: string, path: string, content: string): Promise<FileContent> {
    return request<FileContent>(`/workspaces/${workspaceId}/files/content?path=${encodeURIComponent(path)}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  // Scans
  async triggerScan(workspaceId: string, options?: ScanRunOptions): Promise<Scan> {
    return request<Scan>(`/workspaces/${workspaceId}/scans`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },

  async listScans(workspaceId: string): Promise<Scan[]> {
    return request<Scan[]>(`/workspaces/${workspaceId}/scans`);
  },

  async getScan(scanId: string, filters?: { severity?: string; rule_id?: string; file_path?: string }): Promise<Scan> {
    const params = new URLSearchParams();
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.rule_id) params.append('rule_id', filters.rule_id);
    if (filters?.file_path) params.append('file_path', filters.file_path);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<Scan>(`/scans/${scanId}${queryString}`);
  },

  // Rules
  async listRules(): Promise<RuleDefinition[]> {
    return request<RuleDefinition[]>('/rules');
  },

  // Dashboard
  async getDashboardMetrics(workspaceId?: string): Promise<DashboardMetrics> {
    const q = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : '';
    return request<DashboardMetrics>(`/dashboard/metrics${q}`);
  },
};
