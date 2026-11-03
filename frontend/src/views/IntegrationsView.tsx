import React from 'react';
import {
  FolderArchive,
  GitBranch,
  Terminal,
  Cpu,
  CheckCircle2,
  Clock,
  Workflow,
  Calendar,
  Upload
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface IntegrationsViewProps {
  onOpenImportZip: () => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ onOpenImportZip }) => {
  const featuredIntegration = {
    title: 'Local ZIP Documentation Ingestion',
    category: 'Documentation Sources',
    status: 'available' as const,
    badge: 'Available',
    badgeVariant: 'success' as const,
    description: 'Import and index local markdown repositories with automated security checks: path traversal sanitisation, executable binary blocking, and safe archive extraction limits.',
    icon: <FolderArchive className="w-5 h-5 text-[var(--success)]" />,
    footerLabel: 'Available & Verified',
    actionText: 'Import Archive',
    actionOnClick: onOpenImportZip,
  };

  const workflowIntegrations = [
    {
      title: 'GitHub Repository Webhooks',
      category: 'Source Control Sync',
      status: 'in-development' as const,
      badge: 'In Development',
      badgeVariant: 'cobalt' as const,
      description: 'Trigger automated documentation quality checks on pull requests, commits, and branch merges with inline GitHub commit status badges.',
      icon: <GitBranch className="w-5 h-5 text-[var(--primary)]" />,
      footerLabel: 'In active development',
    },
    {
      title: 'GitHub Actions Quality Gate',
      category: 'CI/CD Pipelines',
      status: 'in-development' as const,
      badge: 'In Development',
      badgeVariant: 'cobalt' as const,
      description: 'Run clarity validation in your CI pipeline. Block PRs with broken relative links, missing images, or severe hierarchy regressions.',
      icon: <Workflow className="w-5 h-5 text-[var(--info)]" />,
      footerLabel: 'In active development',
    },
    {
      title: 'Clarity CLI Toolchain',
      category: 'Developer Workflows',
      status: 'in-development' as const,
      badge: 'In Development',
      badgeVariant: 'cobalt' as const,
      description: 'Pre-commit git hook and local terminal tool for validating Markdown files prior to pushing commits to upstream branches.',
      icon: <Terminal className="w-5 h-5 text-[var(--foreground-muted)]" />,
      footerLabel: 'In active development',
    },
    {
      title: 'API Spec Accuracy Verifier',
      category: 'Specification Drift',
      status: 'planned' as const,
      badge: 'Planned',
      badgeVariant: 'neutral' as const,
      description: 'Cross-reference OpenAPI 3.1 and Protobuf specs against markdown endpoint documentation to detect missing or outdated parameter descriptions.',
      icon: <Cpu className="w-5 h-5 text-[var(--warning)]" />,
      footerLabel: 'Planned for future phase',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">
          Developer Workflow Integrations
        </h2>
        <p className="text-xs text-[var(--foreground-muted)]">
          Connect your engineering toolchains, CI/CD pipelines, and git repositories to Clarity.
        </p>
      </div>

      {/* Featured Primary Integration Card */}
      <Card className="border-[var(--primary)]/30 bg-gradient-to-r from-[var(--surface-1)] to-[var(--surface-2)]/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-2xs">
              {featuredIntegration.icon}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                  {featuredIntegration.category}
                </span>
                <Badge variant={featuredIntegration.badgeVariant} size="xs">
                  {featuredIntegration.badge}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">
                {featuredIntegration.title}
              </h3>
              <p className="text-xs text-[var(--foreground-muted)] max-w-2xl leading-relaxed">
                {featuredIntegration.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--success)] mr-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>{featuredIntegration.footerLabel}</span>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={featuredIntegration.actionOnClick}
              icon={<Upload className="w-3.5 h-3.5" />}
            >
              {featuredIntegration.actionText}
            </Button>
          </div>
        </div>
      </Card>

      {/* 2x2 Balanced Secondary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflowIntegrations.map((item, idx) => (
          <Card key={idx} className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-2xs">
                  {item.icon}
                </div>
                <Badge variant={item.badgeVariant} size="xs">
                  {item.badge}
                </Badge>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-dim)] block mb-1">
                {item.category}
              </span>
              <h3 className="text-sm font-bold text-[var(--foreground)] mb-1.5 tracking-tight">
                {item.title}
              </h3>
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-[var(--border)] flex items-center justify-between">
              {item.status === 'in-development' ? (
                <div className="flex items-center gap-1.5 text-xs text-[var(--primary)] font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.footerLabel}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-dim)] font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.footerLabel}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
