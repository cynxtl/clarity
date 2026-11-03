import React from 'react';
import { Layers, Link2, Feather, AlertCircle, AlertTriangle, Info, Clock, CheckCircle2 } from 'lucide-react';
import { GradeBadge } from '../ui/Badge';

interface ScoreCardProps {
  totalScore: number;
  grade: string;
  structureScore: number;
  linksScore: number;
  styleScore: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  totalFiles: number;
  durationMs: number;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  totalScore,
  grade,
  structureScore,
  linksScore,
  styleScore,
  errorCount,
  warningCount,
  infoCount,
  totalFiles,
  durationMs,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-[var(--success)]';
    if (score >= 80) return 'text-[var(--primary)]';
    if (score >= 70) return 'text-[var(--warning)]';
    return 'text-[var(--danger)]';
  };

  const getProgressBg = (score: number) => {
    if (score >= 90) return 'bg-[var(--success)]';
    if (score >= 80) return 'bg-[var(--primary)]';
    if (score >= 70) return 'bg-[var(--warning)]';
    return 'bg-[var(--danger)]';
  };

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-6 shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Main Score + Grade Hero */}
        <div className="lg:col-span-4 flex items-center gap-5 border-b lg:border-b-0 lg:border-r border-[var(--border)] pb-5 lg:pb-0 lg:pr-6">
          <div className="relative flex items-center justify-center shrink-0">
            <div className="w-22 h-22 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col items-center justify-center shadow-xs">
              <span className={`text-3xl font-black tracking-tight leading-none ${getScoreColor(totalScore)}`}>
                {totalScore.toFixed(0)}
              </span>
              <span className="text-[10px] text-[var(--foreground-muted)] uppercase font-bold tracking-wider mt-1">
                / 100
              </span>
            </div>
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <GradeBadge grade={grade} size="md" />
              <span className="text-sm font-bold text-[var(--foreground)] tracking-tight">Quality Grade</span>
            </div>
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
              Deterministic AST validation across {totalFiles} documentation files.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--foreground-dim)] pt-0.5">
              <Clock className="w-3 h-3" />
              <span>Execution: {durationMs}ms</span>
            </div>
          </div>
        </div>

        {/* Sub-Scores (5 Cols) */}
        <div className="lg:col-span-5 space-y-3.5 border-b lg:border-b-0 lg:border-r border-[var(--border)] pb-5 lg:pb-0 lg:pr-6">
          {/* Structural Hierarchy */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[var(--foreground)] font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--primary)]" /> Structural Hierarchy
              </span>
              <span className="font-mono font-bold text-[var(--foreground)]">{structureScore}%</span>
            </div>
            <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressBg(structureScore)}`}
                style={{ width: `${structureScore}%` }}
              />
            </div>
          </div>

          {/* Links & Assets */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[var(--foreground)] font-semibold flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[var(--teal)]" /> Links & Assets Health
              </span>
              <span className="font-mono font-bold text-[var(--foreground)]">{linksScore}%</span>
            </div>
            <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressBg(linksScore)}`}
                style={{ width: `${linksScore}%` }}
              />
            </div>
          </div>

          {/* Style & Terminology */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[var(--foreground)] font-semibold flex items-center gap-1.5">
                <Feather className="w-3.5 h-3.5 text-[var(--warning)]" /> Style & Terminology
              </span>
              <span className="font-mono font-bold text-[var(--foreground)]">{styleScore}%</span>
            </div>
            <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressBg(styleScore)}`}
                style={{ width: `${styleScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Severity Counts (3 Cols) */}
        <div className="lg:col-span-3 grid grid-cols-3 lg:grid-cols-1 gap-2.5">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--danger-bg)] border border-[var(--danger-border)]">
            <span className="text-xs font-semibold text-[var(--danger)] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Errors
            </span>
            <span className="text-xs font-extrabold text-[var(--danger)] font-mono">{errorCount}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--warning-bg)] border border-[var(--warning-border)]">
            <span className="text-xs font-semibold text-[var(--warning)] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Warnings
            </span>
            <span className="text-xs font-extrabold text-[var(--warning)] font-mono">{warningCount}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--info-bg)] border border-[var(--info-border)]">
            <span className="text-xs font-semibold text-[var(--info)] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" /> Info
            </span>
            <span className="text-xs font-extrabold text-[var(--info)] font-mono">{infoCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
