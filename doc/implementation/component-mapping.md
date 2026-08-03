# Implementation Blueprint — Component Mapping

> Version: 1.0 | Status: Draft | Last Updated: 2026-08-01
> Maps every UI component from the design system to its implementation file path

---

## 1. Primitives (packages/ui/src/primitives/)

Radix UI wrappers with design tokens applied. No domain logic.

| Design Component | Implementation File           | Radix Primitive                 | Notes                            |
| ---------------- | ----------------------------- | ------------------------------- | -------------------------------- |
| Button           | `primitives/Button.tsx`       | —                               | Custom, 6 variants               |
| Input            | `primitives/Input.tsx`        | —                               | Custom, with prefix/suffix slots |
| Textarea         | `primitives/Textarea.tsx`     | —                               | Custom                           |
| Select           | `primitives/Select.tsx`       | `@radix-ui/react-select`        | Single + multi-select            |
| Checkbox         | `primitives/Checkbox.tsx`     | `@radix-ui/react-checkbox`      |                                  |
| RadioGroup       | `primitives/RadioGroup.tsx`   | `@radix-ui/react-radio-group`   |                                  |
| Switch           | `primitives/Switch.tsx`       | `@radix-ui/react-switch`        |                                  |
| Dialog           | `primitives/Dialog.tsx`       | `@radix-ui/react-dialog`        | sm/md/lg/xl sizes                |
| DropdownMenu     | `primitives/DropdownMenu.tsx` | `@radix-ui/react-dropdown-menu` |                                  |
| Popover          | `primitives/Popover.tsx`      | `@radix-ui/react-popover`       |                                  |
| Tooltip          | `primitives/Tooltip.tsx`      | `@radix-ui/react-tooltip`       | Standard + rich tooltip          |
| Tabs             | `primitives/Tabs.tsx`         | `@radix-ui/react-tabs`          | Horizontal + vertical            |
| Accordion        | `primitives/Accordion.tsx`    | `@radix-ui/react-accordion`     |                                  |
| Avatar           | `primitives/Avatar.tsx`       | `@radix-ui/react-avatar`        | With fallback initials           |
| Badge            | `primitives/Badge.tsx`        | —                               | Custom, multiple variants        |
| Separator        | `primitives/Separator.tsx`    | `@radix-ui/react-separator`     |                                  |
| ScrollArea       | `primitives/ScrollArea.tsx`   | `@radix-ui/react-scroll-area`   |                                  |
| Skeleton         | `primitives/Skeleton.tsx`     | —                               | Custom, pulse animation          |
| Label            | `primitives/Label.tsx`        | `@radix-ui/react-label`         |                                  |
| Slider           | `primitives/Slider.tsx`       | `@radix-ui/react-slider`        | For scoring inputs               |
| ProgressBar      | `primitives/ProgressBar.tsx`  | `@radix-ui/react-progress`      |                                  |
| Toast            | `primitives/Toast.tsx`        | `@radix-ui/react-toast`         | Via Sonner                       |

---

## 2. Composed Components (packages/ui/src/components/)

Reusable patterns combining primitives. Light domain awareness.

