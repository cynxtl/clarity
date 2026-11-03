import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  FileText,
  Clock,
  Code2,
  Heading,
  Layers,
  Sparkles,
  History,
  X,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface SearchResult {
  filePath: string;
  line: number;
  snippet: string;
  type: 'heading' | 'code' | 'text';
}

type SearchScope = 'all' | 'heading' | 'code' | 'text';

interface SearchViewProps {
  onJumpToFile?: (filePath: string, line?: number) => void;
}

const SUGGESTED_QUERIES = [
  'Authentication',
  'Quickstart',
  'API Endpoints',
  'Prerequisites',
  'Rate Limiting',
  'Consensus Protocol',
  'Cluster',
  'Bearer Token'
];

export const SearchView: React.FC<SearchViewProps> = ({ onJumpToFile }) => {
  const { currentWorkspace } = useWorkspace();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filesCache, setFilesCache] = useState<{ path: string; lines: string[] }[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('clarity_recent_searches');
      return saved ? JSON.parse(saved) : ['Authentication', 'API Endpoints', 'Cluster'];
    } catch {
      return ['Authentication', 'API Endpoints', 'Cluster'];
    }
  });

  useEffect(() => {
    if (!currentWorkspace) return;
    api.listFiles(currentWorkspace.id).then(async files => {
      const mdFiles = files.filter(f => f.extension.startsWith('.md'));
      const loaded = await Promise.all(
        mdFiles.map(async f => {
          try {
            const data = await api.getFileContent(currentWorkspace.id, f.path);
            return { path: f.path, lines: data.content.split('\n') };
          } catch {
            return { path: f.path, lines: [] };
          }
        })
      );
      setFilesCache(loaded);
    });
  }, [currentWorkspace?.id]);

  // Statistics
  const totalLines = filesCache.reduce((acc, f) => acc + f.lines.length, 0);
  const totalHeadings = filesCache.reduce(
    (acc, f) => acc + f.lines.filter(l => l.trim().startsWith('#')).length,
    0
  );
  const totalCodeBlocks = filesCache.reduce(
    (acc, f) => acc + f.lines.filter(l => l.trim().startsWith('```')).length / 2,
    0
  );

  const saveRecentQuery = (term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    setRecentQueries(prev => {
      const updated = [clean, ...prev.filter(q => q.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      localStorage.setItem('clarity_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const removeRecentQuery = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    setRecentQueries(prev => {
      const updated = prev.filter(q => q !== term);
      localStorage.setItem('clarity_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const q = query.toLowerCase();
    const hits: SearchResult[] = [];

    for (const doc of filesCache) {
      doc.lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(q)) {
          let type: 'heading' | 'code' | 'text' = 'text';
          if (line.trim().startsWith('#')) type = 'heading';
          else if (line.trim().startsWith('```') || line.includes('`')) type = 'code';

          if (scope === 'all' || type === scope) {
            hits.push({
              filePath: doc.path,
              line: idx + 1,
              snippet: line.trim(),
              type,
            });
          }
        }
      });
      if (hits.length >= 50) break;
    }

    setResults(hits);
    setIsSearching(false);
  }, [query, scope, filesCache]);

  const handleSelectQuery = (term: string) => {
    setQuery(term);
    saveRecentQuery(term);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      saveRecentQuery(query);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Search Header */}
      <div>
        <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">
          Documentation Search
        </h2>
        <p className="text-xs text-[var(--foreground-muted)]">
          Search full-text across Markdown headers, code snippets, security specifications, and guide content.
        </p>
      </div>

      {/* Search Bar + Scope Filter Strip */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--foreground-dim)] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documentation, curl commands, headers, auth tokens..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl pl-11 pr-10 py-3 text-xs text-[var(--foreground)] placeholder-[var(--foreground-dim)] focus:outline-none focus:border-[var(--primary)] shadow-xs transition duration-150"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[var(--foreground-dim)] hover:text-[var(--foreground)] rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Scope Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-[var(--foreground-muted)] mr-1">
            Scope:
          </span>
          {[
            { id: 'all', label: 'All Content', icon: <Layers className="w-3 h-3" /> },
            { id: 'heading', label: 'Headings Only', icon: <Heading className="w-3 h-3" /> },
            { id: 'code', label: 'Code Blocks', icon: <Code2 className="w-3 h-3" /> },
            { id: 'text', label: 'Body Text', icon: <FileText className="w-3 h-3" /> },
          ].map(s => {
            const isActive = scope === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setScope(s.id as SearchScope)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-2xs'
                    : 'bg-[var(--surface-2)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
                }`}
              >
                {s.icon}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Initial State when no query entered */}
      {query.trim().length < 2 && (
        <div className="space-y-6">
          {/* Indexed Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] block">
                Indexed Files
              </span>
              <span className="text-xl font-black text-[var(--foreground)] mt-1 block">
                {filesCache.length}
              </span>
              <span className="text-[10px] text-[var(--foreground-dim)]">Markdown sources</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] block">
                Total Lines
              </span>
              <span className="text-xl font-black text-[var(--foreground)] mt-1 block">
                {totalLines}
              </span>
              <span className="text-[10px] text-[var(--foreground-dim)]">Searchable lines</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] block">
                Headings
              </span>
              <span className="text-xl font-black text-[var(--foreground)] mt-1 block">
                {totalHeadings}
              </span>
              <span className="text-[10px] text-[var(--foreground-dim)]">H1 to H6 anchors</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] block">
                Code Fences
              </span>
              <span className="text-xl font-black text-[var(--foreground)] mt-1 block">
                {Math.floor(totalCodeBlocks)}
              </span>
              <span className="text-[10px] text-[var(--foreground-dim)]">Syntax blocks</span>
            </div>
          </div>

          {/* Suggested Quick Searches */}
          <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Suggested Search Queries
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map(term => (
                <button
                  key={term}
                  onClick={() => handleSelectQuery(term)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-xs text-[var(--foreground)] hover:border-[var(--primary)]/40 transition cursor-pointer font-medium"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          {recentQueries.length > 0 && (
            <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[var(--teal)]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                    Recent Searches
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setRecentQueries([]);
                    localStorage.removeItem('clarity_recent_searches');
                  }}
                  className="text-[11px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  Clear history
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentQueries.map(term => (
                  <button
                    key={term}
                    onClick={() => handleSelectQuery(term)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-xs text-[var(--foreground)] transition cursor-pointer font-medium group"
                  >
                    <Clock className="w-3 h-3 text-[var(--foreground-dim)]" />
                    <span>{term}</span>
                    <span
                      onClick={e => removeRecentQuery(e, term)}
                      className="p-0.5 rounded text-[var(--foreground-dim)] hover:text-[var(--danger)] hover:bg-[var(--surface-1)] ml-1"
                      title="Remove"
                    >
                      <X className="w-2.5 h-2.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Engine Information */}
          <div className="p-4 rounded-xl bg-[var(--surface-2)]/50 border border-[var(--border)] flex items-start gap-3 text-xs text-[var(--foreground-muted)]">
            <Sparkles className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold text-[var(--foreground)] block">
                Deterministic Full-Text Search Engine
              </span>
              <span>
                Queries search case-insensitively across document files, heading anchors, code snippets, and body text. Results link directly to line numbers in the repository tree.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {query.trim().length >= 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] px-1">
            <span>
              {results.length} {results.length === 1 ? 'Match' : 'Matches'} Found
            </span>
            <span className="font-mono text-[10px]">
              Scope: {scope}
            </span>
          </div>

          {/* No Results Fallback */}
          {results.length === 0 && !isSearching && (
            <div className="p-8 sm:p-12 text-center bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl shadow-2xs space-y-3">
              <FileText className="w-8 h-8 text-[var(--foreground-dim)] mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">No matching documents found</h3>
                <p className="text-xs text-[var(--foreground-muted)] mt-1 max-w-sm mx-auto">
                  No documentation lines matched "{query}" in scope "{scope}".
                </p>
              </div>

              {/* Suggestions */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-[var(--foreground)] block mb-2">
                  Try searching for:
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {['quickstart', 'authentication', 'api', 'prerequisites', 'consensus'].map(term => (
                    <button
                      key={term}
                      onClick={() => handleSelectQuery(term)}
                      className="px-2.5 py-1 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-xs text-[var(--foreground)] font-mono transition cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                  {scope !== 'all' && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setScope('all')}
                      className="ml-2"
                    >
                      Reset scope to All
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          <div className="space-y-2">
            {results.map((hit, idx) => (
              <div
                key={idx}
                onClick={() => {
                  saveRecentQuery(query);
                  if (onJumpToFile) onJumpToFile(hit.filePath, hit.line);
                }}
                className="p-3.5 rounded-xl bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border)] transition-colors duration-100 cursor-pointer flex items-center justify-between gap-4 group shadow-2xs"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    {hit.type === 'heading' ? (
                      <Badge variant="cobalt" size="xs">Heading</Badge>
                    ) : hit.type === 'code' ? (
                      <Badge variant="info" size="xs">Code</Badge>
                    ) : (
                      <Badge variant="neutral" size="xs">Text</Badge>
                    )}
                    <span className="font-mono text-[var(--foreground-muted)] text-[11px] font-semibold">
                      {hit.filePath}:{hit.line}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--foreground)] font-mono truncate leading-relaxed">
                    {hit.snippet}
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-[var(--foreground-dim)] group-hover:text-[var(--foreground)] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
