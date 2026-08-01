import { eq, and, desc, count, ilike } from 'drizzle-orm';
import crypto from 'node:crypto';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { reports, auditEvents } from '@iec62443/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportFilters {
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface CreateReportInput {
  type: string;
  title?: string;
  config: {
    scope: string;
    scopeId?: string;
    dateRange?: { from?: string; to?: string };
    includeSections?: string[];
    format?: string;
  };
}

export interface ReportTemplateItem {
  id: string;
  name: string;
  description: string;
  type: string;
  isSystem: boolean;
  sections: string[];
}

// ---------------------------------------------------------------------------
// Audit hash chain helper
// ---------------------------------------------------------------------------

async function computeEventHash(
  data: string,
  previousHash: string | null,
): Promise<string> {
  const input = `${previousHash ?? ''}|${data}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ---------------------------------------------------------------------------
// Report Service
// ---------------------------------------------------------------------------

export class ReportService {
  constructor(
    private db: NodePgDatabase,
    private tenantId: string,
  ) {}

  async listReports(filters: ReportFilters) {
    const page = filters.page ?? 1;
    const perPage = Math.min(filters.perPage ?? 25, 100);
    const conditions = [];

    if (filters.type) {
      conditions.push(eq(reports.type, filters.type));
    }
    if (filters.status) {
      conditions.push(eq(reports.status, filters.status));
    }
    if (filters.search) {
      conditions.push(ilike(reports.title, `%${filters.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      this.db
        .select()
        .from(reports)
        .where(whereClause)
        .orderBy(desc(reports.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage),
      this.db
        .select({ count: count() })
        .from(reports)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      items: items.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        status: r.status,
        config: r.config,
        fileUrl: r.fileUrl,
        fileSize: r.fileSize,
        generatedBy: r.generatedBy,
        createdAt: r.createdAt.toISOString(),
        completedAt: r.completedAt?.toISOString() ?? null,
      })),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getReport(id: string) {
    const result = await this.db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);

    const row = result[0];
    if (!row) return null;

    return {
      id: row.id,
      type: row.type,
      title: row.title,
      status: row.status,
      config: row.config,
      fileUrl: row.fileUrl,
      fileSize: row.fileSize,
      generatedBy: row.generatedBy,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
    };
  }

  async createReport(data: CreateReportInput, userId: string) {
    const id = crypto.randomUUID();
    const title = data.title ?? this.getDefaultTitle(data.type);

    const config = {
      scope: data.config.scope,
      scopeId: data.config.scopeId ?? null,
      dateRange: data.config.dateRange?.from && data.config.dateRange?.to
        ? { from: data.config.dateRange.from, to: data.config.dateRange.to }
        : null,
      includeSections: data.config.includeSections ?? [],
      format: data.config.format ?? 'pdf',
    };

    await this.db.insert(reports).values({
      id,
      type: data.type,
      title,
      status: 'pending',
      config,
      generatedBy: userId,
    });

    await this.createAuditEvent({
      userId,
      eventType: 'report.created',
      entityType: 'report',
      entityId: id,
      action: 'create',
      details: { type: data.type, title, scope: data.config.scope },
    });

    const result = await this.getReport(id);
    return result;
  }

  async deleteReport(id: string, userId?: string) {
    const existing = await this.getReport(id);
    if (!existing) return false;

    await this.db.delete(reports).where(eq(reports.id, id));

    await this.createAuditEvent({
      userId: userId ?? 'system',
      eventType: 'report.deleted',
      entityType: 'report',
      entityId: id,
      action: 'delete',
      details: { type: existing.type, title: existing.title },
    });

    return true;
  }

  async updateReportStatus(id: string, status: string, fileUrl?: string, fileSize?: number) {
    const updates: Record<string, unknown> = { status };
    if (fileUrl) updates['fileUrl'] = fileUrl;
    if (fileSize !== undefined) updates['fileSize'] = fileSize;
    if (status === 'completed') updates['completedAt'] = new Date();

    await this.db
      .update(reports)
      .set(updates)
      .where(eq(reports.id, id));
  }

  getTemplates(): ReportTemplateItem[] {
    return [
      {
        id: 'tpl-assessment-summary',
        name: 'Assessment Summary',
        description: 'Comprehensive overview of assessment progress, scores, and findings.',
        type: 'assessment_summary',
        isSystem: true,
        sections: ['overview', 'scores', 'findings', 'recommendations'],
      },
      {
        id: 'tpl-risk-register',
        name: 'Risk Register',
        description: 'Complete risk register with heat map, treatments, and acceptances.',
        type: 'risk_register',
        isSystem: true,
        sections: ['summary', 'heat_map', 'entries', 'treatments', 'acceptances'],
      },
      {
        id: 'tpl-csms-gap',
        name: 'CSMS Gap Analysis',
        description: 'Gap analysis against IEC 62443 CSMS requirements.',
        type: 'csms_gap',
        isSystem: true,
        sections: ['framework', 'elements', 'policies', 'gaps', 'improvement_plans'],
      },
      {
        id: 'tpl-zone-topology',
        name: 'Zone Topology',
        description: 'Zone and conduit topology with segmentation rule compliance.',
        type: 'zone_topology',
        isSystem: true,
        sections: ['topology', 'zones', 'conduits', 'rules', 'compliance'],
      },
      {
        id: 'tpl-purdue-compliance',
        name: 'Purdue Model Compliance',
        description: 'Purdue model compliance assessment and communication rules.',
        type: 'purdue_compliance',
        isSystem: true,
        sections: ['model', 'levels', 'mappings', 'rules', 'violations'],
      },
      {
        id: 'tpl-remediation-status',
        name: 'Remediation Status',
        description: 'Remediation plan status with action tracking and verification.',
        type: 'remediation_status',
        isSystem: true,
        sections: ['summary', 'actions', 'timeline', 'verifications'],
      },
      {
        id: 'tpl-executive',
        name: 'Executive Summary',
        description: 'High-level executive summary of security posture and key metrics.',
        type: 'executive',
        isSystem: true,
        sections: ['score', 'findings', 'risks', 'remediation', 'trends'],
      },
      {
        id: 'tpl-audit-trail',
        name: 'Audit Trail',
        description: 'Complete audit trail of system events and changes.',
        type: 'audit_trail',
        isSystem: true,
        sections: ['events', 'users', 'changes', 'timeline'],
      },
      {
        id: 'tpl-certification-evidence',
        name: 'Certification Evidence',
        description: 'Compiled evidence package for IEC 62443 certification.',
        type: 'certification_evidence',
        isSystem: true,
        sections: ['requirements', 'evidence', 'chain_of_custody', 'gaps'],
      },
    ];
  }

  private getDefaultTitle(type: string): string {
    const titles: Record<string, string> = {
      assessment_summary: 'Assessment Summary Report',
      risk_register: 'Risk Register Report',
      csms_gap: 'CSMS Gap Analysis Report',
      zone_topology: 'Zone Topology Report',
      purdue_compliance: 'Purdue Model Compliance Report',
      remediation_status: 'Remediation Status Report',
      executive: 'Executive Summary Report',
      audit_trail: 'Audit Trail Report',
      certification_evidence: 'Certification Evidence Report',
      custom: 'Custom Report',
    };
    return titles[type] ?? 'Report';
  }

  private async createAuditEvent(params: {
    userId: string;
    eventType: string;
    entityType: string;
    entityId: string;
    action: 'create' | 'update' | 'delete' | 'read';
    details: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    try {
      const [lastEvent] = await this.db
        .select({ eventHash: auditEvents.eventHash })
        .from(auditEvents)
        .where(eq(auditEvents.tenantId, this.tenantId))
        .orderBy(desc(auditEvents.id))
        .limit(1);

      const previousHash = lastEvent?.eventHash ?? null;

      const dataToHash = JSON.stringify({
        userId: params.userId,
        eventType: params.eventType,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        details: params.details,
        timestamp: new Date().toISOString(),
      });
      const eventHash = await computeEventHash(dataToHash, previousHash);

      await this.db.insert(auditEvents).values({
        tenantId: this.tenantId,
        userId: params.userId,
        eventType: params.eventType,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        details: params.details,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        previousHash,
        eventHash,
      });
    } catch (error) {
      console.error('Failed to create audit event:', error);
    }
  }
}
