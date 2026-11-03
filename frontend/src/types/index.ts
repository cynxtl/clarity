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
