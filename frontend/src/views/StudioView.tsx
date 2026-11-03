import React, { useState, useEffect } from 'react';
import {
  Save,
  Check,
  Bot,
  FileText,
  Clock,
  Eye,
  Columns,
  Code2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import { DocumentFile } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';

export const StudioView: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'editor' | 'split' | 'preview'>('split');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      api.listFiles(currentWorkspace.id).then(list => {
        const mdFiles = list.filter(f => f.extension.startsWith('.md'));
        setFiles(mdFiles);
        if (mdFiles.length > 0 && !selectedFile) {
          handleSelectFile(mdFiles[0]);
        }
      });
    }
  }, [currentWorkspace?.id]);

  const handleSelectFile = async (file: DocumentFile) => {
    setSelectedFile(file);
    if (!currentWorkspace) return;
    const data = await api.getFileContent(currentWorkspace.id, file.path);
    setContent(data.content);
    setSaveSuccess(false);
    setIsDirty(false);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!currentWorkspace || !selectedFile) return;
    try {
      setSaving(true);
      await api.updateFileContent(currentWorkspace.id, selectedFile.path, content);
      setSaveSuccess(true);
      setIsDirty(false);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  // Live real-time heuristics
  const lines = content.split('\n');
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const hasH1 = lines.some(l => l.trim().startsWith('# '));
  const codeBlocksWithoutLang = lines.filter(l => l.trim() === '```').length;
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const longParagraphs = paragraphs.filter(p => p.trim().split(/\s+/).length > 150).length;

  // Simple live Markdown rendering for preview
  const renderPreview = (text: string) => {
    const rawLines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    let inCode = false;
    let codeLines: string[] = [];
    let codeLang = '';

    rawLines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        if (!inCode) {
          inCode = true;
          codeLang = trimmed.replace('```', '').trim();
          codeLines = [];
        } else {
          inCode = false;
          nodes.push(
            <div key={`code-${idx}`} className="my-3 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
              {codeLang && (
                <div className="px-3.5 py-1.5 border-b border-[var(--border)] bg-[var(--surface-3)] text-[10px] font-mono font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                  {codeLang}
                </div>
              )}
              <pre className="p-3.5 text-xs font-mono text-[var(--foreground)] overflow-x-auto leading-relaxed">
                {codeLines.join('\n')}
              </pre>
            </div>
          );
        }
        return;
      }

      if (inCode) {
        codeLines.push(line);
        return;
      }

      if (trimmed.startsWith('# ')) {
        nodes.push(
          <h1 key={idx} className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight mt-5 mb-3 pb-2 border-b border-[var(--border)]">
            {trimmed.slice(2)}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        nodes.push(
          <h2 key={idx} className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight mt-5 mb-2">
            {trimmed.slice(3)}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        nodes.push(
          <h3 key={idx} className="text-sm sm:text-base font-semibold text-[var(--foreground)] tracking-tight mt-4 mb-2">
            {trimmed.slice(4)}
          </h3>
        );
      } else if (trimmed.startsWith('> ')) {
        nodes.push(
          <blockquote key={idx} className="my-3 pl-3.5 border-l-2 border-[var(--primary)] text-xs text-[var(--foreground-muted)] italic leading-relaxed">
            {trimmed.slice(2)}
          </blockquote>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        nodes.push(
          <li key={idx} className="text-xs text-[var(--foreground)] ml-5 list-disc leading-relaxed my-1">
            {trimmed.slice(2)}
          </li>
        );
      } else if (trimmed.length > 0) {
        nodes.push(
          <p key={idx} className="text-xs text-[var(--foreground)] leading-relaxed my-2">
            {line}
          </p>
        );
      }
    });

    return nodes;
  };

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col space-y-3.5">
      {/* Studio Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">
            Writing Studio
          </h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Technical writing canvas with live structural validation and editorial preview.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isDirty && (
            <span className="text-[11px] font-mono text-[var(--warning)] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--warning-bg)] border border-[var(--warning-border)] shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] animate-pulse" />
              Unsaved Changes
            </span>
          )}
          {saveSuccess && (
            <span className="text-xs text-[var(--success)] flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg bg-[var(--success-bg)] border border-[var(--success-border)] shadow-2xs">
              <Check className="w-3.5 h-3.5" /> Saved & Re-indexed
            </span>
          )}

          <Button
            size="sm"
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={!selectedFile || !isDirty}
            icon={<Save className="w-3.5 h-3.5" />}
          >
            Save Document
          </Button>
        </div>
      </div>

      {/* Main Studio Work Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Editor & Preview Pane (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xs">
          {/* File Picker & View Mode Bar */}
          <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-2)]/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <select
                value={selectedFile?.path || ''}
                onChange={e => {
                  const target = files.find(f => f.path === e.target.value);
                  if (target) handleSelectFile(target);
                }}
                className="bg-[var(--surface-1)] border border-[var(--border)] rounded-lg px-2.5 py-1 text-xs font-mono font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] shadow-2xs"
              >
                {files.map(f => (
                  <option key={f.id} value={f.path}>
                    {f.path}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[var(--surface-1)] p-0.5 rounded-lg border border-[var(--border)]">
                <button
                  onClick={() => setViewMode('editor')}
                  title="Editor Only"
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                    viewMode === 'editor'
                      ? 'bg-[var(--surface-3)] text-[var(--foreground)] font-bold shadow-2xs'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Editor</span>
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  title="Split View"
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                    viewMode === 'split'
                      ? 'bg-[var(--surface-3)] text-[var(--foreground)] font-bold shadow-2xs'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Split</span>
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  title="Preview Only"
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                    viewMode === 'preview'
                      ? 'bg-[var(--surface-3)] text-[var(--foreground)] font-bold shadow-2xs'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[var(--foreground-muted)] border-l border-[var(--border)] pl-2">
                <span>{words}w</span>
                <span>{lines.length}l</span>
              </div>
            </div>
          </div>

          {/* Editor & Preview Split Container */}
          <div className="flex-1 flex min-h-0 overflow-hidden divide-x divide-[var(--border)] bg-[var(--background)]">
            {/* Editor Area */}
            {(viewMode === 'editor' || viewMode === 'split') && (
              <div className="flex-1 h-full p-4 overflow-auto focus-within:ring-1 focus-within:ring-[var(--primary)]/30 transition-all">
                <textarea
                  value={content}
                  onChange={e => handleContentChange(e.target.value)}
                  className="w-full h-full bg-transparent text-[var(--foreground)] resize-none focus:outline-none font-mono text-xs leading-relaxed"
                  placeholder="Draft technical documentation..."
                  spellCheck={false}
                />
              </div>
            )}

            {/* Live Preview Area */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className="flex-1 h-full p-6 sm:p-8 overflow-auto bg-[var(--surface-1)]/50">
                <div className="max-w-2xl mx-auto">
                  {renderPreview(content)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Diagnostics & Roadmap Sidecar (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4 overflow-y-auto">
          {/* Real-Time Deterministic Quality Diagnostics */}
          <Card>
            <CardHeader
              title="Real-Time Lint Feedback"
              subtitle="Live heuristic evaluation of active document"
            />
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <span className="text-[var(--foreground)] font-medium">Top-level H1 Title</span>
                {hasH1 ? (
                  <Badge variant="success" size="xs">Present</Badge>
                ) : (
                  <Badge variant="error" size="xs">Missing H1</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <span className="text-[var(--foreground)] font-medium">Code Block Languages</span>
                {codeBlocksWithoutLang === 0 ? (
                  <Badge variant="success" size="xs">All tagged</Badge>
                ) : (
                  <Badge variant="warning" size="xs">{codeBlocksWithoutLang} untagged</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <span className="text-[var(--foreground)] font-medium">Dense Paragraphs (&gt;150w)</span>
                {longParagraphs === 0 ? (
                  <Badge variant="success" size="xs">None</Badge>
                ) : (
                  <Badge variant="warning" size="xs">{longParagraphs} found</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <span className="text-[var(--foreground)] font-medium">Estimated Reading Time</span>
                <span className="font-mono font-bold text-[var(--foreground)]">
                  {Math.max(1, Math.ceil(words / 200))} min
                </span>
              </div>
            </div>
          </Card>

          {/* AI-Assisted Roadmap (Clearly marked as future phase) */}
          <Card className="border-[var(--primary)]/20 bg-gradient-to-b from-[var(--surface-1)] to-[var(--surface-2)]/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="text-xs font-bold text-[var(--foreground)]">AI Assistant</h3>
              </div>
              <Badge variant="cobalt" size="xs">Phase 2 Roadmap</Badge>
            </div>
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed mb-3">
              Context-aware style rewriting, automated release-note generation, and side-by-side human review diffs are designed for future releases.
            </p>
            <div className="space-y-2 opacity-60 pointer-events-none">
              <div className="p-2 rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--foreground-muted)] flex items-center justify-between">
                <span>Side-by-side diff review</span>
                <span className="text-[10px] font-mono">Planned</span>
              </div>
              <div className="p-2 rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--foreground-muted)] flex items-center justify-between">
                <span>Release-note summarisation</span>
                <span className="text-[10px] font-mono">Planned</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
