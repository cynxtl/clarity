import React, { useState, useEffect } from 'react';
import {
  Upload,
  Database,
  RefreshCw,
  AlertCircle,
  FolderGit2
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import { DocumentFile, FileContent } from '../types';
import { FileExplorer } from '../components/repository/FileExplorer';
import { MarkdownViewer } from '../components/repository/MarkdownViewer';
import { Button } from '../components/ui/Button';

interface RepositoriesViewProps {
  onOpenCreateWorkspace: () => void;
  onOpenImportZip: () => void;
}

export const RepositoriesView: React.FC<RepositoriesViewProps> = ({
  onOpenCreateWorkspace,
  onOpenImportZip,
}) => {
  const { currentWorkspace, seedSampleWorkspace } = useWorkspace();
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.listFiles(currentWorkspace.id);
      setFiles(data);
      if (data.length > 0 && !selectedFile) {
        const readme = data.find(f => f.filename.toLowerCase().includes('readme')) || data[0];
        handleSelectFile(readme);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to list repository files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentWorkspace?.id]);

  const handleSelectFile = async (file: DocumentFile) => {
    setSelectedFile(file);
    if (!currentWorkspace) return;
    try {
      setLoadingContent(true);
      const content = await api.getFileContent(currentWorkspace.id, file.path);
      setFileContent(content);
    } catch (err: any) {
      setError(err.message || 'Failed to read file content');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleSaveContent = async (newContent: string) => {
    if (!currentWorkspace || !selectedFile) return;
    const updated = await api.updateFileContent(currentWorkspace.id, selectedFile.path, newContent);
    setFileContent(updated);
    await fetchFiles();
  };

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">
            Repository File Explorer
          </h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Inspect document hierarchy, asset references, and edit markdown files directly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchFiles}
            loading={loading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenImportZip}
            disabled={!currentWorkspace}
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            Import ZIP
          </Button>

          {(!currentWorkspace || files.length === 0) && (
            <Button
              size="sm"
              variant="primary"
              onClick={seedSampleWorkspace}
              icon={<Database className="w-3.5 h-3.5" />}
            >
              Load Sample Repo
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger)] flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Split Pane: Explorer (4 Cols) + Viewer (8 Cols) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
        <div className="md:col-span-4 h-full min-h-0">
          <FileExplorer
            files={files}
            selectedFilePath={selectedFile?.path || null}
            onSelectFile={handleSelectFile}
          />
        </div>

        <div className="md:col-span-8 h-full min-h-0">
          <MarkdownViewer
            file={fileContent}
            onSave={handleSaveContent}
            isLoading={loadingContent}
          />
        </div>
      </div>
    </div>
  );
};
