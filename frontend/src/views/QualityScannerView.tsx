import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import { Scan, ScanIssue } from '../types';
import { ScoreCard } from '../components/scanner/ScoreCard';
import { IssueTable } from '../components/scanner/IssueTable';
import { IssueDetailDrawer } from '../components/scanner/IssueDetailDrawer';
import { Button } from '../components/ui/Button';

interface QualityScannerViewProps {
  initialIssue?: ScanIssue | null;
  onJumpToFile?: (filePath: string, line?: number | null) => void;
}

export const QualityScannerView: React.FC<QualityScannerViewProps> = ({
  initialIssue,
  onJumpToFile,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [latestScan, setLatestScan] = useState<Scan | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<ScanIssue | null>(initialIssue || null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestScan = async () => {
    if (!currentWorkspace) return;
    try {
      setError(null);
      const scans = await api.listScans(currentWorkspace.id);
      if (scans.length > 0) {
        const fullScan = await api.getScan(scans[0].id);
        setLatestScan(fullScan);
        if (initialIssue) {
          const match = fullScan.issues?.find(i => i.id === initialIssue.id);
          setSelectedIssue(match || initialIssue);
        }
      } else {
        setLatestScan(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch scan data');
    }
  };

  useEffect(() => {
    fetchLatestScan();
  }, [currentWorkspace?.id]);

  const handleRunScan = async () => {
    if (!currentWorkspace) return;
    try {
      setScanning(true);
      setError(null);
      const scanResult = await api.triggerScan(currentWorkspace.id);
      setLatestScan(scanResult);
      if (scanResult.issues && scanResult.issues.length > 0) {
        setSelectedIssue(scanResult.issues[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Scan failed to execute');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">
            Quality Validation Scanner
          </h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Deterministic AST analysis engine inspecting heading hierarchy, broken links, image assets, and style standards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="md"
            variant="primary"
            onClick={handleRunScan}
            loading={scanning}
            icon={<ShieldCheck className="w-4 h-4" />}
          >
            Run Validation Scan
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Score and Stats Banner */}
      {latestScan ? (
        <ScoreCard
          totalScore={latestScan.total_score}
          grade={latestScan.grade}
          structureScore={latestScan.structure_score}
          linksScore={latestScan.links_score}
          styleScore={latestScan.style_score}
          errorCount={latestScan.error_count}
          warningCount={latestScan.warning_count}
          infoCount={latestScan.info_count}
          totalFiles={latestScan.total_files_scanned}
          durationMs={latestScan.duration_ms}
        />
      ) : (
        <div className="p-10 text-center bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl shadow-2xs">
          <FileCheck className="w-10 h-10 text-[var(--foreground-dim)] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[var(--foreground)]">No Scans Recorded</h3>
          <p className="text-xs text-[var(--foreground-muted)] max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
            Execute your first scan to analyze heading levels, broken relative links, missing assets, and terminology.
          </p>
          <Button
            size="md"
            variant="primary"
            onClick={handleRunScan}
            loading={scanning}
            icon={<ShieldCheck className="w-4 h-4" />}
          >
            Run Scan Now
          </Button>
        </div>
      )}

      {/* Findings Table */}
      {latestScan && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
              Deterministic Rule Findings ({latestScan.issues?.length || 0})
            </h3>
          </div>
          <IssueTable
            issues={latestScan.issues || []}
            onSelectIssue={setSelectedIssue}
            selectedIssueId={selectedIssue?.id}
          />
        </div>
      )}

      {/* Liquid Glass Detail Drawer */}
      <IssueDetailDrawer
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onJumpToFile={onJumpToFile}
      />
    </div>
  );
};
