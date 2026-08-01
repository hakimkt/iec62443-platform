'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@iec62443/ui/primitives';
import { Input } from '@iec62443/ui/primitives';
import { Label } from '@iec62443/ui/primitives';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-surface-900">
            Check your email
          </h2>
          <p className="mt-1 text-sm text-surface-500">
            We sent a password reset link to <strong>{email}</strong>
          </p>
        </div>

        <div className="rounded-md border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          If an account exists with this email, you will receive a password
          reset link shortly. The link expires in 1 hour.
        </div>

        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-surface-900">
          Reset your password
        </h2>
        <p className="mt-1 text-sm text-surface-500">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={isLoading}
          icon={Mail}
        >
          Send reset link
        </Button>
      </form>

      <div className="mt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