| Design Component   | Implementation File                 | Used In                      |
| ------------------ | ----------------------------------- | ---------------------------- |
| DataTable          | `components/DataTable.tsx`          | Every list page              |
| DataCard           | `components/DataCard.tsx`           | Assessment cards, plan cards |
| MetricCard         | `components/MetricCard.tsx`         | Dashboard KPI row            |
| StatusBadge        | `components/StatusBadge.tsx`        | All entity status indicators |
| SeverityBadge      | `components/SeverityBadge.tsx`      | Findings, risks              |
| SecurityLevelBadge | `components/SecurityLevelBadge.tsx` | Assessments, zones           |
| PurdueLevelBadge   | `components/PurdueLevelBadge.tsx`   | Assets, zones, Purdue        |
| FilterBar          | `components/FilterBar.tsx`          | Every list page              |
| SearchInput        | `components/SearchInput.tsx`        | Filter bars, standalone      |
| PageHeader         | `components/PageHeader.tsx`         | Every page                   |
| Breadcrumb         | `components/Breadcrumb.tsx`         | Top bar                      |
| Pagination         | `components/Pagination.tsx`         | Every table/grid             |
| EmptyState         | `components/EmptyState.tsx`         | Every list when empty        |
| ContextPanel       | `components/ContextPanel.tsx`       | Findings, risks, assets      |
| NotificationToast  | `components/NotificationToast.tsx`  | Global toast system          |
| FileUpload         | `components/FileUpload.tsx`         | Evidence upload, import      |
| CommandPalette     | `components/CommandPalette.tsx`     | Global Cmd+K                 |
| OfflineIndicator   | `components/OfflineIndicator.tsx`   | Top bar                      |
| ConfirmDialog      | `components/ConfirmDialog.tsx`      | Delete, destructive actions  |
| FormField          | `components/FormField.tsx`          | All forms                    |
| FormGroup          | `components/FormGroup.tsx`          | All forms                    |
| FormWizard         | `components/FormWizard.tsx`         | Assessment creation, import  |
| DateRangePicker    | `components/DateRangePicker.tsx`    | Filters, report config       |
| TagInput           | `components/TagInput.tsx`           | Evidence tags, finding tags  |
| UserAvatar         | `components/UserAvatar.tsx`         | User columns, comments       |
| EntityLink         | `components/EntityLink.tsx`         | Cross-entity navigation      |
| CopyButton         | `components/CopyButton.tsx`         | Hash display, API keys       |
| RelativeTime       | `components/RelativeTime.tsx`       | Timestamps everywhere        |
| IconBadge          | `components/IconBadge.tsx`          | Asset type icons in tables   |

---

## 3. Chart Components (packages/ui/src/charts/)

| Design Component | Implementation File          | Library               | Used In                                 |
| ---------------- | ---------------------------- | --------------------- | --------------------------------------- |
| RiskHeatMap      | `charts/RiskHeatMap.tsx`     | Custom CSS Grid       | Risk register, dashboard                |
| RadarChart       | `charts/RadarChart.tsx`      | Recharts              | Assessment scorecard                    |
| LineChart        | `charts/LineChart.tsx`       | Recharts              | Risk trends, compliance trends          |
| BarChart         | `charts/BarChart.tsx`        | Recharts              | Risk distribution, findings by category |
| StackedBarChart  | `charts/StackedBarChart.tsx` | Recharts              | Remediation completion                  |
| GaugeChart       | `charts/GaugeChart.tsx`      | Recharts RadialBar    | Security score                          |
| DonutChart       | `charts/DonutChart.tsx`      | Recharts PieChart     | Budget tracking                         |
| Sparkline        | `charts/Sparkline.tsx`       | Recharts LineChart    | MetricCard trends                       |
| TrendArrow       | `charts/TrendArrow.tsx`      | Custom SVG            | MetricCard direction                    |
| GanttChart       | `charts/GanttChart.tsx`      | Custom SVG + date-fns | Remediation timeline                    |

---

## 4. Diagram Components (packages/ui/src/diagrams/)

| Design Component   | Implementation File               | Library               | Used In              |
| ------------------ | --------------------------------- | --------------------- | -------------------- |
| ZoneTopology       | `diagrams/ZoneTopology.tsx`       | ReactFlow             | Zone designer        |
| ZoneNode           | `diagrams/ZoneNode.tsx`           | ReactFlow custom node | Zone designer        |
| ConduitEdge        | `diagrams/ConduitEdge.tsx`        | ReactFlow custom edge | Zone designer        |
| SubZoneNode        | `diagrams/SubZoneNode.tsx`        | ReactFlow custom node | Nested zones         |
| PurdueModel        | `diagrams/PurdueModel.tsx`        | ReactFlow             | Purdue visualization |
| PurdueLevelBand    | `diagrams/PurdueLevelBand.tsx`    | ReactFlow custom node | Purdue levels        |
| AssetChip          | `diagrams/AssetChip.tsx`          | ReactFlow custom node | Assets in diagrams   |
| CommunicationArrow | `diagrams/CommunicationArrow.tsx` | ReactFlow custom edge | Purdue comm rules    |

---

## 5. Feature Components (apps/web/src/components/)

Page-specific components that connect to data and compose Layer 1+2.

### 5.1 Dashboard

