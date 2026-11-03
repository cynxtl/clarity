import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useWorkspace } from '../../context/WorkspaceContext';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createWorkspace(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onClose();
      if (onCreated) onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Documentation Workspace"
      description="Workspaces isolate markdown repositories, validation history, and custom glossary configurations."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Workspace Name"
          placeholder="e.g. Nexus Cloud Docs"
          value={name}
          onChange={e => setName(e.target.value)}
          error={error || undefined}
          autoFocus
        />

        <div>
          <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
            Description (Optional)
          </label>
          <textarea
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] placeholder-[var(--foreground-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] resize-none h-20 transition-all duration-150"
            placeholder="Brief purpose of this technical documentation repository..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};
