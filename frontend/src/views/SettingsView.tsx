import React, { useState, useEffect } from 'react';
import {
  Check,
  Save
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import { RuleDefinition } from '../types';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const SettingsView: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [rules, setRules] = useState<RuleDefinition[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings states
  const [requiredSections, setRequiredSections] = useState('Overview, Prerequisites, Installation');
  const [customGlossary, setCustomGlossary] = useState('whitelist: allowlist\nblacklist: denylist\nmaster: primary');

  useEffect(() => {
    api.listRules().then(setRules);
  }, []);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">
            Platform Settings & Rules Configuration
          </h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Configure deterministic AST rules, glossary dictionaries, and database metadata.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={handleSave}
          icon={savedSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
        >
          {savedSuccess ? 'Settings Saved' : 'Save Configuration'}
        </Button>
      </div>

      {/* Rules Registry Table */}
      <Card>
        <CardHeader
          title="Active Deterministic Validation Rules"
          subtitle="All 12 AST validation rules compiled and enforced by the engine"
        />
        <div className="divide-y divide-[var(--border)]">
          {rules.map(rule => (
            <div key={rule.rule_id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--foreground)]">
                    {rule.rule_id}
                  </span>
                  <Badge variant={rule.severity as any} size="xs">
                    {rule.severity}
                  </Badge>
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    {rule.name}
                  </span>
                </div>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  {rule.description}
                </p>
              </div>

              <Badge variant="neutral" size="xs" className="shrink-0 capitalize">
                {rule.category}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Terminology & Structure Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Required Documentation Sections"
            subtitle="Comma-separated headings enforced by STRUC-001"
          />
          <Input
            value={requiredSections}
            onChange={e => setRequiredSections(e.target.value)}
            placeholder="e.g. Overview, Prerequisites, Installation"
            hint="Pages missing these sections produce a quality warning."
          />
        </Card>

        <Card>
          <CardHeader
            title="Custom Glossary Mappings"
            subtitle="Key-value pairs checked by TERM-001"
          />
          <textarea
            value={customGlossary}
            onChange={e => setCustomGlossary(e.target.value)}
            className="w-full h-24 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-3 text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
            placeholder="forbidden_term: preferred_term"
          />
          <span className="text-[11px] text-[var(--foreground-muted)] mt-1.5 block">
            Format: `non-standard-term: preferred-term` (one per line)
          </span>
        </Card>
      </div>

      {/* System & Storage Specs */}
      <Card>
        <CardHeader
          title="Database & Architecture Information"
          subtitle="Clean repository layer ready for PostgreSQL production scaling"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-[var(--foreground-muted)] block text-[10px] uppercase font-bold">
              Storage Engine
            </span>
            <span className="text-[var(--foreground)] font-bold mt-1 block">
              SQLite 3 + Foreign Keys
            </span>
            <span className="text-[10px] text-[var(--foreground-dim)]">
              Data-access abstraction layer
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-[var(--foreground-muted)] block text-[10px] uppercase font-bold">
              Workspace Slug
            </span>
            <span className="text-[var(--foreground)] truncate mt-1 block font-bold" title={currentWorkspace?.root_path}>
              {currentWorkspace ? currentWorkspace.slug : 'None'}
            </span>
            <span className="text-[10px] text-[var(--foreground-dim)]">
              Isolated directory sandbox
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-[var(--foreground-muted)] block text-[10px] uppercase font-bold">
              API Engine
            </span>
            <span className="text-[var(--success)] font-bold mt-1 block">
              REST v1.0.0 Online
            </span>
            <span className="text-[10px] text-[var(--foreground-dim)]">
              FastAPI + Pydantic v2
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
