import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export const queryKeys = {
  assessments: {
    all: ['assessments'] as const,
    lists: () => [...queryKeys.assessments.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.assessments.lists(), filters] as const,
    details: () => [...queryKeys.assessments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.assessments.details(), id] as const,
    scorecard: (id: string) => [...queryKeys.assessments.detail(id), 'scorecard'] as const,
    questions: (id: string) => [...queryKeys.assessments.detail(id), 'questions'] as const,
  },
  findings: {
    all: ['findings'] as const,
    lists: () => [...queryKeys.findings.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.findings.lists(), filters] as const,
    details: () => [...queryKeys.findings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.findings.details(), id] as const,
    history: (id: string) => [...queryKeys.findings.detail(id), 'history'] as const,
    comments: (id: string) => [...queryKeys.findings.detail(id), 'comments'] as const,
  },
  risks: {
    all: ['risks'] as const,
    lists: () => [...queryKeys.risks.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.risks.lists(), filters] as const,
    details: () => [...queryKeys.risks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.risks.details(), id] as const,
    stats: () => [...queryKeys.risks.all, 'stats'] as const,
    heatmap: (registerId: string) => [...queryKeys.risks.all, 'heatmap', registerId] as const,
    matrix: (registerId: string) => [...queryKeys.risks.all, 'matrix', registerId] as const,
    treatments: (riskId: string) => [...queryKeys.risks.detail(riskId), 'treatments'] as const,
    acceptances: (riskId: string) => [...queryKeys.risks.detail(riskId), 'acceptances'] as const,
    registers: {
      all: ['risk-registers'] as const,
      lists: () => [...queryKeys.risks.registers.all, 'list'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.risks.registers.lists(), filters] as const,
      details: () => [...queryKeys.risks.registers.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.risks.registers.details(), id] as const,
    },
  },
  zones: {
    all: ['zones'] as const,
    lists: () => [...queryKeys.zones.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.zones.lists(), filters] as const,
    details: () => [...queryKeys.zones.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.zones.details(), id] as const,
    memberships: (zoneId: string) => [...queryKeys.zones.detail(zoneId), 'memberships'] as const,
    rules: (zoneId: string) => [...queryKeys.zones.detail(zoneId), 'rules'] as const,
    topology: () => [...queryKeys.zones.all, 'topology'] as const,
    conduits: {
      all: ['conduits'] as const,
      lists: () => [...queryKeys.zones.conduits.all, 'list'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.zones.conduits.lists(), filters] as const,
      detail: (id: string) => [...queryKeys.zones.conduits.all, 'detail', id] as const,
    },
  },
  purdue: {
    all: ['purdue'] as const,
    lists: () => [...queryKeys.purdue.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.purdue.lists(), filters] as const,
    details: () => [...queryKeys.purdue.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.purdue.details(), id] as const,
    levels: (modelId: string) => [...queryKeys.purdue.detail(modelId), 'levels'] as const,
    mappings: (modelId: string) => [...queryKeys.purdue.detail(modelId), 'mappings'] as const,
    rules: (modelId: string) => [...queryKeys.purdue.detail(modelId), 'rules'] as const,
    compliance: (modelId: string) => [...queryKeys.purdue.detail(modelId), 'compliance'] as const,
  },
  assets: {
    all: ['assets'] as const,
    lists: () => [...queryKeys.assets.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.assets.lists(), filters] as const,
    details: () => [...queryKeys.assets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.assets.details(), id] as const,
    stats: () => [...queryKeys.assets.all, 'stats'] as const,
    relationships: (id: string) => [...queryKeys.assets.detail(id), 'relationships'] as const,
  },
  evidence: {
    all: ['evidence'] as const,
    lists: () => [...queryKeys.evidence.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.evidence.lists(), filters] as const,
    details: () => [...queryKeys.evidence.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.evidence.details(), id] as const,
    links: (id: string) => [...queryKeys.evidence.detail(id), 'links'] as const,
    custody: (id: string) => [...queryKeys.evidence.detail(id), 'custody'] as const,
    verify: (id: string) => [...queryKeys.evidence.detail(id), 'verify'] as const,
    storage: () => [...queryKeys.evidence.all, 'storage'] as const,
  },
  reports: {
    all: ['reports'] as const,
    lists: () => [...queryKeys.reports.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.reports.lists(), filters] as const,
    details: () => [...queryKeys.reports.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reports.details(), id] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
    riskHeatMap: () => [...queryKeys.dashboard.all, 'risk-heatmap'] as const,
  },
  currentUser: {
    all: ['currentUser'] as const,
    profile: () => [...queryKeys.currentUser.all, 'profile'] as const,
    tenants: () => [...queryKeys.currentUser.all, 'tenants'] as const,
  },
  remediation: {
    all: ['remediation'] as const,
    plans: {
      all: ['remediation', 'plans'] as const,
      lists: () => [...queryKeys.remediation.plans.all, 'list'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.remediation.plans.lists(), filters] as const,
      details: () => [...queryKeys.remediation.plans.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.remediation.plans.details(), id] as const,
    },
    actions: {
      all: ['remediation', 'actions'] as const,
      lists: () => [...queryKeys.remediation.actions.all, 'list'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.remediation.actions.lists(), filters] as const,
      details: () => [...queryKeys.remediation.actions.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.remediation.actions.details(), id] as const,
    },
  },
  csms: {
    all: ['csms'] as const,
    frameworks: {
      all: ['csms', 'frameworks'] as const,
      lists: () => [...queryKeys.csms.frameworks.all, 'list'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.csms.frameworks.lists(), filters] as const,
      details: () => [...queryKeys.csms.frameworks.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.csms.frameworks.details(), id] as const,
      elements: (frameworkId: string) =>
        [...queryKeys.csms.frameworks.detail(frameworkId), 'elements'] as const,
      policies: (frameworkId: string) =>
        [...queryKeys.csms.frameworks.detail(frameworkId), 'policies'] as const,
      improvementPlans: (frameworkId: string) =>
        [...queryKeys.csms.frameworks.detail(frameworkId), 'improvement-plans'] as const,
      gapAnalysis: (frameworkId: string) =>
        [...queryKeys.csms.frameworks.detail(frameworkId), 'gap-analysis'] as const,
    },
    elements: {
      all: ['csms', 'elements'] as const,
      lists: () => [...queryKeys.csms.elements.all, 'list'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.csms.elements.lists(), filters] as const,
      details: () => [...queryKeys.csms.elements.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.csms.elements.details(), id] as const,
    },
    policies: {
      all: ['csms', 'policies'] as const,
      lists: () => [...queryKeys.csms.policies.all, 'list'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.csms.policies.lists(), filters] as const,
      details: () => [...queryKeys.csms.policies.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.csms.policies.details(), id] as const,
    },
  },
  admin: {
    all: ['admin'] as const,
    members: {
      all: ['admin', 'members'] as const,
      lists: () => [...queryKeys.admin.members.all, 'list'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.admin.members.lists(), filters] as const,
    },
    roles: {
      all: ['admin', 'roles'] as const,
      lists: () => [...queryKeys.admin.roles.all, 'list'] as const,
    },
    apiKeys: {
      all: ['admin', 'api-keys'] as const,
      lists: () => [...queryKeys.admin.apiKeys.all, 'list'] as const,
    },
    auditLog: {
      all: ['admin', 'audit-log'] as const,
      list: (filters: Record<string, unknown>) =>
        [...queryKeys.admin.auditLog.all, 'list', filters] as const,
    },
    settings: {
      all: ['admin', 'settings'] as const,
      detail: () => [...queryKeys.admin.settings.all, 'detail'] as const,
    },
  },
} as const;
