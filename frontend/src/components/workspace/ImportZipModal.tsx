import React, { useState } from 'react';
import { Upload, FileArchive, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useWorkspace } from '../../context/WorkspaceContext';

interface ImportZipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export const ImportZipModal: React.FC<ImportZipModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const { currentWorkspace, importZip } = useWorkspace();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.zip')) {
        setError('Please select a valid .zip archive.');
        setFile(null);
        return;
      }
      setFile(selected);
      setError(null);
      setSuccessCount(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a ZIP file to import.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await importZip(file);
      setSuccessCount(res.extracted_files_count);
      setTimeout(() => {
        onClose();
        if (onImportComplete) onImportComplete();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to upload and extract ZIP file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Documentation Archive"
      description={`Extract markdown files and asset dependencies into "${currentWorkspace?.name || 'Workspace'}"`}
    >
      <div className="space-y-4">
        {/* Dropzone */}
        <label
          htmlFor="zip-upload"
          className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)]"
        >
          <input
            id="zip-upload"
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-3 shadow-xs">
            <Upload className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-[var(--foreground)]">
            {file ? file.name : 'Click to select or drag & drop a ZIP archive'}
          </span>
          <span className="text-[11px] text-[var(--foreground-muted)] mt-1">
            Accepts Markdown (.md, .markdown, .mdx), images (.png, .svg), and YAML/JSON configs
          </span>
        </label>

        {/* Selected file preview */}
        {file && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="flex items-center gap-2 min-w-0">
              <FileArchive className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span className="text-xs font-mono font-medium text-[var(--foreground)] truncate">
                {file.name}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[var(--foreground-muted)] shrink-0">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
        )}

        {/* Security sandbox note */}
        <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--foreground-muted)] flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[var(--success)] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[var(--foreground)] block">Secure Sandbox Extraction</span>
            <span className="leading-relaxed">
              Every archive is sanitized against path traversal (`../`), executable payloads (`.exe`, `.sh`), and decompressed zip bombs.
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs font-medium text-[var(--danger)] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {successCount !== null && (
          <div className="p-3 rounded-lg bg-[var(--success-bg)] border border-[var(--success-border)] text-xs font-medium text-[var(--success)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Successfully extracted and indexed {successCount} documentation files!</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!file}
            loading={loading}
          >
            Extract & Index
          </Button>
        </div>
      </div>
    </Modal>
  );
};
