'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@iec62443/ui/primitives';
import { Label } from '@iec62443/ui/primitives';
import { ShieldCheck } from 'lucide-react';

export default function MfaPage() {
  const { verifyMfa, mfaChallenge, isLoading } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const setRef = useCallback(
    (index: number) => (el: HTMLInputElement | null) => {
      inputRefs.current[index] = el;
    },
    [],
  );

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    const newCode = [...code];
    for (let i = 0; i < 6 && i < pastedData.length; i++) {
      newCode[i] = pastedData[i] ?? '';
    }
    setCode(newCode);
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    try {
      await verifyMfa(fullCode);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid verification code. Please try again.');
      }
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  }

  if (!mfaChallenge) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-surface-900">
            Two-factor authentication
          </h2>
          <p className="mt-1 text-sm text-surface-500">
            No MFA challenge in progress. Please sign in again.
          </p>
        </div>
        <Link href="/login">
          <Button variant="primary">Back to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
          <ShieldCheck className="h-7 w-7 text-brand-600" />
        </div>
        <h2 className="text-xl font-semibold text-surface-900">
          Verification required
        </h2>
        <p className="mt-1 text-sm text-surface-500">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-center">Authentication code</Label>
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={setRef(index)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-12 w-12 rounded-md border border-surface-200 bg-surface-0 text-center text-lg font-semibold text-surface-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:outline-none"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={isLoading}
        >
          Verify
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        Didn&apos;t receive a code?{' '}
        <Link
          href="/login"
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          Try signing in again
        </Link>
      </p>
    </div>
  );
}
