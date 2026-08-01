import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — IEC 62443 Platform',
  description: 'Industrial Cybersecurity Management Platform',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 bg-brand-950 lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,theme(colors.brand.900),theme(colors.brand.950))]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-lg font-semibold">IEC 62443 Platform</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">
              Industrial Cybersecurity
              <br />
              Management
            </h1>
            <p className="mt-4 text-lg text-brand-300">
              Assess, manage, and certify your IEC 62443 compliance with
              confidence.
            </p>
          </div>
          <p className="text-sm text-brand-400">
            &copy; {new Date().getFullYear()} IEC 62443 Platform. All rights
            reserved.
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
