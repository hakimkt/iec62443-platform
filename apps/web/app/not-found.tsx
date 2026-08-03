import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-0">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-surface-200">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-surface-900">Page not found</h2>
        <p className="mt-2 text-sm text-surface-500">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
