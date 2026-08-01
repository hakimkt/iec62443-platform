/**
 * IEC 62443 Evidence Domain Types
 *
 * Covers evidence items, file storage, evidence linking, chain of
 * custody, and storage quotas.
 */

type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// Evidence Item
// ---------------------------------------------------------------------------

/** Classification of evidence types. */
export type EvidenceType =
  | 'document'
  | 'screenshot'
  | 'config'
  | 'log'
  | 'scan_result'
  | 'network_capture'
  | 'certificate'
  | 'interview'
  | 'other';

/** Lifecycle status of an evidence item. */
export type EvidenceItemStatus = 'active' | 'archived' | 'superseded';

/**
 * A single piece of evidence collected to support an assessment response,
 * finding, or CSMS element.
 */
export interface EvidenceItem {
  id: UUID;
  title: string;
  description: string;
  evidenceType: EvidenceType;
  /** Lifecycle status: active, archived (soft-deleted), or superseded. */
  status: EvidenceItemStatus;
  /** Reference to the stored file (if applicable). */
  fileId: UUID | null;
  /** Original file name. */
  fileName: string | null;
  /** File size in bytes. */
  fileSize: number | null;
  /** MIME type of the file. */
  mimeType: string | null;
  /** SHA-256 hash of the file for integrity verification. Null for metadata-only items. */
  sha256Hash: string | null;
  /** MD5 hash of the file (legacy compatibility). */
  md5Hash: string | null;
  collectedBy: UUID;
  collectedAt: string;
  /** Retention expiry date for compliance. */
  retentionUntil: string | null;
  /** Free-form tags for categorisation and search. */
  tags: string[];
  metadata: Record<string, unknown>;
  /** Timestamp when the item was soft-deleted. */
  deletedAt: string | null;
  /** User who soft-deleted the item. */
  deletedBy: UUID | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Evidence File
// ---------------------------------------------------------------------------

/**
 * Metadata for a file stored in the evidence storage backend.
 */
export interface EvidenceFile {
  id: UUID;
  /** Storage backend (currently only S3-compatible). */
  storageBackend: 's3';
  /** Object key within the storage bucket. */
  storageKey: string;
  /** Storage bucket name. */
  bucket: string;
  /** KMS key ID used for server-side encryption. */
  encryptionKeyId: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Evidence Link
// ---------------------------------------------------------------------------

/** Entity types that can be linked to evidence. */
export type EvidenceEntityType = 'finding' | 'assessment' | 'risk' | 'csms_element';

/**
 * A link between an evidence item and a domain entity (finding,
 * assessment, risk, or CSMS element).
 */
export interface EvidenceLink {
  id: UUID;
  evidenceId: UUID;
  entityType: EvidenceEntityType;
  entityId: UUID;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Chain of Custody
// ---------------------------------------------------------------------------

/** Types of chain-of-custody events. */
export type CustodyEventType =
  | 'created'
  | 'accessed'
  | 'downloaded'
  | 'transferred'
  | 'verified'
  | 'modified'
  | 'deleted'
  | 'linked'
  | 'unlinked';

/**
 * A single event in the chain-of-custody audit trail for an evidence
 * item, ensuring integrity and non-repudiation.
 */
export interface ChainOfCustodyEvent {
  id: UUID;
  evidenceId: UUID;
  eventType: CustodyEventType;
  userId: UUID;
  /** Human-readable details about the event. */
  details: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Storage Quota
// ---------------------------------------------------------------------------

/**
 * Storage quota information for a tenant's evidence storage.
 */
export interface StorageQuota {
  /** Total storage quota in bytes. */
  quotaBytes: number;
  /** Storage used in bytes. */
  usedBytes: number;
  /** Usage percentage (0–100). */
  usagePct: number;
}
