import React, { useState } from 'react';
import {
  Search,
  ChevronRight,
  Filter,
  FileCode2
} from 'lucide-react';
import { ScanIssue } from '../../types';
import { Badge } from '../ui/Badge';

interface IssueTableProps {
  issues: ScanIssue[];
  onSelectIssue: (issue: ScanIssue) => void;
  selectedIssueId?: string | null;
}

export const IssueTable: React.FC<IssueTableProps> = ({
  issues,
  onSelectIssue,
  selectedIssueId,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredIssues = issues.filter(issue => {
    if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        issue.message.toLowerCase().includes(q) ||
        issue.file_path.toLowerCase().includes(q) ||
        issue.rule_id.toLowerCase().includes(q) ||
        issue.rule_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categories = Array.from(new Set(issues.map(i => i.category)));

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xs flex flex-col">
      {/* Filters Toolbar */}
      <div className="p-3 sm:p-4 border-b border-[var(--border)] bg-[var(--surface-2)]/60 flex flex-wrap items-center justify-between gap-3">
        {/* Severity Pill Switcher */}
        <div className="flex items-center gap-1 bg-[var(--surface-1)] p-1 rounded-xl border border-[var(--border)] shadow-2xs">
          {['all', 'error', 'warning', 'info'].map(sev => {
            const count = sev === 'all' ? issues.length : issues.filter(i => i.severity === sev).length;
            const isCurrent = severityFilter === sev;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer capitalize flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-[var(--surface-3)] text-[var(--foreground)] shadow-xs'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <span>{sev}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isCurrent ? 'bg-[var(--surface-1)] text-[var(--foreground)]' : 'bg-[var(--surface-2)] text-[var(--foreground-dim)]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category & Text Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-[var(--surface-1)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] capitalize cursor-pointer shadow-2xs"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[var(--foreground-dim)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search findings, rules, paths..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--surface-1)] border border-[var(--border)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--foreground-dim)] focus:outline-none focus:border-[var(--primary)] shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="overflow-x-auto">
        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--foreground-muted)]">
            <FileCode2 className="w-8 h-8 text-[var(--foreground-dim)] mx-auto mb-2" />
            <span className="font-semibold text-[var(--foreground)] block">No issues found</span>
            <span className="mt-1 block">No diagnostic findings match your current filter selections.</span>
          </div>
        ) : (
          <table className="w-full min-w-[650px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/40 text-[var(--foreground-muted)] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4 w-28">Severity</th>
                <th className="py-3 px-4 w-28">Rule ID</th>
                <th className="py-3 px-4">Finding & Explanation</th>
                <th className="py-3 px-4 w-60">File Location</th>
                <th className="py-3 px-4 w-10 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredIssues.map(issue => {
                const isSelected = selectedIssueId === issue.id;
                return (
                  <tr
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className={`transition-colors duration-100 cursor-pointer group ${
                      isSelected
                        ? 'bg-[var(--surface-3)] text-[var(--foreground)] font-medium'
                        : 'hover:bg-[var(--surface-2)]/70 text-[var(--foreground)]'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <Badge variant={issue.severity} size="sm" showIcon>
                        {issue.severity}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-[11px] text-[var(--foreground)]">
                      {issue.rule_id}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-[var(--foreground)] block">
                        {issue.rule_name}
                      </span>
                      <span className="text-[var(--foreground-muted)] line-clamp-1 mt-0.5 font-normal">
                        {issue.message}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-[var(--foreground-muted)] truncate max-w-xs">
                      <span>{issue.file_path}</span>
                      {issue.line_number && (
                        <span className="text-[var(--primary)] font-bold ml-1">:{issue.line_number}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-[var(--foreground-dim)] group-hover:text-[var(--foreground)] inline transition-transform group-hover:translate-x-0.5" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
