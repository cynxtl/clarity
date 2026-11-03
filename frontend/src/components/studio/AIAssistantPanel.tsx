import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  ListOrdered,
  FileCode2,
  Tag,
  AlertCircle,
  HelpCircle,
  Layers,
  CheckCircle2,
  ChevronDown,
  Info,
  BookOpen
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AIStatus, AIRevision } from '../../types';

interface AIAssistantPanelProps {
  status: AIStatus | null;
  selectedText: string;
  hasDocument: boolean;
  onRunRewrite: (data: {
    tone: string;
    custom_instruction: string;
    use_glossary: boolean;
  }) => Promise<void>;
  onRunSimplify: (data: {
    audience: string;
    custom_instruction: string;
    use_glossary: boolean;
  }) => Promise<void>;
  onRunProcedure: (data: {
    task_description: string;
    prerequisites: string[];
    source_notes: string;
    expected_outcome: string;
    warnings: string[];
    tone: string;
    use_glossary: boolean;
  }) => Promise<void>;
  onRunDocs: (data: {
    doc_type: string;
    feature_brief: string;
    code_examples: string;
    technical_specs: string;
    tone: string;
    use_glossary: boolean;
  }) => Promise<void>;
  onRunReleaseNotes: (data: {
    version: string;
    release_date: string;
    added: string[];
    changed: string[];
    fixed: string[];
    deprecated: string[];
    removed: string[];
    tone: string;
  }) => Promise<void>;
  loading: boolean;
  activeRevision: AIRevision | null;
  onOpenReview: () => void;
}

