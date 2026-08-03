'use client';

import type { TenantMemberStatus } from '@iec62443/shared-types';
import { cn } from '@iec62443/ui';
import { Button, Input, Separator } from '@iec62443/ui/primitives';
import {
  Key,
  Loader2,
  Plus,
  ScrollText,
  Search,
  Settings,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import {
  useApiKeys,
  useAuditLog,
  useInviteMember,
  useMembers,
  useRemoveMember,
  useRevokeApiKey,
  useRoles,
  useTenantSettings,
  useUpdateMember,
  useUpdateTenantSettings,
} from '@/hooks/useAdmin';

type TabKey = 'members' | 'roles' | 'apiKeys' | 'auditLog' | 'settings';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'members', label: 'Members', icon: Users },
  { key: 'roles', label: 'Roles', icon: Shield },
  { key: 'apiKeys', label: 'API Keys', icon: Key },
  { key: 'auditLog', label: 'Audit Log', icon: ScrollText },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const MEMBER_STATUS_COLORS: Record<TenantMemberStatus, string> = {
  active: 'bg-green-100 text-green-700',
  invited: 'bg-blue-100 text-blue-700',
  suspended: 'bg-red-100 text-red-700',
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('members');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-surface-900">Administration</h1>
        <p className="mt-1 text-sm text-surface-500">Manage users, roles, and system settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-6" role="tablist" aria-label="Administration sections">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && <MembersTab />}
      {activeTab === 'roles' && <RolesTab />}
      {activeTab === 'apiKeys' && <ApiKeysTab />}
      {activeTab === 'auditLog' && <AuditLogTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Members Tab
// ---------------------------------------------------------------------------

function MembersTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const { data: membersData, isLoading } = useMembers({
    page,
    perPage: 25,
    search: search || undefined,
  });

  const updateMember = useUpdateMember();
  const removeMember = useRemoveMember();
  const inviteMember = useInviteMember();

  const members = membersData?.data ?? [];
  const pagination = membersData?.pagination;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole });
    setInviteEmail('');
    setInviteRole('viewer');
    setShowInvite(false);
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await updateMember.mutateAsync({ userId, role });
  };

  const handleRemove = async (userId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember.mutateAsync(userId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-surface-200 bg-surface-0 py-2 pl-10 pr-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowInvite(!showInvite)}>
          Invite
        </Button>
      </div>

      {/* Inline Invite Form */}
      {showInvite && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-medium text-surface-700 mb-3">Invite a new member</p>
          <div className="flex items-center gap-3">
            <Input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-md border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none"
            >
              <option value="viewer">Viewer</option>
              <option value="assessor">Assessor</option>
              <option value="lead_assessor">Lead Assessor</option>
              <option value="project_manager">Project Manager</option>
              <option value="tenant_admin">Admin</option>
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={handleInvite}
              loading={inviteMember.isPending}
              disabled={!inviteEmail.trim()}
            >
              Send Invite
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-surface-200 bg-surface-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    User ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-surface-100 last:border-0">
                    <td className="px-4 py-3 text-sm font-medium text-surface-900">{member.id}</td>
                    <td className="px-4 py-3 text-sm text-surface-600">{member.userId}</td>
                    <td className="px-4 py-3">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                        className="rounded-md border border-surface-200 bg-surface-0 px-2 py-1 text-xs text-surface-700 focus:border-brand-500 focus:outline-none"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="assessor">Assessor</option>
                        <option value="lead_assessor">Lead Assessor</option>
                        <option value="project_manager">Project Manager</option>
                        <option value="tenant_admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          MEMBER_STATUS_COLORS[member.status] ?? 'bg-surface-100 text-surface-600',
                        )}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemove(member.userId)}
                        className="rounded-md p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-600"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-surface-500">
              <span>
                Showing {(pagination.page - 1) * pagination.perPage + 1}–
                {Math.min(pagination.page * pagination.perPage, pagination.total)} of{' '}
                {pagination.total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roles Tab
// ---------------------------------------------------------------------------

function RolesTab() {
  const { data: roles, isLoading } = useRoles();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {roles && roles.length > 0 ? (
        roles.map((role) => (
          <div key={role.id} className="rounded-lg border border-surface-200 bg-surface-0 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-surface-900">{role.name}</p>
                  {role.isSystem && (
                    <span className="inline-flex items-center rounded bg-surface-100 px-1.5 py-0.5 text-xs font-medium text-surface-500">
                      System
                    </span>
                  )}
                </div>
                {role.description && (
                  <p className="mt-0.5 text-xs text-surface-500">{role.description}</p>
                )}
              </div>
              <span className="text-xs text-surface-500">
                {role.permissions.length} permissions
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Shield className="h-8 w-8 text-surface-300" />
          <p className="mt-2 text-sm text-surface-500">No roles defined yet.</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Keys Tab
// ---------------------------------------------------------------------------

function ApiKeysTab() {
  const { data: apiKeys, isLoading } = useApiKeys();
  const revokeApiKey = useRevokeApiKey();

  const handleRevoke = async (id: string) => {
    if (confirm('Are you sure you want to revoke this API key?')) {
      await revokeApiKey.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {apiKeys && apiKeys.length > 0 ? (
        apiKeys.map((key) => (
          <div key={key.id} className="rounded-lg border border-surface-200 bg-surface-0 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-surface-900">{key.name}</p>
                <p className="mt-0.5 text-xs font-mono text-surface-500">{key.prefix}•••••••</p>
              </div>
              <Button
                variant="danger-ghost"
                size="sm"
                onClick={() => handleRevoke(key.id)}
                loading={revokeApiKey.isPending}
              >
                Revoke
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-surface-500">
              <span>Created {formatDate(key.createdAt)}</span>
              {key.lastUsedAt && <span>Last used {formatDate(key.lastUsedAt)}</span>}
              {key.expiresAt && <span>Expires {formatDate(key.expiresAt)}</span>}
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Key className="h-8 w-8 text-surface-300" />
          <p className="mt-2 text-sm text-surface-500">No API keys yet.</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit Log Tab
// ---------------------------------------------------------------------------

function AuditLogTab() {
  const [page, setPage] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: auditData, isLoading } = useAuditLog({
    page,
    perPage: 25,
    eventTypes: eventTypeFilter ? [eventTypeFilter] : undefined,
    search: search || undefined,
  });

  const entries = auditData?.data ?? [];
  const pagination = auditData?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search audit log..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-surface-200 bg-surface-0 py-2 pl-10 pr-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <select
          value={eventTypeFilter}
          onChange={(e) => {
            setEventTypeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none"
        >
          <option value="">All Event Types</option>
          <option value="assessment">Assessment</option>
          <option value="finding">Finding</option>
          <option value="risk">Risk</option>
          <option value="asset">Asset</option>
          <option value="user">User</option>
          <option value="system">System</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-surface-200 bg-surface-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Event Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Entity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-surface-100 last:border-0">
                    <td className="px-4 py-3 text-xs text-surface-500 whitespace-nowrap">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-600">{entry.userId ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-surface-600">{entry.eventType}</td>
                    <td className="px-4 py-3 text-xs text-surface-600">{entry.entityType}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
                          entry.action === 'create'
                            ? 'bg-green-100 text-green-700'
                            : entry.action === 'update'
                              ? 'bg-blue-100 text-blue-700'
                              : entry.action === 'delete'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-surface-100 text-surface-600',
                        )}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-500 max-w-xs truncate">
                      {entry.details ? JSON.stringify(entry.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-surface-500">
              <span>
                Showing {(pagination.page - 1) * pagination.perPage + 1}–
                {Math.min(pagination.page * pagination.perPage, pagination.total)} of{' '}
                {pagination.total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings Tab
// ---------------------------------------------------------------------------

function SettingsTab() {
  const { data: settings, isLoading } = useTenantSettings();
  const updateSettings = useUpdateTenantSettings();

  const [locale, setLocale] = useState('');
  const [timezone, setTimezone] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [passwordExpiryDays, setPasswordExpiryDays] = useState(0);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);
  const [initialized, setInitialized] = useState(false);

  // Sync form state when data loads
  if (settings && !initialized) {
    setLocale(settings.settings.locale);
    setTimezone(settings.settings.timezone);
    setMfaEnabled(settings.settings.mfaRequired);
    setPasswordExpiryDays(settings.settings.passwordExpiryDays);
    setSessionTimeoutMinutes(settings.settings.sessionTimeoutMinutes);
    setInitialized(true);
  }

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      locale,
      timezone,
      mfaRequired: mfaEnabled,
      passwordExpiryDays,
      sessionTimeoutMinutes,
    });
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tenant Info */}
      <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
        <h3 className="text-sm font-medium text-surface-700">Tenant Information</h3>
        <dl className="mt-4 space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-surface-500">Name</dt>
            <dd className="text-sm text-surface-900">{settings.name}</dd>
          </div>
          <Separator />
          <div className="flex justify-between">
            <dt className="text-sm text-surface-500">Slug</dt>
            <dd className="text-sm font-mono text-surface-900">{settings.slug}</dd>
          </div>
          <Separator />
          <div className="flex justify-between">
            <dt className="text-sm text-surface-500">Plan</dt>
            <dd className="text-sm text-surface-900 capitalize">{settings.plan}</dd>
          </div>
        </dl>
      </div>

      {/* Settings Form */}
      <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
        <h3 className="text-sm font-medium text-surface-700 mb-4">Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-surface-500 mb-1">Locale</label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full rounded-md border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="de-DE">German</option>
                <option value="fr-FR">French</option>
                <option value="ja-JP">Japanese</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-surface-500 mb-1">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-md border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/Berlin">Central European</option>
                <option value="Asia/Tokyo">Japan Standard</option>
              </select>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-surface-900">Multi-Factor Authentication</p>
              <p className="text-xs text-surface-500">Require MFA for all users in this tenant</p>
            </div>
            <button
              onClick={() => setMfaEnabled(!mfaEnabled)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                mfaEnabled ? 'bg-brand-600' : 'bg-surface-200',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  mfaEnabled ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-surface-500 mb-1">Password Expiry (days)</label>
              <Input
                type="number"
                value={passwordExpiryDays}
                onChange={(e) => setPasswordExpiryDays(Number(e.target.value))}
                min={0}
                className="w-full"
              />
              <p className="mt-1 text-xs text-surface-400">0 = never expires</p>
            </div>
            <div>
              <label className="block text-sm text-surface-500 mb-1">
                Session Timeout (minutes)
              </label>
              <Input
                type="number"
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                min={5}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={handleSave} loading={updateSettings.isPending}>
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
