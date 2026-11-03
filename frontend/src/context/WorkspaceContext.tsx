import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Workspace } from '../types';
import { api } from '../services/api';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  error: string | null;
  selectWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  seedSampleWorkspace: () => Promise<Workspace>;
  importZip: (file: File) => Promise<{ status: string; extracted_files_count: number }>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.listWorkspaces();
      setWorkspaces(list);

      // Preserve currently selected workspace or prefer sample workspace
      if (list.length > 0) {
        setCurrentWorkspace(prev => {
          const urlWs = new URLSearchParams(window.location.search).get('workspace');
          if (urlWs) {
            const bySlugOrId = list.find(w => w.id === urlWs || w.slug === urlWs);
            if (bySlugOrId) return bySlugOrId;
          }
          if (!prev) {
            const sample = list.find(w => w.is_sample === 1);
            return sample || list[0];
          }
          const found = list.find(w => w.id === prev.id);
          return found || list[0];
        });
      } else {
        setCurrentWorkspace(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workspaces');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const selectWorkspace = (ws: Workspace) => {
    setCurrentWorkspace(ws);
  };

  const createWorkspace = async (name: string, description?: string): Promise<Workspace> => {
    const ws = await api.createWorkspace(name, description);
    await refreshWorkspaces();
    setCurrentWorkspace(ws);
    return ws;
  };

  const seedSampleWorkspace = async (): Promise<Workspace> => {
    const ws = await api.seedSampleWorkspace();
    await refreshWorkspaces();
    setCurrentWorkspace(ws);
    return ws;
  };

  const importZip = async (file: File) => {
    if (!currentWorkspace) throw new Error('No active workspace selected');
    const result = await api.importZip(currentWorkspace.id, file);
    await refreshWorkspaces();
    return result;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        loading,
        error,
        selectWorkspace,
        refreshWorkspaces,
        createWorkspace,
        seedSampleWorkspace,
        importZip,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
};
