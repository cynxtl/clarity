import React, { useState } from 'react';
import {
  X,
  Check,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge, GradeBadge } from '../ui/Badge';
import { AIRevision, QualityImpactComparison } from '../../types';

interface AIReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  revision: AIRevision | null;
  onAccept: (revisionId: string, force?: boolean) => Promise<void>;
  onReject: (revisionId: string) => Promise<void>;
  accepting: boolean;
  rejecting: boolean;
}

export const AIReviewModal: React.FC<AIReviewModalProps> = ({
  isOpen,
  onClose,
  revision,
  onAccept,
  onReject,
  accepting,
  rejecting,
}) => {
  const [staleConflict, setStaleConflict] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !revision) return null;

  const handleAcceptClick = async (force = false) => {
    try {
      setErrorMessage(null);
      await onAccept(revision.id, force);
      setStaleConflict(false);
      onClose();
    } catch (err: any) {
      if (err.message && (err.message.includes('modified') || err.message.includes('409') || err.message.includes('conflict'))) {
        setStaleConflict(true);
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to apply revision.');
      }
    }
  };

  const handleRejectClick = async () => {
    try {
      setErrorMessage(null);
      await onReject(revision.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reject revision.');
    }
  };

  const impact: QualityImpactComparison | null = revision.quality_impact || null;

  // Simple line diff splitter for visual comparison
  const originalLines = revision.original_text.split('\n');
  const proposedLines = revision.proposed_text.split('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--surface-2)]/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--foreground)] tracking-tight">
                  Review AI Proposal
                </h2>
                <Badge variant="cobalt" size="xs" className="capitalize">
                  {revision.operation_type}
                </Badge>
              </div>
              <p className="text-xs text-[var(--foreground-muted)] truncate font-mono">
                {revision.file_path}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Stale Warning Conflict Banner */}
          {staleConflict && (
            <div className="p-4 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger)] space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Document Was Modified Since Proposal Was Created</span>
              </div>
              <p className="text-[var(--foreground-muted)] leading-relaxed">
                The underlying document on disk was edited after this AI proposal was drafted. Applying this revision now could overwrite recent manual changes.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="xs"
                  variant="danger"
                  onClick={() => handleAcceptClick(true)}
                  loading={accepting}
                >
                  Force Overwrite
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setStaleConflict(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && !staleConflict && (
            <div className="p-3 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Explanation & Quality Impact Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Explanation (7 Cols) */}
            <div className="md:col-span-7 bg-[var(--surface-2)]/60 border border-[var(--border)] rounded-xl p-4 space-y-2.5">
              <span className="text-xs font-bold text-[var(--foreground)] tracking-tight block">
                Editor Explanation & Rationale
              </span>
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                {revision.explanation}
              </p>

              {/* Warnings / Ambiguities */}
              {revision.warnings && revision.warnings.length > 0 && (
                <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
                  <span className="text-[11px] font-bold text-[var(--warning)] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Important Technical Flags
                  </span>
                  <ul className="space-y-1">
                    {revision.warnings.map((w, idx) => (
                      <li key={idx} className="text-[11px] text-[var(--foreground-muted)] list-disc ml-4">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meaning Changes */}
              {revision.meaning_changes && revision.meaning_changes.length > 0 && (
                <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
                  <span className="text-[11px] font-bold text-[var(--teal)] flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Semantic Nuances Adjusted
                  </span>
                  <ul className="space-y-1">
                    {revision.meaning_changes.map((m, idx) => (
                      <li key={idx} className="text-[11px] text-[var(--foreground-muted)] list-disc ml-4">
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Quality Impact Metric Card (5 Cols) */}
            <div className="md:col-span-5 bg-[var(--surface-2)]/60 border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--foreground)] tracking-tight block mb-2">
                  Deterministic Quality Impact
                </span>

                {impact ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--foreground-muted)]">Predicted Score</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--foreground-dim)] line-through">
                          {impact.score_before.toFixed(0)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--foreground-dim)]" />
                        <span className={`font-mono font-black text-sm ${
                          impact.score_delta >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                        }`}>
                          {impact.score_after.toFixed(0)}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          impact.score_delta >= 0 ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--danger-bg)] text-[var(--danger)]'
                        }`}>
                          {impact.score_delta >= 0 ? `+${impact.score_delta}` : impact.score_delta}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[var(--foreground-muted)]">Resolved Violations</span>
                      <Badge variant="teal" size="xs">
                        {impact.resolved_findings_count} resolved
                      </Badge>
                    </div>

                    {impact.new_findings_count > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--foreground-muted)]">New Findings</span>
                        <Badge variant="warning" size="xs">
                          {impact.new_findings_count} introduced
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-[var(--foreground-muted)]">
                    Quality evaluation pending acceptance.
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-[var(--border)] text-[10px] text-[var(--foreground-dim)] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" />
                <span>Evaluated across Clarity's 12 AST validation rules.</span>
              </div>
            </div>
          </div>

          {/* Visual Diff: Original vs Proposed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--foreground)]">
              <span>Text Comparison (Original vs Proposed)</span>
              <span className="text-[11px] text-[var(--foreground-muted)]">Review before accepting</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Original Panel */}
              <div className="border border-[var(--border)] rounded-xl bg-[var(--surface-2)]/40 overflow-hidden flex flex-col">
                <div className="p-2.5 border-b border-[var(--border)] bg-[var(--surface-3)]/60 text-[11px] font-bold text-[var(--foreground-muted)] flex items-center justify-between">
                  <span>Original Document Text</span>
                  <span className="font-mono text-[10px]">{originalLines.length} lines</span>
                </div>
                <pre className="p-3.5 text-xs font-mono text-[var(--foreground-muted)] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72 select-text bg-[var(--danger-bg)]/10">
                  {revision.original_text || '(Empty initial text / Full generation)'}
                </pre>
              </div>

              {/* Proposed Panel */}
              <div className="border border-[var(--primary)]/30 rounded-xl bg-[var(--surface-2)]/40 overflow-hidden flex flex-col">
                <div className="p-2.5 border-b border-[var(--primary)]/30 bg-[var(--primary-light)] text-[11px] font-bold text-[var(--primary)] flex items-center justify-between">
                  <span>Proposed Clarity Revision</span>
                  <span className="font-mono text-[10px]">{proposedLines.length} lines</span>
                </div>
                <pre className="p-3.5 text-xs font-mono text-[var(--foreground)] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72 select-text bg-[var(--success-bg)]/10">
                  {revision.proposed_text}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--surface-2)]/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[var(--foreground-muted)]">
            Accepting will apply the changes to the file and trigger deterministic re-indexing.
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectClick}
              loading={rejecting}
              disabled={accepting}
            >
              Reject Proposal
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAcceptClick(false)}
              loading={accepting}
              disabled={rejecting}
              icon={<Check className="w-3.5 h-3.5" />}
            >
              Accept & Apply Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
