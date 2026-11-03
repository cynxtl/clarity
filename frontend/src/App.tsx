import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewView } from './views/OverviewView';
import { RepositoriesView } from './views/RepositoriesView';
import { QualityScannerView } from './views/QualityScannerView';
import { StudioView } from './views/StudioView';
import { SearchView } from './views/SearchView';
import { IntegrationsView } from './views/IntegrationsView';
import { SettingsView } from './views/SettingsView';
import { CreateWorkspaceModal } from './components/workspace/CreateWorkspaceModal';
import { ImportZipModal } from './components/workspace/ImportZipModal';
import { ScanIssue } from './types';
import { api } from './services/api';

const MainApp: React.FC = () => {
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const [currentTab, setCurrentTab] = useState<NavItem>(() => {
    const param = new URLSearchParams(window.location.search).get('tab') || window.location.hash.replace('#', '');
    const validTabs: NavItem[] = ['overview', 'repositories', 'scanner', 'studio', 'search', 'integrations', 'settings'];
    return validTabs.includes(param as NavItem) ? (param as NavItem) : 'overview';
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedIssueForScanner, setSelectedIssueForScanner] = useState<ScanIssue | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', currentTab);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [currentTab]);

  // Global Cmd+K / Ctrl+K shortcut to open Doc Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCurrentTab('search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRescan = async () => {
    if (!currentWorkspace) return;
    try {
      setIsScanning(true);
      await api.triggerScan(currentWorkspace.id);
      await refreshWorkspaces();
      if (currentTab !== 'scanner' && currentTab !== 'overview') {
        setCurrentTab('scanner');
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectIssueFromOverview = (issue: ScanIssue) => {
    setSelectedIssueForScanner(issue);
    setCurrentTab('scanner');
  };

  const handleJumpToFile = (_filePath: string, _line?: number | null) => {
    setCurrentTab('repositories');
  };

  const tabTitles: Record<NavItem, string> = {
    overview: 'Documentation Quality Overview',
    repositories: 'Repository File Explorer',
    scanner: 'Quality Scanner & Diagnostics',
    studio: 'Writing Studio',
    search: 'Documentation Search',
    integrations: 'Workflow Integrations',
    settings: 'Settings & Rules Registry',
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenCreateWorkspace={() => setIsCreateOpen(true)}
        onOpenImportZip={() => setIsImportOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          currentTabName={tabTitles[currentTab]}
          onRescan={currentWorkspace ? handleRescan : undefined}
          isScanning={isScanning}
          onOpenSearchPalette={() => setCurrentTab('search')}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--background)]">
          {currentTab === 'overview' && (
            <OverviewView
              onNavigate={setCurrentTab}
              onSelectIssue={handleSelectIssueFromOverview}
              onOpenCreateWorkspace={() => setIsCreateOpen(true)}
            />
          )}

          {currentTab === 'repositories' && (
            <RepositoriesView
              onOpenCreateWorkspace={() => setIsCreateOpen(true)}
              onOpenImportZip={() => setIsImportOpen(true)}
            />
          )}

          {currentTab === 'scanner' && (
            <QualityScannerView
              initialIssue={selectedIssueForScanner}
              onJumpToFile={handleJumpToFile}
            />
          )}

          {currentTab === 'studio' && <StudioView />}

          {currentTab === 'search' && (
            <SearchView onJumpToFile={handleJumpToFile} />
          )}

          {currentTab === 'integrations' && (
            <IntegrationsView onOpenImportZip={() => setIsImportOpen(true)} />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => setCurrentTab('repositories')}
      />

      <ImportZipModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={() => {
          setCurrentTab('repositories');
          handleRescan();
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <MainApp />
      </WorkspaceProvider>
    </ThemeProvider>
  );
}
