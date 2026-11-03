import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreCard } from '../components/scanner/ScoreCard';
import { Badge, GradeBadge } from '../components/ui/Badge';

describe('ScoreCard Component', () => {
  it('renders score, grade, and severity counts accurately', () => {
    render(
      <ScoreCard
        totalScore={88.5}
        grade="B"
        structureScore={90}
        linksScore={80}
        styleScore={95}
        errorCount={2}
        warningCount={5}
        infoCount={3}
        totalFiles={12}
        durationMs={45}
      />
    );

    // Score
    expect(screen.getByText('89')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();

    // Severities
    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Duration and Files
    expect(screen.getByText(/Deterministic AST validation across 12 documentation files/)).toBeInTheDocument();
    expect(screen.getByText(/Execution: 45ms/)).toBeInTheDocument();
  });
});

describe('Badge Component', () => {
  it('renders severity and grade badges', () => {
    const { rerender } = render(<Badge variant="error">ERROR</Badge>);
    expect(screen.getByText('ERROR')).toBeInTheDocument();

    rerender(<GradeBadge grade="A+" />);
    expect(screen.getByText('A+')).toBeInTheDocument();
  });
});