type OperationTab = 'rewrite' | 'simplify' | 'procedure' | 'docs' | 'release_notes';

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  status,
  selectedText,
  hasDocument,
  onRunRewrite,
  onRunSimplify,
  onRunProcedure,
  onRunDocs,
  onRunReleaseNotes,
  loading,
  activeRevision,
  onOpenReview,
}) => {
  const [activeTab, setActiveTab] = useState<OperationTab>('rewrite');

  // Shared options
  const [tone, setTone] = useState<string>('professional_neutral');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [useGlossary, setUseGlossary] = useState<boolean>(true);

  // Simplify
  const [audience, setAudience] = useState<string>('general_users');

  // Procedure
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [prereqInput, setPrereqInput] = useState<string>('Administrative workspace privileges\nValid authentication token');
  const [expectedOutcome, setExpectedOutcome] = useState<string>('Feature verified and running in production');
  const [procedureNotes, setProcedureNotes] = useState<string>('');

  // Docs Generator
  const [docType, setDocType] = useState<string>('feature_overview');
  const [featureBrief, setFeatureBrief] = useState<string>('');
  const [codeExamples, setCodeExamples] = useState<string>('');
  const [technicalSpecs, setTechnicalSpecs] = useState<string>('');

  // Release Notes
  const [version, setVersion] = useState<string>('v1.2.0');
  const [releaseDate, setReleaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [addedItems, setAddedItems] = useState<string>('Deterministic AST validation rule suite\nInstant document line jumping');
  const [fixedItems, setFixedItems] = useState<string>('Broken relative link anchor evaluation\nTablet responsive layout squeezing');
  const [deprecatedItems, setDeprecatedItems] = useState<string>('Legacy plain text configuration parser');

  if (!status?.configured) {
    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--warning-bg)] border border-[var(--warning-border)] text-[var(--warning)] flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--foreground)]">AI Assistant Offline</h3>
            <span className="text-[11px] text-[var(--foreground-muted)]">Configuration required</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--foreground-muted)] space-y-2 leading-relaxed">
          <p>
            The backend AI integration layer is unconfigured. To enable AI-assisted authoring, configure an OpenAI-compatible API key on the backend:
          </p>
          <div className="p-2 rounded-lg bg-[var(--surface-3)] font-mono text-[11px] text-[var(--foreground)] select-all">
            CLARITY_AI_API_KEY=sk-...
          </div>
          <p className="text-[11px]">
            Supports OpenAI, Azure, Groq, Ollama, DeepSeek, and vLLM endpoints via <code className="font-mono text-[var(--primary)]">CLARITY_AI_BASE_URL</code>.
          </p>
        </div>

        <div className="text-[11px] text-[var(--foreground-dim)] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span>Clarity never fakes AI results or sends credentials to the client.</span>
        </div>
      </div>
    );
  }

  const handleExecute = async () => {
    if (!hasDocument) return;

    if (activeTab === 'rewrite') {
      await onRunRewrite({
        tone,
        custom_instruction: customInstruction,
        use_glossary: useGlossary,
      });
    } else if (activeTab === 'simplify') {
      await onRunSimplify({
        audience,
        custom_instruction: customInstruction,
        use_glossary: useGlossary,
      });
    } else if (activeTab === 'procedure') {
      const prereqs = prereqInput.split('\n').map(s => s.trim()).filter(Boolean);
      await onRunProcedure({
        task_description: taskDescription || 'Configure platform feature',
        prerequisites: prereqs,
        source_notes: procedureNotes,
        expected_outcome: expectedOutcome,
        warnings: [],
        tone,
        use_glossary: useGlossary,
      });
    } else if (activeTab === 'docs') {
      await onRunDocs({
        doc_type: docType,
        feature_brief: featureBrief || selectedText || 'Comprehensive feature guide',
        code_examples: codeExamples,
        technical_specs: technicalSpecs,
        tone,
        use_glossary: useGlossary,
      });
    } else if (activeTab === 'release_notes') {
      const added = addedItems.split('\n').map(s => s.trim()).filter(Boolean);
      const fixed = fixedItems.split('\n').map(s => s.trim()).filter(Boolean);
      const deprecated = deprecatedItems.split('\n').map(s => s.trim()).filter(Boolean);
      await onRunReleaseNotes({
        version,
        release_date: releaseDate,
        added,
        changed: [],
        fixed,
        deprecated,
        removed: [],
        tone,
      });
    }
  };

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20 flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-[var(--foreground)] tracking-tight">AI Authoring Assistant</h3>
        </div>
      </div>

      {/* Pending Revision Notification Alert */}
      {activeRevision && activeRevision.status === 'pending' && (
        <div className="p-3 rounded-xl bg-[var(--primary-light)] border border-[var(--primary)]/30 flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0">
            <span className="font-bold text-[var(--foreground)] block">Proposal Awaiting Review</span>
            <span className="text-[11px] text-[var(--foreground-muted)] truncate block">
              {activeRevision.explanation}
            </span>
          </div>
          <Button size="xs" variant="primary" onClick={onOpenReview}>
            Review Proposal
          </Button>
        </div>
      )}

      {/* Operation Tabs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
        <button
          onClick={() => setActiveTab('rewrite')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rewrite'
              ? 'bg-[var(--surface-3)] text-[var(--foreground)] shadow-2xs'
              : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Rewrite</span>
        </button>

        <button
          onClick={() => setActiveTab('simplify')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'simplify'
              ? 'bg-[var(--surface-3)] text-[var(--foreground)] shadow-2xs'
              : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Simplify</span>
        </button>

        <button
          onClick={() => setActiveTab('procedure')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'procedure'
              ? 'bg-[var(--surface-3)] text-[var(--foreground)] shadow-2xs'
              : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Procedure</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'docs'
              ? 'bg-[var(--surface-3)] text-[var(--foreground)] shadow-2xs'
              : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>Generate Doc</span>
        </button>

        <button
          onClick={() => setActiveTab('release_notes')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 col-span-2 sm:col-span-1 ${
            activeTab === 'release_notes'
              ? 'bg-[var(--surface-3)] text-[var(--foreground)] shadow-2xs'
              : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Release Notes</span>
        </button>
      </div>

      {/* Tab Content Fields */}
      <div className="space-y-3 text-xs">
        {/* Selection helper */}
        {(activeTab === 'rewrite' || activeTab === 'simplify') && (
          <div className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px]">
            {selectedText ? (
              <div className="space-y-1">
                <span className="text-[var(--foreground)] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--teal)]" />
                  Text Selected in Editor ({selectedText.length} chars)
                </span>
                <p className="text-[var(--foreground-muted)] line-clamp-2 italic font-mono text-[10px]">
                  "{selectedText}"
                </p>
              </div>
            ) : (
              <span className="text-[var(--foreground-muted)]">
                Highlight text in the editor to target specific paragraphs, or Clarity will process the full document.
              </span>
            )}
          </div>
        )}

        {/* Tone Selector */}
        {activeTab !== 'simplify' && (
          <div>
            <label className="text-[11px] font-semibold text-[var(--foreground-muted)] block mb-1">
              Writing Tone
            </label>
            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] shadow-2xs cursor-pointer"
            >
              <option value="professional_neutral">Professional & Neutral</option>
              <option value="concise_direct">Concise & Direct</option>
              <option value="beginner_friendly">Beginner-Friendly</option>
              <option value="formal_customer">Formal Customer-Facing</option>
            </select>
          </div>
        )}

        {/* Audience Selector (for Simplify) */}
        {activeTab === 'simplify' && (
          <div>
            <label className="text-[11px] font-semibold text-[var(--foreground-muted)] block mb-1">
              Target Audience
            </label>
            <select
              value={audience}
              onChange={e => setAudience(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] shadow-2xs cursor-pointer"
            >
              <option value="general_users">General Users (Non-technical)</option>
              <option value="developers">Software Engineers & Developers</option>
              <option value="system_administrators">System Administrators & DevOps</option>
              <option value="technical_support">Technical Support & Tier-2</option>
            </select>
          </div>
        )}

        {/* Specific Fields: Procedure */}
        {activeTab === 'procedure' && (
          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-semibold text-[var(--foreground-muted)] block mb-1">
                Task Description
              </label>
              <input
                type="text"
                placeholder="e.g. Configure SSL mutual authentication for API gateways"
                value={taskDescription}
                onChange={e => setTaskDescription(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--foreground-dim)] focus:outline-none focus:border-[var(--primary)] shadow-2xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--foreground-muted)] block mb-1">
                Prerequisites (One per line)
              </label>
              <textarea
                rows={2}
                value={prereqInput}
                onChange={e => setPrereqInput(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--foreground)] font-mono resize-none focus:outline-none focus:border-[var(--primary)] shadow-2xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--foreground-muted)] block mb-1">
                Expected Outcome
              </label>
              <input
                type="text"
                placeholder="e.g. Gateway returns HTTP 200 with active TLS handshake"
                value={expectedOutcome}
                onChange={e => setExpectedOutcome(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--foreground-dim)] focus:outline-none focus:border-[var(--primary)] shadow-2xs"
              />
            </div>
          </div>
        )}

        {/* Specific Fields: Docs Generator */}
        {activeTab === 'docs' && (
          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-semibold text-[var(--foreground-muted)] block mb-1">
                Document Type
              </label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] shadow-2xs cursor-pointer"
              >
                <option value="feature_overview">Feature Overview Guide</option>
                <option value="installation">Installation & Setup Guide</option>
                <option value="configuration">Configuration Reference</option>
                <option value="api_usage">API Usage Guide</option>
                <option value="troubleshooting">Troubleshooting Matrix</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--foreground-muted)] block mb-1">
                Feature Brief & Notes
              </label>
              <textarea
                rows={3}
                placeholder="Explain the feature, parameters, and key workflows..."
                value={featureBrief}
                onChange={e => setFeatureBrief(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--foreground)] placeholder-[var(--foreground-dim)] resize-none focus:outline-none focus:border-[var(--primary)] shadow-2xs"
              />
            </div>
          </div>
        )}

        {/* Specific Fields: Release Notes */}
        {activeTab === 'release_notes' && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-[var(--foreground-muted)] block mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] shadow-2xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--foreground-muted)] block mb-1">
                  Release Date
                </label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={e => setReleaseDate(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] shadow-2xs"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--foreground-muted)] block mb-1">
                Added Entries (one per line)
              </label>
              <textarea
                rows={2}
                value={addedItems}
                onChange={e => setAddedItems(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs font-mono text-[var(--foreground)] resize-none focus:outline-none focus:border-[var(--primary)] shadow-2xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--foreground-muted)] block mb-1">
                Fixed Entries (one per line)
              </label>
              <textarea
                rows={2}
                value={fixedItems}
                onChange={e => setFixedItems(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs font-mono text-[var(--foreground)] resize-none focus:outline-none focus:border-[var(--primary)] shadow-2xs"
              />
            </div>
          </div>
        )}

        {/* Custom Instructions */}
        {(activeTab === 'rewrite' || activeTab === 'simplify') && (
          <div>
            <label className="text-[11px] font-semibold text-[var(--foreground-muted)] block mb-1">
              Custom Writer Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Focus on active voice, keep code examples intact"
              value={customInstruction}
              onChange={e => setCustomInstruction(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--foreground-dim)] focus:outline-none focus:border-[var(--primary)] shadow-2xs"
            />
          </div>
        )}

        {/* Glossary adherence toggle */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="text-[11px] text-[var(--foreground)] font-medium">Enforce Configured Glossary</span>
          </div>
          <input
            type="checkbox"
            checked={useGlossary}
            onChange={e => setUseGlossary(e.target.checked)}
            className="rounded accent-[var(--primary)] cursor-pointer"
          />
        </div>
      </div>

      {/* Action Trigger */}
      <Button
        variant="primary"
        size="sm"
        onClick={handleExecute}
        loading={loading}
        disabled={!hasDocument || loading}
        className="w-full justify-center"
        icon={<Sparkles className="w-3.5 h-3.5" />}
      >
        {activeTab === 'rewrite' && 'Generate Clarity Rewrite'}
        {activeTab === 'simplify' && 'Generate Simplified Version'}
        {activeTab === 'procedure' && 'Generate Step-by-Step Procedure'}
        {activeTab === 'docs' && 'Generate Documentation Article'}
        {activeTab === 'release_notes' && 'Generate Customer Release Notes'}
      </Button>

      <div className="text-[10px] text-[var(--foreground-dim)] text-center leading-relaxed">
        AI proposals are stored as pending reviews. Nothing is saved until accepted.
      </div>
    </div>
  );
};
