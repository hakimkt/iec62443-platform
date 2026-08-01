'use client';

import { use, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@iec62443/ui/primitives';
import { ProgressBar } from '@iec62443/ui/primitives';
import { Textarea } from '@iec62443/ui/primitives';
import { Label } from '@iec62443/ui/primitives';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@iec62443/ui/primitives';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@iec62443/ui';
import { useAssessment, useAssessmentQuestions, useSubmitResponse } from '@/hooks/useAssessments';

type MaturityLevel = 0 | 1 | 2 | 3 | 4;

export default function AssessmentQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = use(params);
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [localScore, setLocalScore] = useState<Record<string, number | undefined>>({});
  const [localMaturity, setLocalMaturity] = useState<Record<string, MaturityLevel | undefined>>({});

  const { data: assessment } = useAssessment(assessmentId);
  const { data: questions, isLoading } = useAssessmentQuestions(assessmentId);
  const submitResponse = useSubmitResponse();

  const questionList = questions ?? [];
  const currentQuestion = questionList[currentIndex];

  const handleSave = useCallback(async () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const score = localScore[qId] ?? currentQuestion.response?.score;
    const maturity = localMaturity[qId] ?? (currentQuestion.response?.maturityLevel as MaturityLevel | undefined);
    const notes = localNotes[qId] ?? currentQuestion.response?.assessorNotes;

    if (score === undefined && !maturity) return;

    await submitResponse.mutateAsync({
      engagementId: assessmentId,
      questionId: qId,
      score,
      maturityLevel: maturity,
      assessorNotes: notes ?? undefined,
    });
  }, [currentQuestion, localScore, localMaturity, localNotes, assessmentId, submitResponse]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' && currentIndex < questionList.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex, questionList.length]);

  if (isLoading || !questionList.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
      </div>
    );
  }

  const answeredCount = questionList.filter((q) => q.response?.score !== undefined || q.response?.maturityLevel).length;
  const completionPct = questionList.length > 0 ? (answeredCount / questionList.length) * 100 : 0;

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
              const isAnswered = q.response?.score !== undefined || q.response?.maturityLevel;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    index === currentIndex
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
              <span className="text-sm font-medium text-surface-500">Q{currentIndex + 1}</span>
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
              <div className="space-y-2">
                <Label>Maturity Level</Label>
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
                    <SelectItem value="0">ML 0 — Initial</SelectItem>
                    <SelectItem value="1">ML 1 — Managed</SelectItem>
                    <SelectItem value="2">ML 2 — Defined</SelectItem>
                    <SelectItem value="3">ML 3 — Implemented</SelectItem>
                    <SelectItem value="4">ML 4 — Improving</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Score (0–{currentQuestion.maxScore ?? 4})</Label>
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
                      <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assessor Notes</Label>
                <Textarea
                  placeholder="Add notes about this response..."
                  value={localNotes[currentQuestion.id] ?? currentQuestion.response?.assessorNotes ?? ''}
                  onChange={(e) => {
                    setLocalNotes((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }));
                  }}
                  rows={4}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                icon={ChevronLeft}
              >
                Previous
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={submitResponse.isPending}
              >
                Save & Continue
              </Button>
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
