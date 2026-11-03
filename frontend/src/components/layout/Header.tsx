import React from 'react';
import {
  Sun,
  Moon,
  Search,
  RefreshCw,
  ChevronRight,
  Command,
  Menu
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Button } from '../ui/Button';

interface HeaderProps {
  currentTabName: string;
  onRescan?: () => void;
  isScanning?: boolean;
  onOpenSearchPalette?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabName,
  onRescan,
  isScanning = false,
  onOpenSearchPalette,
  onToggleMobileMenu,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { currentWorkspace } = useWorkspace();

  return (
    <header className="h-14 border-b border-[var(--border)] liquid-glass px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-2.5 text-xs">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-[var(--foreground-muted)] font-medium hidden sm:inline">Clarity</span>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--foreground-dim)] hidden sm:inline" />
          <span className="text-[var(--foreground-muted)] truncate max-w-[120px] sm:max-w-[160px] font-medium">
            {currentWorkspace ? currentWorkspace.name : 'No Workspace'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--foreground-dim)]" />
          <span className="text-[var(--foreground)] font-bold tracking-tight">{currentTabName}</span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Floating Search Palette Trigger */}
        <button
          onClick={onOpenSearchPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-xs text-[var(--foreground-muted)] transition cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[var(--foreground-dim)]" />
          <span className="hidden md:inline font-medium">Search docs & rules</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-1)] border border-[var(--border)] text-[var(--foreground-muted)]">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        {/* Rescan Button */}
        {onRescan && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onRescan}
            loading={isScanning}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />}
          >
            <span className="hidden sm:inline">Rescan</span>
          </Button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--primary)]" />
          )}
        </button>
      </div>
    </header>
  );
};
