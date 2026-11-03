import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  ShieldCheck,
  PenTool,
  SearchCode,
  Blocks,
  Settings,
  ChevronDown,
  Plus,
  Layers,
  Database,
  Upload,
  X,
  FileCheck2
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Badge } from '../ui/Badge';

export type NavItem =
  | 'overview'
  | 'repositories'
  | 'scanner'
  | 'studio'
  | 'search'
  | 'integrations'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  onOpenCreateWorkspace: () => void;
  onOpenImportZip: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateWorkspace,
  onOpenImportZip,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { workspaces, currentWorkspace, selectWorkspace, seedSampleWorkspace } = useWorkspace();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const navItems: { id: NavItem; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'repositories', label: 'Repositories', icon: <FolderGit2 className="w-4 h-4" /> },
    { id: 'scanner', label: 'Quality Scanner', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'studio', label: 'Writing Studio', icon: <PenTool className="w-4 h-4" /> },
    { id: 'search', label: 'Doc Search', icon: <SearchCode className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Blocks className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleNavClick = (id: NavItem) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 w-64 shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col h-screen select-none z-50 transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--border)]">
          <div className="flex items-center">
            <span className="font-bold text-base tracking-tight text-[var(--foreground)]">Clarity</span>
          </div>

          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-md text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Workspace Switcher with Liquid Glass Menu */}
        <div className="p-3 border-b border-[var(--border)] relative">
          <label className="text-[10px] font-bold tracking-wider text-[var(--foreground-dim)] uppercase px-1 mb-1 block">
            Workspace
          </label>
          <button
            onClick={() => setShowWorkspaceMenu(prev => !prev)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Layers className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span className="text-xs font-semibold text-[var(--foreground)] truncate">
                {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--foreground-muted)] shrink-0 ml-1" />
          </button>

          {/* Liquid Glass Dropdown */}
          {showWorkspaceMenu && (
            <div className="absolute top-full left-3 right-3 mt-1.5 liquid-glass-dropdown rounded-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      selectWorkspace(ws);
                      setShowWorkspaceMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      currentWorkspace?.id === ws.id
                        ? 'bg-[var(--primary-light)] text-[var(--primary)] font-bold'
                        : 'text-[var(--foreground)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <span className="truncate pr-2">{ws.name}</span>
                    {ws.is_sample === 1 && (
                      <Badge variant="teal" size="xs">Sample</Badge>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-1.5 mt-1.5 border-t border-[var(--border)] space-y-1">
                <button
                  onClick={() => {
                    setShowWorkspaceMenu(false);
                    onOpenCreateWorkspace();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--primary)]" />
                  New Workspace
                </button>
                <button
                  onClick={() => {
                    setShowWorkspaceMenu(false);
                    seedSampleWorkspace();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] rounded-lg transition cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-[var(--teal)]" />
                  Load Sample Repository
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <label className="text-[10px] font-bold tracking-wider text-[var(--foreground-dim)] uppercase px-2 mb-1.5 block">
            Navigation
          </label>
          {navItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--surface-3)] text-[var(--foreground)] font-bold shadow-2xs border-l-2 border-[var(--primary)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--surface-2)] text-[var(--foreground-dim)]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Action Footer */}
        <div className="p-3 border-t border-[var(--border)] space-y-2">
          <button
            onClick={onOpenImportZip}
            disabled={!currentWorkspace}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] transition cursor-pointer disabled:opacity-40"
          >
            <Upload className="w-3.5 h-3.5 text-[var(--primary)]" />
            Import Markdown ZIP
          </button>

          <div className="pt-2 px-1 flex items-center justify-between text-[11px] text-[var(--foreground-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              Engine Online
            </span>
            <span className="font-mono text-[10px] text-[var(--foreground-dim)]">FastAPI + SQLite</span>
          </div>
        </div>
      </aside>
    </>
  );
};
