import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Layers,
  LayoutDashboard,
  Network,
  Paperclip,
  Server,
  Settings,
  Shield,
  Target,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'info' | 'warning' | 'danger';
  requiredPermission?: string;
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: 'Engagement',
    items: [
      {
        key: 'assessments',
        label: 'Assessments',
        href: '/assessments',
        icon: ClipboardCheck,
        requiredPermission: 'assessment:read',
      },
      {
        key: 'assets',
        label: 'Assets',
        href: '/assets',
        icon: Server,
        requiredPermission: 'asset:read',
      },
      {
        key: 'purdue',
        label: 'Purdue Model',
        href: '/purdue',
        icon: Layers,
        requiredPermission: 'purdue:read',
      },
      {
        key: 'zones',
        label: 'Zones & Conduits',
        href: '/zones',
        icon: Network,
        requiredPermission: 'zone:read',
      },
    ],
  },
  {
    label: 'Analysis',
    items: [
      {
        key: 'findings',
        label: 'Findings',
        href: '/findings',
        icon: AlertTriangle,
        requiredPermission: 'finding:read',
      },
      {
        key: 'risks',
        label: 'Risk Register',
        href: '/risks',
        icon: Target,
        requiredPermission: 'risk:read',
      },
      {
        key: 'evidence',
        label: 'Evidence',
        href: '/evidence',
        icon: Paperclip,
        requiredPermission: 'evidence:read',
      },
      {
        key: 'remediation',
        label: 'Remediation',
        href: '/remediation',
        icon: Wrench,
        requiredPermission: 'remediation:read',
      },
      {
        key: 'csms',
        label: 'CSMS',
        href: '/csms',
        icon: Shield,
        requiredPermission: 'csms:read',
      },
    ],
  },
  {
    label: 'Output',
    items: [
      {
        key: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: FileText,
        requiredPermission: 'report:read',
      },
    ],
  },
  {
    label: 'Admin',
    items: [
      {
        key: 'admin',
        label: 'Administration',
        href: '/admin',
        icon: Settings,
        requiredPermission: 'admin:read',
      },
    ],
  },
];

export function filterNavByPermissions(
  sections: NavSection[],
  permissions: Set<string>,
  isAdmin: boolean,
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (isAdmin) return true;
        if (!item.requiredPermission) return true;
        return permissions.has(item.requiredPermission);
      }),
    }))
    .filter((section) => section.items.length > 0);
}
