import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIAssistantPanel } from '../components/studio/AIAssistantPanel';
import { AIReviewModal } from '../components/studio/AIReviewModal';
import { AIStatus, AIRevision } from '../types';

describe('AIAssistantPanel Component', () => {
  it('displays configuration instructions when provider is unconfigured', () => {
    const unconfiguredStatus: AIStatus = {
      configured: false,
      provider: 'openai_compatible',
      model: 'gpt-4o-mini',
      base_url: 'https://api.openai.com/v1',
      temperature: 0.2,
      timeout_seconds: 30,
      message: 'CLARITY_AI_API_KEY is not configured on the server.',
    };

    render(
      <AIAssistantPanel
        status={unconfiguredStatus}
        selectedText=""
        hasDocument={true}
        onRunRewrite={vi.fn()}
        onRunSimplify={vi.fn()}
        onRunProcedure={vi.fn()}
        onRunDocs={vi.fn()}
        onRunReleaseNotes={vi.fn()}
        loading={false}
        activeRevision={null}
        onOpenReview={vi.fn()}
      />
    );

    expect(screen.getByText('AI Assistant Offline')).toBeInTheDocument();
    expect(screen.getByText(/CLARITY_AI_API_KEY=sk-.../)).toBeInTheDocument();
    expect(screen.getByText(/Clarity never fakes AI results/)).toBeInTheDocument();
  });

  it('renders all 5 operations and tone selectors when configured', () => {
    const configuredStatus: AIStatus = {
      configured: true,
      provider: 'openai_compatible',
      model: 'gpt-4o-mini',
      base_url: 'https://api.openai.com/v1',
      temperature: 0.2,
      timeout_seconds: 30,
      message: 'Active',
    };

    render(
      <AIAssistantPanel
        status={configuredStatus}
        selectedText="Original documentation sentence."
        hasDocument={true}
        onRunRewrite={vi.fn()}
        onRunSimplify={vi.fn()}
        onRunProcedure={vi.fn()}
        onRunDocs={vi.fn()}
        onRunReleaseNotes={vi.fn()}
        loading={false}
        activeRevision={null}
        onOpenReview={vi.fn()}
      />
    );

    expect(screen.getByText('AI Authoring Assistant')).toBeInTheDocument();
    expect(screen.getByText('Rewrite')).toBeInTheDocument();
    expect(screen.getByText('Simplify')).toBeInTheDocument();
    expect(screen.getByText('Procedure')).toBeInTheDocument();
    expect(screen.getByText('Generate Doc')).toBeInTheDocument();
    expect(screen.getByText('Release Notes')).toBeInTheDocument();
    expect(screen.getByText('Enforce Configured Glossary')).toBeInTheDocument();
    expect(screen.getByText('Generate Clarity Rewrite')).toBeInTheDocument();
  });
});

describe('AIReviewModal Component', () => {
  it('renders original vs proposed text and quality impact comparison', () => {
    const sampleRevision: AIRevision = {
      id: 'rev-123',
      workspace_id: 'ws-1',
      file_path: 'guides/setup.md',
      operation_type: 'rewrite',
      original_text: 'Old unoptimized text with broken link.',
      proposed_text: 'Refined production text with valid anchors.',
      explanation: 'Fixed passive voice and corrected terminology.',
      warnings: ['Flagged potential ambiguity in timeout value.'],
      meaning_changes: ['Replaced colloquial phrasing.'],
      original_hash: 'abc123hash',
      status: 'pending',
      quality_impact: {
        score_before: 75.0,
        score_after: 88.0,
        score_delta: 13.0,
        grade_before: 'C',
        grade_after: 'B',
        findings_count_before: 4,
        findings_count_after: 1,
        resolved_findings_count: 3,
        new_findings_count: 0,
        resolved_findings: [],
        new_findings: [],
      },
      created_at: new Date().toISOString(),
    };

    render(
      <AIReviewModal
        isOpen={true}
        onClose={vi.fn()}
        revision={sampleRevision}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        accepting={false}
        rejecting={false}
      />
    );

    expect(screen.getByText('Review AI Proposal')).toBeInTheDocument();
    expect(screen.getByText('Fixed passive voice and corrected terminology.')).toBeInTheDocument();
    expect(screen.getByText('Old unoptimized text with broken link.')).toBeInTheDocument();
    expect(screen.getByText('Refined production text with valid anchors.')).toBeInTheDocument();
    expect(screen.getByText('3 resolved')).toBeInTheDocument();
    expect(screen.getByText('+13')).toBeInTheDocument();
    expect(screen.getByText('Accept & Apply Changes')).toBeInTheDocument();
    expect(screen.getByText('Reject Proposal')).toBeInTheDocument();
  });
});
