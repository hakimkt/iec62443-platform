'use client';

import type { EvidenceType } from '@iec62443/shared-types';
import { Button, Input, Label, Separator, Textarea } from '@iec62443/ui/primitives';
import { ArrowLeft, Clock, Link2, Shield, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import {
  useChainOfCustody,
  useDeleteEvidence,
  useEvidenceItem,
  useEvidenceLinks,
  useUpdateEvidence,
} from '@/hooks/useEvidence';

const typeLabels: Record<EvidenceType, string> = {
  document: 'Document',
  screenshot: 'Screenshot',
  config: 'Configuration',
  log: 'Log File',
  scan_result: 'Scan Result',
  network_capture: 'Network Capture',
  certificate: 'Certificate',
  interview: 'Interview',
  other: 'Other',
};

type TabKey = 'details' | 'links' | 'custody';

export default function EvidenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: evidenceId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');

  const { data: item, isLoading } = useEvidenceItem(evidenceId);
  const { data: links } = useEvidenceLinks(evidenceId);
  const { data: custody } = useChainOfCustody(evidenceId);
  const updateEvidence = useUpdateEvidence();
  const deleteEvidence = useDeleteEvidence();

  const handleEdit = () => {
    if (!item) return;
    setEditTitle(item.title);
    setEditDescription(item.description ?? '');
    setEditTags(item.tags.join(', '));
    setIsEditing(true);
  };

  const handleSave = async () => {
    await updateEvidence.mutateAsync({
      id: evidenceId,
      title: editTitle,
      description: editDescription || undefined,
      tags: editTags
        ? editTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteEvidence.mutateAsync(evidenceId);
    router.push('/evidence');
  };

  if (isLoading || !item) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/evidence"
            className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Evidence Repository
          </Link>
          <h1 className="text-xl font-semibold text-surface-900">{item.title}</h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              {typeLabels[item.evidenceType] ?? item.evidenceType}
            </span>
            {item.sha256Hash !== null && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Shield className="h-3 w-3" />
                Hash Verified
              </span>
            )}
            {item.fileName && <span className="text-xs text-surface-400">{item.fileName}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} loading={updateEvidence.isPending}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleEdit}>
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={deleteEvidence.isPending}
                icon={Trash2}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-6" role="tablist" aria-label="Evidence sections">
          {[
            { key: 'details' as TabKey, label: 'Details', icon: null },
            { key: 'links' as TabKey, label: 'Links', icon: Link2 },
            { key: 'custody' as TabKey, label: 'Chain of Custody', icon: Clock },
          ].map((tab) => (
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
              {tab.icon && <tab.icon className="h-4 w-4" />}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Details tab */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <h3 className="text-sm font-medium text-surface-700">Evidence Information</h3>
            {isEditing ? (
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Tags (comma-separated)</Label>
                  <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} />
                </div>
              </div>
            ) : (
              <dl className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Title</dt>
                  <dd className="text-sm text-surface-900">{item.title}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Description</dt>
                  <dd className="text-sm text-surface-900">{item.description || '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Type</dt>
                  <dd className="text-sm text-surface-900">
                    {typeLabels[item.evidenceType] ?? item.evidenceType}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Collected</dt>
                  <dd className="text-sm text-surface-900">
                    {new Date(item.collectedAt).toLocaleDateString()}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Retention Until</dt>
                  <dd className="text-sm text-surface-900">
                    {item.retentionUntil ? new Date(item.retentionUntil).toLocaleDateString() : '—'}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <h3 className="text-sm font-medium text-surface-700">File & Integrity</h3>
            <dl className="mt-4 space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">File Name</dt>
                <dd className="text-sm text-surface-900">{item.fileName || '—'}</dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">File Size</dt>
                <dd className="text-sm text-surface-900">
                  {item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : '—'}
                </dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">MIME Type</dt>
                <dd className="text-sm text-surface-900">{item.mimeType || '—'}</dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">SHA-256</dt>
                <dd className="max-w-64 truncate text-xs font-mono text-surface-900">
                  {item.sha256Hash ?? '—'}
                </dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">MD5</dt>
                <dd className="max-w-64 truncate text-xs font-mono text-surface-900">
                  {item.md5Hash || '—'}
                </dd>
              </div>
            </dl>
            {item.tags.length > 0 && (
              <>
                <Separator className="my-4" />
                <h3 className="text-sm font-medium text-surface-700">Tags</h3>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Links tab */}
      {activeTab === 'links' && (
        <div className="space-y-3">
          {links && links.length > 0 ? (
            links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-4 rounded-lg border border-surface-200 bg-surface-0 p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100">
                  <Link2 className="h-4 w-4 text-surface-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-700 capitalize">
                    {link.entityType.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-surface-400 font-mono">{link.entityId}</p>
                </div>
                <span className="text-xs text-surface-400">
                  {new Date(link.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-surface-500">
              No entities linked to this evidence.
            </p>
          )}
        </div>
      )}

      {/* Chain of custody tab */}
      {activeTab === 'custody' && (
        <div className="space-y-3">
          {custody && custody.length > 0 ? (
            custody.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 rounded-lg border border-surface-200 bg-surface-0 p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100">
                  <Clock className="h-4 w-4 text-surface-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-700 capitalize">
                    {event.eventType.replace(/_/g, ' ')}
                  </p>
                  {event.details && (
                    <p className="mt-1 text-xs text-surface-500">{event.details as string}</p>
                  )}
                </div>
                <span className="text-xs text-surface-400">
                  {new Date(event.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-surface-500">
              No chain of custody events recorded.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