| Screen Element              | Implementation File                                  | Data Source                |
| --------------------------- | ---------------------------------------------------- | -------------------------- |
| Dashboard Grid Layout       | `components/dashboard/DashboardGrid.tsx`             | —                          |
| Security Score Card         | `components/dashboard/SecurityScoreCard.tsx`         | `useDashboardSummary()`    |
| Findings Summary Card       | `components/dashboard/FindingsSummaryCard.tsx`       | `useDashboardSummary()`    |
| Risks Summary Card          | `components/dashboard/RisksSummaryCard.tsx`          | `useDashboardSummary()`    |
| Remediation Summary Card    | `components/dashboard/RemediationSummaryCard.tsx`    | `useDashboardSummary()`    |
| SL Radar Widget             | `components/dashboard/ScorecardRadarWidget.tsx`      | `useAssessmentScorecard()` |
| Assessment Progress List    | `components/dashboard/AssessmentProgressList.tsx`    | `useAssessments()`         |
| Risk Heat Map Widget        | `components/dashboard/RiskHeatMapWidget.tsx`         | `useRiskHeatmap()`         |
| Recent Findings List        | `components/dashboard/RecentFindingsList.tsx`        | `useFindings()`            |
| Remediation Timeline Widget | `components/dashboard/RemediationTimelineWidget.tsx` | `useRemediationTimeline()` |

### 5.2 Assessment

| Screen Element             | Implementation File                           | Data Source                |
| -------------------------- | --------------------------------------------- | -------------------------- |
| Assessment Card            | `components/assessment/AssessmentCard.tsx`    | Props                      |
| Assessment Table           | `components/assessment/AssessmentTable.tsx`   | `useAssessments()`         |
| Assessment Creation Wizard | `components/assessment/AssessmentWizard.tsx`  | `useCreateAssessment()`    |
| Template Selector          | `components/assessment/TemplateSelector.tsx`  | `useAssessmentTemplates()` |
| Question Navigator         | `components/assessment/QuestionNavigator.tsx` | `useAssessmentQuestions()` |
| Question Response Card     | `components/assessment/QuestionCard.tsx`      | `useAssessmentQuestions()` |
| Scorecard Radar Chart      | `components/assessment/ScorecardRadar.tsx`    | `useAssessmentScorecard()` |
| Scorecard Gap Table        | `components/assessment/ScorecardTable.tsx`    | `useAssessmentScorecard()` |
| Assessment Summary Tab     | `components/assessment/AssessmentSummary.tsx` | `useAssessment()`          |

### 5.3 Requirements

| Screen Element           | Implementation File                             | Data Source              |
| ------------------------ | ----------------------------------------------- | ------------------------ |
| Requirement Part Tabs    | `components/requirements/PartTabs.tsx`          | Static data              |
| Requirement Tree         | `components/requirements/RequirementTree.tsx`   | `useRequirements()`      |
| Requirement Detail Panel | `components/requirements/RequirementDetail.tsx` | `useRequirement()`       |
| Requirement Search       | `components/requirements/RequirementSearch.tsx` | `useRequirementSearch()` |

### 5.4 Risk

| Screen Element          | Implementation File                         | Data Source                 |
| ----------------------- | ------------------------------------------- | --------------------------- |
| Risk Matrix View        | `components/risk/RiskMatrixView.tsx`        | `useRiskHeatmap()`          |
| Risk Table              | `components/risk/RiskTable.tsx`             | `useRisks()`                |
| Risk Detail Panel       | `components/risk/RiskDetailPanel.tsx`       | `useRisk()`                 |
| Risk Scoring Form       | `components/risk/RiskScoringForm.tsx`       | Local state                 |
| Risk Distribution Chart | `components/risk/RiskDistributionChart.tsx` | `useRiskDistribution()`     |
| Risk Trend Chart        | `components/risk/RiskTrendChart.tsx`        | `useRiskTrend()`            |
| Treatment List          | `components/risk/TreatmentList.tsx`         | `useRiskTreatments()`       |
| Risk Acceptance Form    | `components/risk/RiskAcceptanceForm.tsx`    | `useSubmitRiskAcceptance()` |
| Top Risks List          | `components/risk/TopRisksList.tsx`          | `useRisks()`                |

### 5.5 Finding

