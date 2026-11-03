import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Check,
  FileText,
  Clock,
  Eye,
  Columns,
  Code2,
  Sparkles,
  BookOpen,
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import { DocumentFile, AIStatus, AIRevision } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { AIAssistantPanel } from '../components/studio/AIAssistantPanel';
import { AIReviewModal } from '../components/studio/AIReviewModal';

export const StudioView: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'editor' | 'split' | 'preview'>('split');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Selection tracking
  const [selectedText, setSelectedText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // AI Authoring State
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeRevision, setActiveRevision] = useState<AIRevision | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sidecarTab, setSidecarTab] = useState<'assistant' | 'diagnostics' | 'history'>('assistant');
  const [recentRevisions, setRecentRevisions] = useState<AIRevision[]>([]);

  // Fetch AI status
  useEffect(() => {
    api.getAIStatus().then(setAiStatus).catch(err => {
      console.warn('Failed to load AI status:', err);
    });
  }, []);

  // Fetch file list
  useEffect(() => {
    if (currentWorkspace) {
      api.listFiles(currentWorkspace.id).then(list => {
        const mdFiles = list.filter(f => f.extension.startsWith('.md'));
        setFiles(mdFiles);
        if (mdFiles.length > 0 && !selectedFile) {
          handleSelectFile(mdFiles[0]);
        }
      });
      loadRevisions();
    }
  }, [currentWorkspace?.id]);

  const loadRevisions = async () => {
    if (!currentWorkspace) return;
    try {
      const revs = await api.listRevisions(currentWorkspace.id);
      setRecentRevisions(revs);
      const pending = revs.find(r => r.status === 'pending');
      if (pending && !activeRevision) {
        setActiveRevision(pending);
      }
    } catch (err) {
      console.warn('Could not load revisions:', err);
    }
  };

  const handleSelectFile = async (file: DocumentFile) => {
    setSelectedFile(file);
    if (!currentWorkspace) return;
    const data = await api.getFileContent(currentWorkspace.id, file.path);
    setContent(data.content);
    setSaveSuccess(false);
    setIsDirty(false);
    setSelectedText('');
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

  const handleTextareaSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start !== end) {
      setSelectedText(el.value.substring(start, end));
    } else {
      setSelectedText('');
    }
  };

  // -------------------------------------------------------------
  // AI Operations Handlers
  // -------------------------------------------------------------
  const handleRunRewrite = async (params: { tone: string; custom_instruction: string; use_glossary: boolean }) => {
    if (!currentWorkspace || !selectedFile) return;
    try {
      setAiLoading(true);
      const targetText = selectedText || content;
      const rev = await api.rewriteText({
        workspace_id: currentWorkspace.id,
        file_path: selectedFile.path,
        document_title: selectedFile.filename,
        selected_text: targetText,
        full_content: content,
        tone: params.tone,
        custom_instruction: params.custom_instruction,
        use_glossary: params.use_glossary,
      });
      setActiveRevision(rev);
      setIsReviewOpen(true);
      loadRevisions();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'AI Rewrite failed.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunSimplify = async (params: { audience: string; custom_instruction: string; use_glossary: boolean }) => {
    if (!currentWorkspace || !selectedFile) return;
    try {
      setAiLoading(true);
      const targetText = selectedText || content;
      const rev = await api.simplifyText({
        workspace_id: currentWorkspace.id,
        file_path: selectedFile.path,
        selected_text: targetText,
        audience: params.audience,
        custom_instruction: params.custom_instruction,
        use_glossary: params.use_glossary,
      });
      setActiveRevision(rev);
      setIsReviewOpen(true);
      loadRevisions();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Simplification failed.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunProcedure = async (params: {
    task_description: string;
    prerequisites: string[];
    source_notes: string;
    expected_outcome: string;
    warnings: string[];
    tone: string;
    use_glossary: boolean;
  }) => {
    if (!currentWorkspace || !selectedFile) return;
    try {
      setAiLoading(true);
      const rev = await api.generateProcedure({
        workspace_id: currentWorkspace.id,
        file_path: selectedFile.path,
        task_description: params.task_description,
        prerequisites: params.prerequisites,
        source_notes: params.source_notes,
        expected_outcome: params.expected_outcome,
        warnings: params.warnings,
        tone: params.tone,
        use_glossary: params.use_glossary,
      });
      setActiveRevision(rev);
      setIsReviewOpen(true);
      loadRevisions();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Procedure generation failed.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunDocs = async (params: {
    doc_type: string;
    feature_brief: string;
    code_examples: string;
    technical_specs: string;
    tone: string;
    use_glossary: boolean;
  }) => {
    if (!currentWorkspace || !selectedFile) return;
    try {
      setAiLoading(true);
      const rev = await api.generateDocs({
        workspace_id: currentWorkspace.id,
        file_path: selectedFile.path,
        doc_type: params.doc_type,
        feature_brief: params.feature_brief,
        code_examples: params.code_examples,
        technical_specs: params.technical_specs,
        tone: params.tone,
        use_glossary: params.use_glossary,
      });
      setActiveRevision(rev);
      setIsReviewOpen(true);
      loadRevisions();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Documentation generation failed.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunReleaseNotes = async (params: {
    version: string;
    release_date: string;
    added: string[];
    changed: string[];
    fixed: string[];
    deprecated: string[];
    removed: string[];
    tone: string;
  }) => {
    if (!currentWorkspace || !selectedFile) return;
    try {
      setAiLoading(true);
      const rev = await api.generateReleaseNotes({
        workspace_id: currentWorkspace.id,
        file_path: selectedFile.path,
        version: params.version,
        release_date: params.release_date,
        added: params.added,
        changed: params.changed,
        fixed: params.fixed,
        deprecated: params.deprecated,
        removed: params.removed,
        tone: params.tone,
      });
      setActiveRevision(rev);
      setIsReviewOpen(true);
      loadRevisions();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Release notes generation failed.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptRevision = async (revisionId: string, force = false) => {
    try {
      setAccepting(true);
      const res = await api.acceptRevision(revisionId, content, force);
      setContent(res.updated_content);
      setIsDirty(false);
      setSaveSuccess(true);
      setActiveRevision(null);

      const delta = res.quality_impact.score_delta;
      const deltaMsg = delta >= 0 ? `+${delta}` : `${delta}`;
      setNotification({
        type: 'success',
        message: `Accepted! Quality score: ${res.quality_impact.score_after} (${deltaMsg} pts). File saved to disk.`,
      });
      loadRevisions();
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectRevision = async (revisionId: string) => {
    try {
      setRejecting(true);
      await api.rejectRevision(revisionId);
      setActiveRevision(null);
      setNotification({ type: 'success', message: 'Proposal rejected and archived.' });
      loadRevisions();
    } finally {
      setRejecting(false);
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
            Intelligent technical authoring canvas with AI assistance and deterministic validation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {notification && (
            <div className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              notification.type === 'success'
                ? 'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]'
                : 'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)]'
            }`}>
              {notification.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{notification.message}</span>
              <button onClick={() => setNotification(null)} className="ml-1 opacity-70 hover:opacity-100 cursor-pointer">
                ×
              </button>
            </div>
          )}

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
                className="bg-[var(--surface-1)] border border-[var(--border)] rounded-lg px-2.5 py-1 text-xs font-mono font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] shadow-2xs cursor-pointer"
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
                  ref={textareaRef}
                  value={content}
                  onChange={e => handleContentChange(e.target.value)}
                  onSelect={handleTextareaSelect}
                  onKeyUp={handleTextareaSelect}
                  onMouseUp={handleTextareaSelect}
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

        {/* Coordinated Sidecar Panel: AI Assistant, Real-Time Lint, History (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-3.5 overflow-y-auto">
          {/* Sidecar Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shrink-0">
            <button
              onClick={() => setSidecarTab('assistant')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                sidecarTab === 'assistant'
                  ? 'bg-[var(--surface-3)] text-[var(--foreground)] shadow-2xs'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>AI Assistant</span>
            </button>

            <button
              onClick={() => setSidecarTab('diagnostics')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                sidecarTab === 'diagnostics'
                  ? 'bg-[var(--surface-3)] text-[var(--foreground)] shadow-2xs'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--teal)]" />
              <span>Lint Heuristics</span>
            </button>

            <button
              onClick={() => setSidecarTab('history')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                sidecarTab === 'history'
                  ? 'bg-[var(--surface-3)] text-[var(--foreground)] shadow-2xs'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-[var(--warning)]" />
              <span>Revisions</span>
            </button>
          </div>

          {/* Tab 1: AI Assistant Panel */}
          {sidecarTab === 'assistant' && (
            <AIAssistantPanel
              status={aiStatus}
              selectedText={selectedText}
              hasDocument={Boolean(selectedFile)}
              onRunRewrite={handleRunRewrite}
              onRunSimplify={handleRunSimplify}
              onRunProcedure={handleRunProcedure}
              onRunDocs={handleRunDocs}
              onRunReleaseNotes={handleRunReleaseNotes}
              loading={aiLoading}
              activeRevision={activeRevision}
              onOpenReview={() => setIsReviewOpen(true)}
            />
          )}

          {/* Tab 2: Real-Time Deterministic Quality Diagnostics */}
          {sidecarTab === 'diagnostics' && (
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
          )}

          {/* Tab 3: Revisions History */}
          {sidecarTab === 'history' && (
            <Card>
              <CardHeader
                title="Revision History"
                subtitle="Proposals generated for this workspace"
              />
              {recentRevisions.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--foreground-muted)]">
                  No revisions recorded yet. Run an AI authoring operation to generate proposals.
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {recentRevisions.map(rev => (
                    <div
                      key={rev.id}
                      onClick={() => {
                        setActiveRevision(rev);
                        setIsReviewOpen(true);
                      }}
                      className="p-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] transition cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={rev.status === 'accepted' ? 'success' : rev.status === 'rejected' ? 'neutral' : 'cobalt'}
                            size="xs"
                          >
                            {rev.status}
                          </Badge>
                          <span className="font-bold text-[var(--foreground)] capitalize text-[11px]">
                            {rev.operation_type}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--foreground-muted)] truncate mt-0.5 font-mono">
                          {rev.file_path}
                        </p>
                      </div>

                      <div className="text-right text-[10px] text-[var(--foreground-dim)] font-mono shrink-0">
                        {new Date(rev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* AI Review Modal */}
      <AIReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        revision={activeRevision}
        onAccept={handleAcceptRevision}
        onReject={handleRejectRevision}
        accepting={accepting}
        rejecting={rejecting}
      />
    </div>
  );
};
