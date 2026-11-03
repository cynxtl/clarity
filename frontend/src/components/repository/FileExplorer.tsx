import React, { useState } from 'react';
import {
  FileText,
  FileCode,
  Image,
  Search,
  File,
  FolderTree
} from 'lucide-react';
import { DocumentFile } from '../../types';

interface FileExplorerProps {
  files: DocumentFile[];
  selectedFilePath: string | null;
  onSelectFile: (file: DocumentFile) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFilePath,
  onSelectFile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = files.filter(f =>
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case '.md':
      case '.markdown':
      case '.mdx':
        return <FileText className="w-4 h-4 text-[var(--primary)] shrink-0" />;
      case '.json':
      case '.yaml':
      case '.yml':
        return <FileCode className="w-4 h-4 text-[var(--warning)] shrink-0" />;
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.svg':
      case '.webp':
        return <Image className="w-4 h-4 text-[var(--teal)] shrink-0" />;
      default:
        return <File className="w-4 h-4 text-[var(--foreground-muted)] shrink-0" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xs">
      {/* Header and Filter */}
      <div className="p-3.5 border-b border-[var(--border)] bg-[var(--surface-2)]/50 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-bold text-[var(--foreground)] tracking-tight">
              Repository Tree
            </span>
          </div>
          <span className="text-[11px] font-mono text-[var(--foreground-muted)] bg-[var(--surface-1)] px-2 py-0.5 rounded-md border border-[var(--border)]">
            {files.length} items
          </span>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--foreground-dim)] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter files by name or path..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--surface-1)] border border-[var(--border)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--foreground-dim)] focus:outline-none focus:border-[var(--primary)] shadow-2xs"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]/40 p-1.5">
        {filteredFiles.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--foreground-muted)]">
            No documentation files match the current query.
          </div>
        ) : (
          filteredFiles.map(file => {
            const isSelected = selectedFilePath === file.path;
            const parts = file.path.split('/');
            const indentLevel = Math.max(0, parts.length - 1);

            return (
              <button
                key={file.id}
                onClick={() => onSelectFile(file)}
                style={{ paddingLeft: `${8 + indentLevel * 12}px` }}
                className={`w-full flex items-center justify-between py-2 pr-3 text-left rounded-lg text-xs transition-colors duration-100 cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--surface-3)] text-[var(--foreground)] font-bold shadow-2xs'
                    : 'hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {getFileIcon(file.extension)}
                  <span className="truncate font-mono text-[11px]">{file.path}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono text-[var(--foreground-dim)]">
                  {file.line_count > 0 && <span>{file.line_count}L</span>}
                  <span>{formatBytes(file.size_bytes)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
