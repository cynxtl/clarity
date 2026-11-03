import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Check,
  Copy,
  Eye,
  Code2,
  Edit3
} from 'lucide-react';
import { FileContent } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface MarkdownViewerProps {
  file: FileContent | null;
  onSave?: (newContent: string) => Promise<void>;
  isLoading?: boolean;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  file,
  onSave,
  isLoading = false,
}) => {
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'edit'>('preview');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (file) {
      setContent(file.content);
      setActiveTab('preview');
    }
  }, [file]);

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl text-center text-xs text-[var(--foreground-muted)] shadow-2xs">
        <FileText className="w-10 h-10 text-[var(--foreground-dim)] mb-3" />
        <span className="font-bold text-sm text-[var(--foreground)]">No document selected</span>
        <span className="mt-1 text-xs">Select a markdown file from the repository tree to inspect or edit.</span>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!onSave) return;
    try {
      setIsSaving(true);
      await onSave(content);
      setActiveTab('preview');
    } finally {
      setIsSaving(false);
    }
  };

  // Simple, robust Markdown reader view
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];
    let codeBlockLang = '';

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = trimmed.replace('```', '').trim();
          codeBlockLines = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <div key={`code-${idx}`} className="my-3 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
              {codeBlockLang && (
                <div className="px-3.5 py-1.5 border-b border-[var(--border)] bg-[var(--surface-3)] text-[10px] font-mono font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                  {codeBlockLang}
                </div>
              )}
              <pre className="p-3.5 text-xs font-mono text-[var(--foreground)] overflow-x-auto leading-relaxed">
                {codeBlockLines.join('\n')}
              </pre>
            </div>
          );
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockLines.push(line);
        return;
      }

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight mt-5 mb-3 pb-2 border-b border-[var(--border)]">
            {trimmed.slice(2)}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight mt-5 mb-2">
            {trimmed.slice(3)}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-sm sm:text-base font-semibold text-[var(--foreground)] tracking-tight mt-4 mb-2">
            {trimmed.slice(4)}
          </h3>
        );
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote key={idx} className="my-3 pl-3.5 border-l-2 border-[var(--primary)] text-xs text-[var(--foreground-muted)] italic leading-relaxed">
            {trimmed.slice(2)}
          </blockquote>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={idx} className="text-xs text-[var(--foreground)] ml-5 list-disc leading-relaxed my-1">
            {trimmed.slice(2)}
          </li>
        );
      } else if (trimmed.startsWith('![')) {
        // Image match
        const match = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
        if (match) {
          elements.push(
            <div key={idx} className="my-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-center text-xs">
              <span className="font-mono text-[11px] text-[var(--foreground-muted)]">Image: {match[1] || '(no alt)'} ({match[2]})</span>
            </div>
          );
        }
      } else if (trimmed.length > 0) {
        elements.push(
          <p key={idx} className="text-xs text-[var(--foreground)] leading-relaxed my-2">
            {line}
          </p>
        );
      }
    });

    return elements;
  };

  const lines = content.split('\n');

  return (
    <div className="flex flex-col h-full bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xs">
      {/* File Header Bar */}
      <div className="p-3.5 border-b border-[var(--border)] bg-[var(--surface-2)]/50 flex flex-wrap items-center justify-between gap-3">
        {/* File Meta */}
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <span className="text-xs font-bold text-[var(--foreground)] truncate font-mono">
            {file.path}
          </span>
          <Badge size="xs" variant="neutral">
            {file.line_count} lines
          </Badge>
          <Badge size="xs" variant="neutral">
            {file.word_count} words
          </Badge>
        </div>

        {/* View Mode Tabs and Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mode Pill Toggle */}
          <div className="flex items-center bg-[var(--surface-1)] p-0.5 rounded-lg border border-[var(--border)]">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-[var(--surface-3)] text-[var(--foreground)] font-bold shadow-2xs'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('source')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                activeTab === 'source'
                  ? 'bg-[var(--surface-3)] text-[var(--foreground)] font-bold shadow-2xs'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Source</span>
            </button>
            {onSave && (
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-[var(--surface-3)] text-[var(--foreground)] font-bold shadow-2xs'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          <Button
            size="xs"
            variant="ghost"
            onClick={handleCopy}
            icon={copied ? <Check className="w-3 h-3 text-[var(--success)]" /> : <Copy className="w-3 h-3" />}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>

          {activeTab === 'edit' && onSave && (
            <Button
              size="xs"
              variant="primary"
              onClick={handleSave}
              loading={isSaving}
              icon={<Save className="w-3 h-3" />}
            >
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Viewer / Editor Body */}
      <div className="flex-1 overflow-auto bg-[var(--background)]">
        {activeTab === 'edit' ? (
          <div className="p-4 h-full">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full h-full bg-transparent text-[var(--foreground)] resize-none focus:outline-none font-mono text-xs leading-relaxed"
              spellCheck={false}
              placeholder="Edit Markdown documentation..."
            />
          </div>
        ) : activeTab === 'source' ? (
          <div className="p-4 font-mono text-xs space-y-0.5">
            {lines.map((line, idx) => (
              <div key={idx} className="flex hover:bg-[var(--surface-2)]/60 rounded px-1 group">
                <span className="w-10 shrink-0 text-right pr-4 text-[var(--foreground-dim)] select-none opacity-50 group-hover:opacity-100">
                  {idx + 1}
                </span>
                <span className="text-[var(--foreground)] whitespace-pre-wrap break-all flex-1 font-mono">
                  {line || ' '}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 sm:p-8 max-w-3xl mx-auto">
            {renderMarkdownPreview(content)}
          </div>
        )}
      </div>
    </div>
  );
};
