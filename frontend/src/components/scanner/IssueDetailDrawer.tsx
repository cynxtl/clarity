import React, { useState } from 'react';
import { X, Check, Copy, ArrowRight, Code, FileText, Sparkles } from 'lucide-react';
import { ScanIssue } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface IssueDetailDrawerProps {
  issue: ScanIssue | null;
  onClose: () => void;
  onJumpToFile?: (filePath: string, line?: number | null) => void;
}

export const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({
  issue,
  onClose,
  onJumpToFile,
}) => {
  const [copied, setCopied] = useState(false);

  if (!issue) return null;

  const handleCopyFix = () => {
    if (issue.suggested_fix) {
      navigator.clipboard.writeText(issue.suggested_fix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] liquid-glass-drawer z-50 flex flex-col transition-all duration-200 animate-in slide-in-from-right-4">
      {/* Drawer Header */}
      <div className="p-5 border-b border-[var(--border)] flex items-start justify-between bg-[var(--surface-2)]/40">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={issue.severity} showIcon>
              {issue.severity.toUpperCase()}
            </Badge>
            <span className="text-[11px] font-mono font-bold text-[var(--foreground)] px-2 py-0.5 rounded bg-[var(--surface-3)]">
              {issue.rule_id}
            </span>
            <Badge variant="neutral" size="xs" className="capitalize">
              {issue.category}
            </Badge>
          </div>
          <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">{issue.rule_name}</h2>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] transition cursor-pointer"
          aria-label="Close detail drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* File & Line Location Card */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
          <span className="text-[10px] font-bold uppercase text-[var(--foreground-muted)] tracking-wider block">
            Target Location
          </span>
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[var(--foreground)] font-semibold truncate max-w-[300px]">
              {issue.file_path}
            </span>
            {issue.line_number && (
              <span className="text-[var(--primary)] font-mono font-bold">
                Line {issue.line_number}
              </span>
            )}
          </div>
          {onJumpToFile && (
            <div className="pt-1.5">
              <Button
                size="xs"
                variant="outline"
                onClick={() => onJumpToFile(issue.file_path, issue.line_number)}
                className="w-full text-xs font-semibold"
                icon={<FileText className="w-3.5 h-3.5" />}
              >
                Inspect in Repository Explorer
              </Button>
            </div>
          )}
        </div>

        {/* Explanation Message */}
        <div>
          <label className="text-xs font-bold text-[var(--foreground)] mb-1.5 block">
            Diagnostic Explanation
          </label>
          <div className="p-3.5 rounded-xl bg-[var(--surface-2)]/70 border border-[var(--border)] text-xs text-[var(--foreground)] leading-relaxed font-normal">
            {issue.message}
          </div>
        </div>

        {/* Code Snippet */}
        {issue.snippet && (
          <div>
            <label className="text-xs font-bold text-[var(--foreground)] mb-1.5 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-[var(--foreground-muted)]" /> Detected Snippet
            </label>
            <div className="p-3.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] font-mono text-xs text-[var(--foreground)] overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {issue.snippet}
            </div>
          </div>
        )}

        {/* Suggested Correction */}
        {issue.suggested_fix && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5" /> Suggested Correction
              </label>
              <Button
                size="xs"
                variant="ghost"
                onClick={handleCopyFix}
                icon={copied ? <Check className="w-3 h-3 text-[var(--success)]" /> : <Copy className="w-3 h-3" />}
              >
                {copied ? 'Copied' : 'Copy Fix'}
              </Button>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--primary-light)] border border-[var(--primary)]/30 text-xs text-[var(--foreground)] leading-relaxed font-medium">
              {issue.suggested_fix}
            </div>
          </div>
        )}

        {/* Issue ID Metadata */}
        <div className="pt-4 border-t border-[var(--border)] flex justify-between text-[11px] text-[var(--foreground-muted)]">
          <span>Diagnostic Finding ID</span>
          <span className="font-mono text-[10px] text-[var(--foreground-dim)]">{issue.id}</span>
        </div>
      </div>
    </div>
  );
};
