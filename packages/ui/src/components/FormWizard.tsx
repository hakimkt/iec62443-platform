import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { Button } from '../primitives/Button.js';

/* ───────────────────────────── Step type ──────────────────────── */

export interface WizardStep {
  title: string;
  description?: string;
  content: React.ReactNode;
}

/* ───────────────────────────── Props ──────────────────────────── */

export interface FormWizardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onNext?: () => boolean | Promise<boolean>;
  onBack?: () => void;
  onComplete?: () => Promise<void>;
  nextLabel?: string;
  completeLabel?: string;
  backLabel?: string;
  loading?: boolean;
}

/* ───────────────────────────── Component ──────────────────────── */

const FormWizard = React.forwardRef<HTMLDivElement, FormWizardProps>(
  (
    {
      className,
      steps,
      currentStep,
      onStepChange,
      onNext,
      onBack,
      onComplete,
      nextLabel = 'Next',
      completeLabel = 'Complete',
      backLabel = 'Back',
      loading = false,
      ...props
    },
    ref,
  ) => {
    const isFirst = currentStep === 0;
    const isLast = currentStep === steps.length - 1;

    const handleNext = React.useCallback(async () => {
      if (onNext) {
        const canProceed = await onNext();
        if (!canProceed) return;
      }

      if (isLast) {
        if (onComplete) {
          await onComplete();
        }
      } else {
        onStepChange(currentStep + 1);
      }
    }, [onNext, isLast, onComplete, onStepChange, currentStep]);

    const handleBack = React.useCallback(() => {
      if (onBack) {
        onBack();
      } else {
        onStepChange(currentStep - 1);
      }
    }, [onBack, onStepChange, currentStep]);

    const currentStepData = steps[currentStep];

    return (
      <div ref={ref} className={cn('flex flex-col', className)} {...props}>
        {/* Step indicator */}
        <div className="flex items-center" aria-label="Progress">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;

            return (
              <React.Fragment key={step.title}>
                {/* Step circle + label */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => onStepChange(index)}
                    disabled={index > currentStep}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                      isActive && 'bg-brand-600 text-white',
                      isCompleted && 'bg-green-600 text-white',
                      !isActive &&
                        !isCompleted &&
                        'bg-surface-200 text-surface-400',
                      index <= currentStep && 'cursor-pointer',
                    )}
                    aria-label={`Step ${index + 1}: ${step.title}`}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </button>
                  <span
                    className={cn(
                      'mt-1.5 text-xs max-w-[80px] text-center truncate',
                      isActive
                        ? 'text-brand-600 font-medium'
                        : 'text-surface-500',
                    )}
                  >
                    {step.title}
                  </span>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-2 mt-[-1.125rem]',
                      index < currentStep
                        ? 'bg-brand-600'
                        : 'bg-surface-200',
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step content */}
        <div className="mt-6">
          {currentStepData?.content}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3">
          {!isFirst && (
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={loading}
            >
              {backLabel}
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleNext}
            loading={loading}
          >
            {isLast ? completeLabel : nextLabel}
          </Button>
        </div>
      </div>
    );
  },
);
FormWizard.displayName = 'FormWizard';

export { FormWizard };
