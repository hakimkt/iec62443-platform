'use client';

import { cn } from '@iec62443/ui';
import {
  ScrollArea,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@iec62443/ui/primitives';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem, NavSection } from '@/config/nav';

interface SidebarNavItemProps {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}

export function SidebarNavItem({ item, collapsed, active }: SidebarNavItemProps) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-brand-50 text-brand-700'
          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
        collapsed && 'justify-center px-2',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', active && 'text-brand-600')} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                'inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-medium',
                item.badgeVariant === 'danger'
                  ? 'bg-red-100 text-red-700'
                  : item.badgeVariant === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-surface-100 text-surface-600',
              )}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

interface SidebarProps {
  sections: NavSection[];
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function Sidebar({ sections, collapsed, onToggle, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex h-full flex-col border-r border-surface-200 bg-surface-0 transition-all duration-200',
          collapsed ? 'w-16' : 'w-64',
          className,
        )}
      >
        <div
          className={cn(
            'flex h-12 items-center border-b border-surface-200 px-4',
            collapsed && 'justify-center px-2',
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-white"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-surface-900">IEC 62443</span>
            </div>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-white"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <nav className={cn('flex flex-col gap-1 p-2', collapsed && 'items-center')}>
            {sections.map((section, sectionIndex) => (
              <div key={section.label}>
                {!collapsed && section.label !== 'Overview' && (
                  <p className="mb-1 mt-3 px-3 text-2xs font-semibold uppercase tracking-wider text-surface-400 first:mt-0">
                    {section.label}
                  </p>
                )}
                {collapsed && sectionIndex > 0 && <Separator className="my-2" />}
                {section.items.map((item) => (
                  <SidebarNavItem
                    key={item.key}
                    item={item}
                    collapsed={collapsed}
                    active={pathname === item.href || pathname.startsWith(item.href + '/')}
                  />
                ))}
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t border-surface-200 p-2">
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              'flex w-full items-center justify-center rounded-md p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600',
              collapsed && 'h-8 w-8',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
            >
              <path d="M11 17l-5-5 5-5" />
              <path d="M18 17l-5-5 5-5" />
            </svg>
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
