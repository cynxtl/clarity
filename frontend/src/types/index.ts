export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  root_path: string;
  is_sample: number;
  created_at: string;
  updated_at: string;
  file_count: number;
  latest_score?: number | null;
  latest_grade?: string | null;
  unresolved_issues: number;
}

export interface DocumentFile {
  id: string;
  workspace_id: string;
  path: string;
  filename: string;
  extension: string;
  size_bytes: number;
  line_count: number;
  word_count: number;
  last_modified: string;
}

export interface FileContent {
  path: string;
  filename: string;
  extension: string;
  content: string;
  size_bytes: number;
  line_count: number;
  word_count: number;
}

export interface ScanIssue {
  id: string;
  scan_id: string;
  workspace_id: string;
  rule_id: string;
  rule_name: string;
  category: 'structure' | 'links' | 'assets' | 'style' | 'accessibility';
  severity: 'error' | 'warning' | 'info';
  file_path: string;
  line_number?: number | null;
  message: string;
  snippet?: string | null;
  suggested_fix?: string | null;
}

export interface Scan {
  id: string;
  workspace_id: string;
  status: string;
  total_score: number;
  grade: string;
  structure_score: number;
  links_score: number;
  style_score: number;
  error_count: number;
  warning_count: number;
  info_count: number;
  total_files_scanned: number;
  duration_ms: number;
  created_at: string;
  issues?: ScanIssue[];
}

export interface RuleDefinition {
  rule_id: string;
  name: string;
  category: string;
  severity: string;
  description: string;
}

export interface DashboardMetrics {
  workspace_id?: string;
  workspace_name?: string;
  is_sample: boolean;
  total_files: number;
  total_words: number;
  current_score?: number | null;
  current_grade?: string | null;
  error_count: number;
  warning_count: number;
  info_count: number;
  total_issues: number;
  structure_score?: number | null;
  links_score?: number | null;
  style_score?: number | null;
  recent_scans: Scan[];
  top_issues: ScanIssue[];
}

export interface ScanRunOptions {
  rules?: string[];
  custom_glossary?: Record<string, string>;
  required_sections?: string[];
}

// -------------------------------------------------------------
// Phase 2: AI-Assisted Authoring Interfaces
// -------------------------------------------------------------
export interface AIStatus {
  configured: boolean;
  provider: string;
  model: string;
  base_url: string;
  temperature: number;
  timeout_seconds: number;
  message: string;
}

export interface FindingSummary {
  rule_id: string;
  rule_name: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  line_number?: number | null;
  message: string;
}

export interface QualityImpactComparison {
  score_before: number;
  score_after: number;
  score_delta: number;
  grade_before: string;
  grade_after: string;
  findings_count_before: number;
  findings_count_after: number;
  resolved_findings_count: number;
  new_findings_count: number;
  resolved_findings: FindingSummary[];
  new_findings: FindingSummary[];
}

export interface AIRevision {
  id: string;
  workspace_id: string;
  file_path: string;
  operation_type: 'rewrite' | 'simplify' | 'procedure' | 'docs' | 'release_notes';
  tone?: string | null;
  audience?: string | null;
  custom_instruction?: string | null;
  original_text: string;
  proposed_text: string;
  explanation: string;
  warnings: string[];
  meaning_changes: string[];
  original_hash: string;
  status: 'pending' | 'accepted' | 'rejected';
  quality_impact?: QualityImpactComparison | null;
  created_at: string;
  reviewed_at?: string | null;
}

export interface AcceptRevisionResponse {
  revision_id: string;
  status: string;
  quality_impact: QualityImpactComparison;
  saved_file_path: string;
  updated_content: string;
}