| Screen Element              | Implementation File                              | Data Source               |
| --------------------------- | ------------------------------------------------ | ------------------------- |
| Finding Table               | `components/finding/FindingTable.tsx`            | `useFindings()`           |
| Finding Detail Panel        | `components/finding/FindingDetailPanel.tsx`      | `useFinding()`            |
| Finding Create/Edit Form    | `components/finding/FindingForm.tsx`             | `useCreateFinding()`      |
| Finding Status Transition   | `components/finding/FindingStatusTransition.tsx` | `useTransitionFinding()`  |
| Finding Comments            | `components/finding/FindingComments.tsx`         | `useFindingComments()`    |
| Finding Bulk Import         | `components/finding/FindingBulkImport.tsx`       | `useBulkImportFindings()` |
| Finding Severity Summary    | `components/finding/SeveritySummaryStrip.tsx`    | `useFindings()`           |
| Recent Findings (dashboard) | `components/finding/RecentFindingsList.tsx`      | `useFindings()`           |

### 5.6 Zone & Conduit

| Screen Element           | Implementation File                          | Data Source              |
| ------------------------ | -------------------------------------------- | ------------------------ |
| Zone Topology Designer   | `components/zone/ZoneTopologyDesigner.tsx`   | `useZoneTopology()`      |
| Zone Properties Panel    | `components/zone/ZonePropertiesPanel.tsx`    | `useZone()`              |
| Zone Card                | `components/zone/ZoneCard.tsx`               | Props                    |
| Zone List Table          | `components/zone/ZoneTable.tsx`              | `useZones()`             |
| Conduit List             | `components/zone/ConduitList.tsx`            | `useConduits()`          |
| Conduit Detail Panel     | `components/zone/ConduitDetailPanel.tsx`     | `useConduit()`           |
| Segmentation Rules Table | `components/zone/SegmentationRulesTable.tsx` | `useSegmentationRules()` |

### 5.7 Purdue Model

| Screen Element            | Implementation File                             | Data Source             |
| ------------------------- | ----------------------------------------------- | ----------------------- |
| Purdue Model Diagram      | `components/purdue/PurdueModelDiagram.tsx`      | `usePurdueModel()`      |
| Communication Rules Table | `components/purdue/CommunicationRulesTable.tsx` | `usePurdueRules()`      |
| Purdue Compliance Summary | `components/purdue/PurdueComplianceSummary.tsx` | `usePurdueCompliance()` |

### 5.8 Asset

| Screen Element         | Implementation File                      | Data Source            |
| ---------------------- | ---------------------------------------- | ---------------------- |
| Asset Table            | `components/asset/AssetTable.tsx`        | `useAssets()`          |
| Asset Detail Panel     | `components/asset/AssetDetailPanel.tsx`  | `useAsset()`           |
| Asset Create/Edit Form | `components/asset/AssetForm.tsx`         | `useCreateAsset()`     |
| Asset Import Wizard    | `components/asset/AssetImportWizard.tsx` | `useImportAssets()`    |
| Asset Stats Row        | `components/asset/AssetStatsRow.tsx`     | `useAssetStats()`      |
| Asset Type Icon        | `components/asset/AssetTypeIcon.tsx`     | Props (static mapping) |

### 5.9 Evidence

| Screen Element            | Implementation File                              | Data Source           |
| ------------------------- | ------------------------------------------------ | --------------------- |
| Evidence Grid             | `components/evidence/EvidenceGrid.tsx`           | `useEvidence()`       |
| Evidence Table            | `components/evidence/EvidenceTable.tsx`          | `useEvidence()`       |
| Evidence Upload Zone      | `components/evidence/EvidenceUploadZone.tsx`     | `useUploadEvidence()` |
| Evidence Preview (PDF)    | `components/evidence/PdfPreview.tsx`             | S3 pre-signed URL     |
| Evidence Preview (Image)  | `components/evidence/ImagePreview.tsx`           | S3 pre-signed URL     |
| Evidence Chain of Custody | `components/evidence/ChainOfCustodyTimeline.tsx` | `useChainOfCustody()` |
| Evidence Integrity Badge  | `components/evidence/IntegrityBadge.tsx`         | Props (hash check)    |
| Storage Usage Bar         | `components/evidence/StorageUsageBar.tsx`        | `useTenantStorage()`  |

### 5.10 Remediation

| Screen Element          | Implementation File                              | Data Source                |
| ----------------------- | ------------------------------------------------ | -------------------------- |
| Remediation Plan Card   | `components/remediation/RemediationPlanCard.tsx` | Props                      |
| Remediation Gantt Chart | `components/remediation/RemediationGantt.tsx`    | `useRemediationTimeline()` |
| Action Item List        | `components/remediation/ActionItemList.tsx`      | `useRemediationActions()`  |
| Action Item Form        | `components/remediation/ActionItemForm.tsx`      | `useCreateAction()`        |
| Verification Form       | `components/remediation/VerificationForm.tsx`    | `useVerifyAction()`        |
| Budget Donut Chart      | `components/remediation/BudgetDonut.tsx`         | `useRemediationBudget()`   |

