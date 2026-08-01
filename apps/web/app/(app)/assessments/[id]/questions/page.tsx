'use client';

import { use, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@iec62443/ui/primitives';
import { ProgressBar } from '@iec62443/ui/primitives';
import { Textarea } from '@iec62443/ui/primitives';
import { Label } from '@iec62443/ui/primitives';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@iec62443/ui/primitives';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@iec62443/ui';
import { useAssessment, useAssessmentQuestions, useSubmitResponse, useCompleteAssessment } from '@/hooks/useAssessments';

type MaturityLevel = 0 | 1 | 2 | 3 | 4;

const MATURITY_LABELS: Record<number, { title: string; description: string }> = {
  0: {
    title: 'ML 0 — Initial',
    description: 'No formal process. Activities are ad-hoc and uncontrolled.',
  },
  1: {
    title: 'ML 1 — Managed',
    description: 'Process is performed informally. Results are achieved but not consistently documented.',
  },
  2: {
    title: 'ML 2 — Defined',
    description: 'Process is documented and standardized. Procedures are established and followed.',
  },
  3: {
    title: 'ML 3 — Implemented',
    description: 'Process is consistently implemented across the organization. Evidence of compliance is available.',
  },
  4: {
    title: 'ML 4 — Improving',
    description: 'Process is measured, reviewed, and continuously improved. Metrics drive optimization.',
  },
};

const SCORE_DESCRIPTIONS: Record<number, string> = {
  0: 'Not met — No evidence of compliance',
  1: 'Partially met — Some evidence, significant gaps',
  2: 'Largely met — Most requirements addressed, minor gaps',
  3: 'Met — Full compliance with evidence',
  4: 'Exceeded — Exceeds requirements with proactive measures',
};

export default function AssessmentQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = use(params);
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [localScore, setLocalScore] = useState<Record<string, number | undefined>>({});
  const [localMaturity, setLocalMaturity] = useState<Record<string, MaturityLevel | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const { data: assessment } = useAssessment(assessmentId);
  const { data: questions, isLoading } = useAssessmentQuestions(assessmentId);
  const submitResponse = useSubmitResponse();
  const completeAssessment = useCompleteAssessment();

  const questionList = questions ?? [];
  const currentQuestion = questionList[currentIndex];

  // Track which questions have been saved to the server
  const savedQuestions = new Set(
    questionList
      .filter((q) => q.response?.score !== undefined || q.response?.maturityLevel)
      .map((q) => q.id),
  );

  const answeredCount = questionList.filter(
    (q) => localScore[q.id] !== undefined || localMaturity[q.id] !== undefined || q.response?.score !== undefined || q.response?.maturityLevel,
  ).length;

  const allAnswered = questionList.length > 0 && questionList.every(
    (q) => localScore[q.id] !== undefined || localMaturity[q.id] !== undefined || q.response?.score !== undefined || q.response?.maturityLevel,
  );

  const completionPct = questionList.length > 0 ? (answeredCount / questionList.length) * 100 : 0;

  // Save current question and optionally advance
  const saveAndAdvance = useCallback(async (advance: boolean = true) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const score = localScore[qId] ?? currentQuestion.response?.score;
    const maturity = localMaturity[qId] ?? (currentQuestion.response?.maturityLevel as MaturityLevel | undefined);
    const notes = localNotes[qId] ?? currentQuestion.response?.assessorNotes;

    if (score === undefined && maturity === undefined) {
      // Nothing to save, just advance
      if (advance && currentIndex < questionList.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
      return;
    }

    setSaving(true);
    try {
      await submitResponse.mutateAsync({
        engagementId: assessmentId,
        questionId: qId,
        score,
        maturityLevel: maturity,
        assessorNotes: notes ?? undefined,
      });

      if (advance && currentIndex < questionList.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
    } finally {
      setSaving(false);
    }
  }, [currentQuestion, localScore, localMaturity, localNotes, assessmentId, submitResponse, currentIndex, questionList.length]);

  // Save all unsaved answers before completing
  const saveAllAnswers = useCallback(async () => {
    const promises = questionList.map(async (q) => {
      const score = localScore[q.id] ?? q.response?.score;
      const maturity = localMaturity[q.id] ?? (q.response?.maturityLevel as MaturityLevel | undefined);
      const notes = localNotes[q.id] ?? q.response?.assessorNotes;

      if (score === undefined && maturity === undefined) return;

      // Skip if already saved to server with same values
      if (savedQuestions.has(q.id) && localScore[q.id] === undefined && localMaturity[q.id] === undefined && localNotes[q.id] === undefined) return;

      await submitResponse.mutateAsync({
        engagementId: assessmentId,
        questionId: q.id,
        score,
        maturityLevel: maturity,
        assessorNotes: notes ?? undefined,
      });
    });

    await Promise.all(promises);
  }, [questionList, localScore, localMaturity, localNotes, assessmentId, submitResponse, savedQuestions]);

  const handleComplete = useCallback(async () => {
    setSaving(true);
    try {
      await saveAllAnswers();
      await completeAssessment.mutateAsync(assessmentId);
      setShowCompletion(true);
    } finally {
      setSaving(false);
    }
  }, [saveAllAnswers, completeAssessment, assessmentId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' && currentIndex < questionList.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex, questionList.length]);

  // Completion screen
  if (showCompletion) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
        <h2 className="mt-4 text-2xl font-semibold text-surface-900">Assessment Complete</h2>
        <p className="mt-2 text-surface-500">
          All {questionList.length} questions have been answered and saved.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={() => router.push('/assessments')}>
            Back to Assessments
          </Button>
          <Button variant="primary" onClick={() => router.push(`/assessments/${assessmentId}`)}>
            View Assessment
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !questionList.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown} tabIndex={-1}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push(`/assessments/${assessmentId}`)}
            className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {assessment?.name ?? 'Assessment'}
          </button>
          <h1 className="text-xl font-semibold text-surface-900">Assessment Questions</h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm text-surface-500">
              {answeredCount} / {questionList.length} answered
            </span>
            <ProgressBar value={completionPct} color="brand" className="w-48" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Question navigator sidebar */}
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">Questions</h3>
          <div className="space-y-1">
            {questionList.map((q, index) => {
              const hasLocalAnswer = localScore[q.id] !== undefined || localMaturity[q.id] !== undefined;
              const hasServerAnswer = q.response?.score !== undefined || q.response?.maturityLevel;
              const isAnswered = hasLocalAnswer || hasServerAnswer;
              const isCurrent = index === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    isCurrent
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-surface-600 hover:bg-surface-50',
                  )}
                >
                  <div className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-medium',
                    isAnswered ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-400',
                  )}>
                    {isAnswered ? '✓' : index + 1}
                  </div>
                  <span className="truncate">{q.clauseRef || q.questionText.slice(0, 40)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current question */}
        {currentQuestion && (
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm font-medium text-surface-500">Q{currentIndex + 1} of {questionList.length}</span>
              {currentQuestion.clauseRef && (
                <span className="text-xs font-mono text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                  {currentQuestion.clauseRef}
                </span>
              )}
              {currentQuestion.section && (
                <span className="text-xs text-surface-400">{currentQuestion.section}</span>
              )}
            </div>

            <h2 className="text-lg font-medium text-surface-900">
              {currentQuestion.questionText}
            </h2>

            {currentQuestion.guidanceText && (
              <p className="mt-2 text-sm text-surface-500">{currentQuestion.guidanceText}</p>
            )}

            {currentQuestion.requirementId && (
              <p className="mt-2 text-xs text-surface-400">
                Requirement: {currentQuestion.requirementId}
              </p>
            )}

            <div className="mt-6 space-y-4">
              {/* Maturity Level */}
              <div className="space-y-2">
                <Label>Maturity Level</Label>
                <p className="text-xs text-surface-400">
                  Rate the organizational maturity for this requirement. Higher levels require documented, consistent processes with evidence.
                </p>
                <Select
                  value={(localMaturity[currentQuestion.id] ?? currentQuestion.response?.maturityLevel)?.toString() ?? ''}
                  onValueChange={(val) => {
                    setLocalMaturity((prev) => ({ ...prev, [currentQuestion.id]: Number(val) as MaturityLevel }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select maturity level" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MATURITY_LABELS).map(([level, info]) => (
                      <SelectItem key={level} value={level}>
                        {info.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Show description for selected maturity level */}
                {(localMaturity[currentQuestion.id] ?? currentQuestion.response?.maturityLevel) !== undefined && (
                  <p className="rounded-md bg-surface-50 px-3 py-2 text-xs text-surface-600">
                    {MATURITY_LABELS[localMaturity[currentQuestion.id] ?? (currentQuestion.response?.maturityLevel as number)]?.description}
                  </p>
                )}
              </div>

              {/* Score */}
              <div className="space-y-2">
                <Label>Score (0–{currentQuestion.maxScore ?? 4})</Label>
                <p className="text-xs text-surface-400">
                  Rate how well the requirement is fulfilled. Each score level indicates the degree of compliance.
                </p>
                <Select
                  value={String(localScore[currentQuestion.id] ?? currentQuestion.response?.score ?? '')}
                  onValueChange={(val) => {
                    setLocalScore((prev) => ({ ...prev, [currentQuestion.id]: val ? parseInt(val, 10) : undefined }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select score" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: (currentQuestion.maxScore ?? 4) + 1 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {i} — {SCORE_DESCRIPTIONS[i] ?? `Score ${i}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Show description for selected score */}
                {(localScore[currentQuestion.id] ?? currentQuestion.response?.score) !== undefined && (
                  <p className="rounded-md bg-surface-50 px-3 py-2 text-xs text-surface-600">
                    {SCORE_DESCRIPTIONS[localScore[currentQuestion.id] ?? currentQuestion.response?.score ?? 0]}
                  </p>
                )}
              </div>

              {/* Assessor Notes */}
              <div className="space-y-2">
                <Label>Assessor Notes</Label>
                <Textarea
                  placeholder="Add notes, evidence references, or observations about this response..."
                  value={localNotes[currentQuestion.id] ?? currentQuestion.response?.assessorNotes ?? ''}
                  onChange={(e) => {
                    setLocalNotes((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }));
                  }}
                  rows={4}
                />
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                icon={ChevronLeft}
              >
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {allAnswered && currentIndex === questionList.length - 1 ? (
                  <Button
                    variant="primary"
                    onClick={handleComplete}
                    loading={saving}
                  >
                    Complete Assessment
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => saveAndAdvance(true)}
                    loading={saving}
                  >
                    Save & Continue
                  </Button>
                )}
              </div>

              <Button
                variant="secondary"
                onClick={() => setCurrentIndex((i) => Math.min(questionList.length - 1, i + 1))}
                disabled={currentIndex === questionList.length - 1}
                icon={ChevronRight}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
