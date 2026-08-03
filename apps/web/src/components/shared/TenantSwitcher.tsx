'use client';

import { cn } from '@iec62443/ui';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@iec62443/ui/primitives';
import { Building2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

export function TenantSwitcher() {
  const { tenants, currentTenantId, switchTenant } = useAuth();

  const currentTenant = tenants.find((t) => t.id === currentTenantId);

  if (!currentTenant || tenants.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600">
        <Building2 className="h-4 w-4" />
        <span className="truncate">{currentTenant?.name ?? 'No tenant'}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 px-3">
          <Building2 className="h-4 w-4 shrink-0 text-surface-400" />
          <span className="flex-1 truncate text-left text-sm">{currentTenant.name}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-surface-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => switchTenant(tenant.id)}
            className={cn(
              'flex items-center gap-2',
              tenant.id === currentTenantId && 'bg-brand-50 text-brand-700',
            )}
          >
            <Building2 className="h-4 w-4" />
            <span className="flex-1 truncate">{tenant.name}</span>
            {tenant.id === currentTenantId && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-brand-600"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
