import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowRight,
  Database,
  Plus,
  Layers,
  Link2,
  Feather,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import { DashboardMetrics, ScanIssue } from '../types';
import { MetricCard } from '../components/dashboard/MetricCard';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge, GradeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface OverviewViewProps {
  onNavigate: (tab: any) => void;
  onSelectIssue: (issue: ScanIssue) => void;
  onOpenCreateWorkspace: () => void;
}

const severityRank: Record<string, number> = { error: 1, warning: 2, info: 3 };
const categoryRank: Record<string, number> = {
  links: 1,
  assets: 2,
  structure: 3,
  accessibility: 4,
  style: 5,
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onSelectIssue,
  onOpenCreateWorkspace,
}) => {
  const { currentWorkspace, seedSampleWorkspace, loading: wsLoading } = useWorkspace();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchMetrics = async () => {
    if (!currentWorkspace?.id) return;
    try {
      setLoading(true);
      const data = await api.getDashboardMetrics(currentWorkspace?.id);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [currentWorkspace?.id]);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedSampleWorkspace();
      await fetchMetrics();
    } finally {
      setSeeding(false);
    }
  };

  const sortedTopIssues = useMemo(() => {
    if (!metrics?.top_issues) return [];
    return [...metrics.top_issues].sort((a, b) => {
      const sA = severityRank[a.severity?.toLowerCase()] ?? 99;
      const sB = severityRank[b.severity?.toLowerCase()] ?? 99;
      if (sA !== sB) return sA - sB;

      const cA = categoryRank[a.category?.toLowerCase()] ?? 99;
      const cB = categoryRank[b.category?.toLowerCase()] ?? 99;
      if (cA !== cB) return cA - cB;

      return (a.line_number ?? 0) - (b.line_number ?? 0);
    });
  }, [metrics?.top_issues]);

  if (wsLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // High-clarity onboarding when no workspace or empty
  if (!currentWorkspace || (!metrics?.workspace_id && metrics?.total_files === 0)) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20 flex items-center justify-center mx-auto mb-6 shadow-xs">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
          Welcome to Clarity
        </h2>
        <p className="text-xs text-[var(--foreground-muted)] max-w-lg mx-auto mt-2 leading-relaxed">
          Clarity is an engineering platform that enforces deterministic quality standards for technical documentation. Load our reference repository or create your own workspace to begin scanning.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Button
            variant="primary"
            size="md"
            onClick={handleSeed}
            loading={seeding}
            icon={<Database className="w-4 h-4" />}
          >
            Explore Sample Docs Repository
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={onOpenCreateWorkspace}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Empty Workspace
          </Button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-[var(--success)]';
    if (score >= 80) return 'text-[var(--primary)]';
    if (score >= 70) return 'text-[var(--warning)]';
    return 'text-[var(--danger)]';
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Sample Data Indicator */}
      {metrics?.is_sample && (
        <div className="p-3.5 rounded-xl bg-[var(--primary-light)] border border-[var(--primary)]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[var(--foreground)] min-w-0">
            <Badge variant="teal" className="shrink-0">Sample Repository</Badge>
            <span className="font-medium">
              Exploring the seeded Nexus Platform reference documentation with active AST validation rules.
            </span>
          </div>
          <div className="shrink-0 flex items-center">
            <Button
              size="xs"
              variant="outline"
              onClick={onOpenCreateWorkspace}
              icon={<Plus className="w-3 h-3" />}
            >
              New Workspace
            </Button>
          </div>
        </div>
      )}

      {/* Hero: Documentation Quality Score Card */}
      <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Main Score Hero */}
          <div className="md:col-span-5 flex items-center gap-5 border-b md:border-b-0 md:border-r border-[var(--border)] pb-5 md:pb-0 md:pr-6">
            <div className="w-24 h-24 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col items-center justify-center shrink-0 shadow-xs">
              <span className={`text-4xl font-black tracking-tight leading-none ${
                metrics?.current_score !== null && metrics?.current_score !== undefined
                  ? getScoreColor(metrics.current_score)
                  : 'text-[var(--foreground-dim)]'
              }`}>
                {metrics?.current_score !== null && metrics?.current_score !== undefined
                  ? metrics.current_score.toFixed(0)
                  : '--'}
              </span>
              <span className="text-[10px] text-[var(--foreground-muted)] uppercase font-bold tracking-wider mt-1.5">
                Score
              </span>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                {metrics?.current_grade ? (
                  <GradeBadge grade={metrics.current_grade} size="md" />
                ) : (
                  <Badge variant="neutral">UNSCANNED</Badge>
                )}
                <span className="text-sm font-bold text-[var(--foreground)] tracking-tight">Quality Rating</span>
              </div>
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                Deterministic evaluation computed across all active headings, relative links, assets, and terminology rules.
              </p>
              <div className="pt-1">
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => onNavigate('scanner')}
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                >
                  Run Full Quality Scan
                </Button>
              </div>
            </div>
          </div>

          {/* Sub-Score Progress Meters */}
          <div className="md:col-span-7 space-y-3.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--foreground)] font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[var(--primary)]" /> Structural Hierarchy
                </span>
                <span className="font-mono font-bold text-[var(--foreground)]">
                  {metrics?.structure_score !== null && metrics?.structure_score !== undefined ? `${metrics.structure_score}%` : '--'}
                </span>
              </div>
              <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                  style={{ width: `${metrics?.structure_score || 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--foreground)] font-semibold flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-[var(--teal)]" /> Links & Assets Health
                </span>
                <span className="font-mono font-bold text-[var(--foreground)]">
                  {metrics?.links_score !== null && metrics?.links_score !== undefined ? `${metrics.links_score}%` : '--'}
                </span>
              </div>
              <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
                <div
                  className="h-full rounded-full bg-[var(--teal)] transition-all duration-500"
                  style={{ width: `${metrics?.links_score || 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--foreground)] font-semibold flex items-center gap-1.5">
                  <Feather className="w-3.5 h-3.5 text-[var(--warning)]" /> Style & Terminology
                </span>
                <span className="font-mono font-bold text-[var(--foreground)]">
                  {metrics?.style_score !== null && metrics?.style_score !== undefined ? `${metrics.style_score}%` : '--'}
                </span>
              </div>
              <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
                <div
                  className="h-full rounded-full bg-[var(--warning)] transition-all duration-500"
                  style={{ width: `${metrics?.style_score || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row: Documents, Errors, Warnings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Active Documents"
          value={metrics?.total_files || 0}
          subtitle={`${(metrics?.total_words || 0).toLocaleString()} words indexed`}
          icon={<FileText className="w-4 h-4" />}
          variant="cobalt"
        />

        <MetricCard
          label="Blocking Errors"
          value={metrics?.error_count || 0}
          subtitle="Broken relative links & missing image files"
          icon={<AlertCircle className="w-4 h-4" />}
          variant={metrics?.error_count ? 'danger' : 'success'}
        />

        <MetricCard
          label="Quality Warnings"
          value={metrics?.warning_count || 0}
          subtitle="Heading skips, alt-text & terminology"
          icon={<AlertTriangle className="w-4 h-4" />}
          variant={metrics?.warning_count ? 'warning' : 'default'}
        />
      </div>

      {/* Main Split: Top Priority Issues & Scan Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Priority Issues (8 Cols) */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader
              title="Top Priority Documentation Issues"
              subtitle="Unresolved structural violations and broken references"
              action={
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onNavigate('scanner')}
                  className="font-semibold text-xs gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              }
            />

            {!sortedTopIssues || sortedTopIssues.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--foreground-muted)]">
                No unresolved issues detected. Your documentation meets all active quality rules.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {sortedTopIssues.slice(0, 5).map(issue => (
                  <div
                    key={issue.id}
                    onClick={() => {
                      onSelectIssue(issue);
                      onNavigate('scanner');
                    }}
                    className="py-3 px-2 flex items-start justify-between gap-4 hover:bg-[var(--surface-2)]/60 rounded-xl cursor-pointer transition-colors duration-100 group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={issue.severity} size="xs" showIcon>
                          {issue.severity}
                        </Badge>
                        <span className="font-bold text-xs text-[var(--foreground)]">
                          {issue.rule_name}
                        </span>
                        <span className="font-mono text-[10px] font-semibold text-[var(--foreground-dim)]">
                          {issue.rule_id}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 font-normal">
                        {issue.message}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--foreground-dim)] overflow-hidden">
                        <span className="truncate">{issue.file_path}</span>
                        {issue.line_number && <span className="text-[var(--primary)] font-bold shrink-0">:{issue.line_number}</span>}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[var(--foreground-dim)] group-hover:text-[var(--foreground)] shrink-0 mt-2 transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Scan History (4 Cols) */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader
              title="Scan History"
              subtitle="Deterministic evaluation log"
            />

            {!metrics?.recent_scans || metrics.recent_scans.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--foreground-muted)]">
                No scans recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {metrics.recent_scans.map(scan => (
                  <div
                    key={scan.id}
                    className="p-3 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)] flex items-center justify-between transition-colors hover:bg-[var(--surface-2)]"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <GradeBadge grade={scan.grade} size="sm" />
                        <span className="font-extrabold text-xs text-[var(--foreground)]">
                          Score {scan.total_score.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--foreground-dim)] font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(scan.created_at).toLocaleDateString()} {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] font-mono text-[var(--foreground-muted)]">
                      <div className="font-semibold">{scan.error_count} err / {scan.warning_count} warn</div>
                      <div className="text-[10px] text-[var(--foreground-dim)]">{scan.duration_ms}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