### 5.11 CSMS

| Screen Element        | Implementation File                       | Data Source             |
| --------------------- | ----------------------------------------- | ----------------------- |
| CSMS Framework Card   | `components/csms/CSMSFrameworkCard.tsx`   | Props                   |
| CSMS Element Tree     | `components/csms/CSMSlementTree.tsx`      | `useCSMSlements()`      |
| Policy Editor         | `components/csms/PolicyEditor.tsx`        | `useCSMSPolicy()`       |
| Gap Analysis View     | `components/csms/GapAnalysisView.tsx`     | `useCSMSGapAnalysis()`  |
| Improvement Plan List | `components/csms/ImprovementPlanList.tsx` | `useCSMSImprovements()` |

### 5.12 Reports

| Screen Element           | Implementation File                            | Data Source            |
| ------------------------ | ---------------------------------------------- | ---------------------- |
| Report Template Selector | `components/report/ReportTemplateSelector.tsx` | `useReportTemplates()` |
| Report Config Form       | `components/report/ReportConfigForm.tsx`       | Local state            |
| Report List              | `components/report/ReportList.tsx`             | `useReports()`         |
| Report Status Badge      | `components/report/ReportStatusBadge.tsx`      | Props                  |

### 5.13 Administration

| Screen Element          | Implementation File                          | Data Source           |
| ----------------------- | -------------------------------------------- | --------------------- |
| Member Table            | `components/admin/MemberTable.tsx`           | `useTenantMembers()`  |
| Invite Member Dialog    | `components/admin/InviteMemberDialog.tsx`    | `useInviteMember()`   |
| Role Editor             | `components/admin/RoleEditor.tsx`            | `useRoles()`          |
| API Key List            | `components/admin/ApiKeyList.tsx`            | `useApiKeys()`        |
| Audit Log Table         | `components/admin/AuditLogTable.tsx`         | `useAuditLog()`       |
| Integration Card        | `components/admin/IntegrationCard.tsx`       | `useIntegrations()`   |
| Webhook Editor          | `components/admin/WebhookEditor.tsx`         | `useWebhooks()`       |
| Workspace Settings Form | `components/admin/WorkspaceSettingsForm.tsx` | `useTenantSettings()` |

### 5.14 Shared / Shell

| Screen Element        | Implementation File                         | Data Source          |
| --------------------- | ------------------------------------------- | -------------------- |
| App Shell             | `components/layout/AppShell.tsx`            | —                    |
| Sidebar               | `components/layout/Sidebar.tsx`             | `usePermissions()`   |
| Sidebar Nav Item      | `components/layout/SidebarNavItem.tsx`      | Props                |
| Top Bar               | `components/layout/TopBar.tsx`              | —                    |
| Global Search (Cmd+K) | `components/shared/GlobalSearch.tsx`        | `useGlobalSearch()`  |
| Notification Center   | `components/shared/NotificationCenter.tsx`  | `useNotifications()` |
| Offline Banner        | `components/shared/OfflineBanner.tsx`       | `useOfflineState()`  |
| Sync Status Indicator | `components/shared/SyncStatusIndicator.tsx` | `useOfflineState()`  |
| Tenant Switcher       | `components/shared/TenantSwitcher.tsx`      | `useTenants()`       |
| User Menu             | `components/shared/UserMenu.tsx`            | `useAuth()`          |
| Theme Toggle          | `components/shared/ThemeToggle.tsx`         | `useTheme()`         |

---

## 6. Component Count Summary

| Layer               | Count    | Package                       |
| ------------------- | -------- | ----------------------------- |
| Primitives          | 22       | `packages/ui/src/primitives/` |
| Composed Components | 29       | `packages/ui/src/components/` |
| Charts              | 10       | `packages/ui/src/charts/`     |
| Diagrams            | 8        | `packages/ui/src/diagrams/`   |
| Feature Components  | ~120     | `apps/web/src/components/`    |
| **Total**           | **~189** |                               |

---

_Next: [API Requirements →](api-requirements.md)_
