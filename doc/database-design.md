# IEC 62443 Platform — Database Entity Model

> Version: 1.0 | Status: Draft | Last Updated: 2026-07-31
> Database: PostgreSQL 16+ | Multi-tenant: Schema-per-tenant

---

## 1. Schema Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    platform schema                          │
│  (shared across all tenants — users, tenants, licenses)    │
├─────────────────────────────────────────────────────────────┤
│  tenant_{id} schema (one per tenant, identical structure)   │
│                                                             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────┐ │
│  │assessment │ │   risk    │ │   zone    │ │   csms     │ │
│  │           │ │           │ │           │ │            │ │
│  │findings   │ │evidence   │ │remediation│ │   asset    │ │
│  │           │ │           │ │           │ │            │ │
│  └───────────┘ └───────────┘ └───────────┘ └────────────┘ │
│                                                             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                │
│  │  purdue   │ │   audit   │ │   sync    │                │
│  └───────────┘ └───────────┘ └───────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Platform Schema (Shared)

### 2.1 Tenants

```sql
TABLE platform.tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    schema_name     VARCHAR(63) UNIQUE NOT NULL,  -- 'tenant_{short_id}'
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('trial','active','suspended','archived')),
    plan            VARCHAR(50) NOT NULL DEFAULT 'professional',
    settings        JSONB DEFAULT '{}',           -- locale, timezone, branding
    storage_quota   BIGINT DEFAULT 10737418240,   -- 10 GB default
    storage_used    BIGINT DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.2 Users

```sql
TABLE platform.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(320) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),                 -- nullable for SSO-only users
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    avatar_url      TEXT,
    mfa_enabled     BOOLEAN NOT NULL DEFAULT false,
    mfa_secret      TEXT,                         -- TOTP secret (encrypted)
    webauthn_keys   JSONB DEFAULT '[]',           -- FIDO2 credential descriptors
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    last_login_at   TIMESTAMPTZ,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.3 Tenant Memberships

```sql
TABLE platform.tenant_memberships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES platform.tenants(id),
    user_id         UUID NOT NULL REFERENCES platform.users(id),
    role            VARCHAR(50) NOT NULL DEFAULT 'member',
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    invited_by      UUID REFERENCES platform.users(id),
    joined_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, user_id)
);
```

### 2.4 Roles & Permissions (Platform Level)

```sql
TABLE platform.roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES platform.tenants(id), -- NULL = system role
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    is_system       BOOLEAN NOT NULL DEFAULT false,
    permissions     JSONB NOT NULL DEFAULT '[]',  -- array of permission strings
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE platform.user_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES platform.users(id),
    role_id         UUID NOT NULL REFERENCES platform.roles(id),
    tenant_id       UUID REFERENCES platform.tenants(id),
    granted_by      UUID REFERENCES platform.users(id),
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role_id, tenant_id)
);
```

### 2.5 Audit Events (Platform)

```sql
TABLE platform.audit_events (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       UUID,
    user_id         UUID,
    event_type      VARCHAR(100) NOT NULL,        -- 'user.login', 'finding.created', etc.
    entity_type     VARCHAR(100),                 -- 'finding', 'assessment', etc.
    entity_id       UUID,
    action          VARCHAR(50) NOT NULL,         -- 'create', 'update', 'delete', 'read'
    details         JSONB,
    ip_address      INET,
    user_agent      TEXT,
    previous_hash   VARCHAR(64),                  -- SHA-256 of previous event
    event_hash      VARCHAR(64) NOT NULL,         -- SHA-256 hash of this event
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_events_entity ON platform.audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_tenant_time ON platform.audit_events(tenant_id, created_at DESC);
CREATE INDEX idx_audit_events_user ON platform.audit_events(user_id, created_at DESC);
```

### 2.6 API Keys

```sql
TABLE platform.api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES platform.tenants(id),
    user_id         UUID NOT NULL REFERENCES platform.users(id),
    name            VARCHAR(255) NOT NULL,
    key_hash        VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 of the key
    key_prefix      VARCHAR(8) NOT NULL,          -- first 8 chars for identification
    scopes          JSONB NOT NULL DEFAULT '[]',
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 3. Tenant Schema — Assessment Domain

### 3.1 Assessments

```sql
TABLE assessment.engagements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    type            VARCHAR(50) NOT NULL
                    CHECK (type IN ('gap','system','component','csms','custom')),
    iec_part        VARCHAR(20),                  -- '3-2', '3-3', '4-1', '4-2', '2-1'
    scope_system_id UUID,                         -- FK to asset.systems
    target_sl       SMALLINT CHECK (target_sl BETWEEN 0 AND 4),
    current_sl      SMALLINT CHECK (current_sl BETWEEN 0 AND 4),
    status          VARCHAR(30) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','in_progress','review','completed','archived')),
    lead_assessor_id UUID,
    start_date      DATE,
    target_date     DATE,
    completed_at    TIMESTAMPTZ,
    template_id     UUID REFERENCES assessment.templates(id),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE assessment.templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    iec_part        VARCHAR(20) NOT NULL,
    version         VARCHAR(20) NOT NULL,
    is_system       BOOLEAN NOT NULL DEFAULT false, -- system-provided vs custom
    sections        JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE assessment.questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID NOT NULL REFERENCES assessment.templates(id),
    section         VARCHAR(200),
    clause_ref      VARCHAR(50),                  -- e.g., '4.2.3.1'
    question_text   TEXT NOT NULL,
    requirement_id  VARCHAR(100),                 -- IEC requirement identifier
    max_score       SMALLINT DEFAULT 4,
    guidance_text   TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true
);

TABLE assessment.responses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id   UUID NOT NULL REFERENCES assessment.engagements(id),
    question_id     UUID NOT NULL REFERENCES assessment.questions(id),
    score           SMALLINT CHECK (score >= 0),
    maturity_level  VARCHAR(30)
                    CHECK (maturity_level IN ('implemented','partial','not_implemented','na')),
    assessor_notes  TEXT,
    evidence_refs   UUID[] DEFAULT '{}',          -- array of evidence IDs
    finding_refs    UUID[] DEFAULT '{}',          -- array of finding IDs
    answered_by     UUID,
    answered_at     TIMESTAMPTZ,
    reviewed_by     UUID,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (engagement_id, question_id)
);

TABLE assessment.scorecards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id   UUID NOT NULL REFERENCES assessment.engagements(id),
    category        VARCHAR(200),                 -- IEC 62443 category/FR
    current_sl      SMALLINT,
    target_sl       SMALLINT,
    gap             SMALLINT GENERATED ALWAYS AS (target_sl - current_sl) STORED,
    total_questions INTEGER,
    answered_count  INTEGER,
    compliance_pct  NUMERIC(5,2),
    snapshot_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 4. Tenant Schema — Risk Domain

```sql
TABLE risk.registers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500) NOT NULL,
    scope_type      VARCHAR(50),                  -- 'facility', 'system', 'project'
    scope_id        UUID,
    owner_id        UUID,
    status          VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE risk.entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_id     UUID NOT NULL REFERENCES risk.registers(id),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    category        VARCHAR(100)
                    CHECK (category IN ('safety','operational','environmental',
                                        'financial','reputational','regulatory')),
    threat_source   VARCHAR(200),
    vulnerability   TEXT,
    asset_ids       UUID[] DEFAULT '{}',
    zone_ids        UUID[] DEFAULT '{}',
    likelihood      SMALLINT CHECK (likelihood BETWEEN 1 AND 5),
    impact          SMALLINT CHECK (impact BETWEEN 1 AND 5),
    inherent_score  SMALLINT GENERATED ALWAYS AS (likelihood * impact) STORED,
    risk_level      VARCHAR(20) GENERATED ALWAYS AS (
                        CASE
                            WHEN (likelihood * impact) <= 4 THEN 'low'
                            WHEN (likelihood * impact) <= 9 THEN 'medium'
                            WHEN (likelihood * impact) <= 15 THEN 'high'
                            ELSE 'critical'
                        END
                    ) STORED,
    treatment       VARCHAR(30)
                    CHECK (treatment IN ('mitigate','transfer','accept','avoid','pending')),
    residual_likelihood SMALLINT CHECK (residual_likelihood BETWEEN 1 AND 5),
    residual_impact     SMALLINT CHECK (residual_impact BETWEEN 1 AND 5),
    residual_score      SMALLINT GENERATED ALWAYS AS
                        (COALESCE(residual_likelihood, likelihood) *
                         COALESCE(residual_impact, impact)) STORED,
    risk_owner_id   UUID,
    iec_requirement VARCHAR(100),                 -- linked IEC 62443 requirement
    status          VARCHAR(30) NOT NULL DEFAULT 'identified',
    identified_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    reassess_by     DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE risk.treatments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_id         UUID NOT NULL REFERENCES risk.entries(id),
    type            VARCHAR(30) NOT NULL,
    description     TEXT NOT NULL,
    responsible_id  UUID,
    target_date     DATE,
    status          VARCHAR(30) NOT NULL DEFAULT 'planned'
                    CHECK (status IN ('planned','in_progress','completed','cancelled')),
    effectiveness   VARCHAR(30),                  -- post-treatment evaluation
    cost_estimate   NUMERIC(12,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE risk.acceptances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_id         UUID NOT NULL REFERENCES risk.entries(id),
    accepted_by     UUID NOT NULL,
    justification   TEXT NOT NULL,
    approval_chain  JSONB,                        -- [{approver_id, status, date}]
    expires_at      TIMESTAMPTZ,
    review_date     DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE risk.matrix_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_id     UUID NOT NULL REFERENCES risk.registers(id),
    likelihood_labels JSONB NOT NULL,             -- ["Rare","Unlikely","Possible","Likely","Almost Certain"]
    impact_labels   JSONB NOT NULL,               -- ["Negligible","Minor","Moderate","Major","Catastrophic"]
    thresholds      JSONB NOT NULL,               -- {"low":[1,4],"medium":[5,9],"high":[10,15],"critical":[16,25]}
    color_scheme    JSONB DEFAULT '{}'
);
```

---

## 5. Tenant Schema — Zone & Conduit Domain

```sql
TABLE zone.zones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    zone_type       VARCHAR(50)
                    CHECK (zone_type IN ('process_control','safety_instrumented',
                                         'manufacturing_ops','enterprise_it','idmz',
                                         'remote_access','wireless','custom')),
    security_level  SMALLINT CHECK (security_level BETWEEN 0 AND 4),
    parent_zone_id  UUID REFERENCES zone.zones(id), -- sub-zone nesting
    purdue_level    SMALLINT CHECK (purdue_level BETWEEN 0 AND 5),
    facility_id     UUID,
    diagram_x       NUMERIC,                      -- X position in topology diagram
    diagram_y       NUMERIC,                      -- Y position in topology diagram
    diagram_width   NUMERIC,
    diagram_height  NUMERIC,
    color           VARCHAR(7),                   -- hex color for diagram rendering
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE zone.conduits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    source_zone_id  UUID NOT NULL REFERENCES zone.zones(id),
    target_zone_id  UUID NOT NULL REFERENCES zone.zones(id),
    conduit_type    VARCHAR(50)
                    CHECK (conduit_type IN ('hardwired','network','wireless',
                                            'removable_media','human','other')),
    protocol        VARCHAR(100),                 -- e.g., 'Modbus/TCP', 'OPC UA', 'HTTPS'
    security_level  SMALLINT CHECK (security_level BETWEEN 0 AND 4),
    encryption      BOOLEAN DEFAULT false,
    authentication  BOOLEAN DEFAULT false,
    monitoring      BOOLEAN DEFAULT false,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE zone.memberships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id         UUID NOT NULL REFERENCES zone.zones(id),
    asset_id        UUID NOT NULL,                -- FK to asset.assets
    assigned_by     UUID,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (zone_id, asset_id)
);

TABLE zone.segmentation_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conduit_id      UUID REFERENCES zone.conduits(id),
    zone_id         UUID REFERENCES zone.zones(id),
    rule_type       VARCHAR(50) NOT NULL,         -- 'firewall', 'acl', 'dmz_proxy'
    description     TEXT,
    direction       VARCHAR(20) CHECK (direction IN ('inbound','outbound','bidirectional')),
    action          VARCHAR(20) CHECK (action IN ('allow','deny','inspect','proxy')),
    is_compliant    BOOLEAN DEFAULT true,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 6. Tenant Schema — Purdue Model Domain

```sql
TABLE purdue.models (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    facility_id     UUID,
    description     TEXT,
    is_default      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE purdue.levels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID NOT NULL REFERENCES purdue.models(id),
    level_number    NUMERIC(3,1) NOT NULL,        -- 0, 1, 2, 3, 3.5, 4, 5
    name            VARCHAR(200) NOT NULL,        -- e.g., 'Basic Control', 'iDMZ'
    description     TEXT,
    color           VARCHAR(7),
    sort_order      INTEGER NOT NULL DEFAULT 0
);

TABLE purdue.asset_mappings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID NOT NULL REFERENCES purdue.models(id),
    asset_id        UUID NOT NULL,
    level_id        UUID NOT NULL REFERENCES purdue.levels(id),
    assigned_by     UUID,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (model_id, asset_id)
);

TABLE purdue.communication_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID NOT NULL REFERENCES purdue.models(id),
    source_level_id UUID NOT NULL REFERENCES purdue.levels(id),
    target_level_id UUID NOT NULL REFERENCES purdue.levels(id),
    is_allowed      BOOLEAN NOT NULL DEFAULT false,
    condition       TEXT,                         -- e.g., 'only via iDMZ proxy'
    protocol        VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 7. Tenant Schema — CSMS Domain

```sql
TABLE csms.frameworks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    organization_id UUID,
    version         VARCHAR(20) NOT NULL DEFAULT '1.0',
    status          VARCHAR(30) NOT NULL DEFAULT 'draft',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE csms.elements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id    UUID NOT NULL REFERENCES csms.frameworks(id),
    category        VARCHAR(100) NOT NULL,        -- IEC 62443-2-1 category (1-14)
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    requirement_ref VARCHAR(100),                 -- clause reference
    implementation_status VARCHAR(30)
                    CHECK (implementation_status IN ('implemented','partial','planned','not_started','na')),
    maturity_score  SMALLINT CHECK (maturity_score BETWEEN 0 AND 5),
    owner_id        UUID,
    last_reviewed   TIMESTAMPTZ,
    next_review     DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE csms.policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id    UUID NOT NULL REFERENCES csms.frameworks(id),
    element_id      UUID REFERENCES csms.elements(id),
    title           VARCHAR(500) NOT NULL,
    version         VARCHAR(20) NOT NULL DEFAULT '1.0',
    status          VARCHAR(30) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','review','approved','deprecated')),
    body            TEXT,                         -- Markdown or rich text
    approved_by     UUID,
    approved_at     TIMESTAMPTZ,
    review_cycle    INTEGER DEFAULT 365,          -- days
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE csms.improvement_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id    UUID NOT NULL REFERENCES csms.frameworks(id),
    element_id      UUID REFERENCES csms.elements(id),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    priority        VARCHAR(20) CHECK (priority IN ('low','medium','high','critical')),
    target_date     DATE,
    status          VARCHAR(30) NOT NULL DEFAULT 'planned',
    owner_id        UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 8. Tenant Schema — Findings Domain

```sql
TABLE findings.findings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id   UUID REFERENCES assessment.engagements(id),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    severity        VARCHAR(20) NOT NULL
                    CHECK (severity IN ('critical','high','medium','low','informational')),
    status          VARCHAR(30) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('draft','open','acknowledged','remediation_planned',
                                      'in_progress','verification','verified','closed',
                                      'false_positive','risk_accepted')),
    category        VARCHAR(100),
    subcategory     VARCHAR(100),
    iec_requirement VARCHAR(100),
    asset_ids       UUID[] DEFAULT '{}',
    zone_ids        UUID[] DEFAULT '{}',
    risk_ids        UUID[] DEFAULT '{}',
    assigned_to     UUID,
    due_date        DATE,
    discovered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at       TIMESTAMPTZ,
    closed_by       UUID,
    resolution_note TEXT,
    source          VARCHAR(50)                   -- 'manual', 'scanner', 'import'
                    DEFAULT 'manual',
    external_ref    VARCHAR(255),                 -- scanner finding ID
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE findings.status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id      UUID NOT NULL REFERENCES findings.findings(id),
    from_status     VARCHAR(30),
    to_status       VARCHAR(30) NOT NULL,
    changed_by      UUID NOT NULL,
    reason          TEXT,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE findings.comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id      UUID NOT NULL REFERENCES findings.findings(id),
    author_id       UUID NOT NULL,
    body            TEXT NOT NULL,
    is_internal     BOOLEAN NOT NULL DEFAULT false, -- internal to assessment team
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 9. Tenant Schema — Evidence Domain

```sql
TABLE evidence.items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    evidence_type   VARCHAR(50) NOT NULL
                    CHECK (evidence_type IN ('document','screenshot','config','log',
                                             'scan_result','network_capture','certificate',
                                             'interview','other')),
    file_id         UUID,                         -- reference to evidence.files
    file_name       VARCHAR(500),
    file_size       BIGINT,
    mime_type       VARCHAR(200),
    sha256_hash     VARCHAR(64) NOT NULL,         -- integrity verification
    md5_hash        VARCHAR(32),                  -- legacy compatibility
    collected_by    UUID,
    collected_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    retention_until TIMESTAMPTZ,
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE evidence.files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_backend VARCHAR(20) NOT NULL DEFAULT 's3',
    storage_key     VARCHAR(1000) NOT NULL,       -- S3 object key
    bucket          VARCHAR(255),
    encryption_key_id VARCHAR(255),               -- KMS key reference
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE evidence.links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID NOT NULL REFERENCES evidence.items(id),
    entity_type     VARCHAR(50) NOT NULL,         -- 'finding', 'assessment', 'risk', etc.
    entity_id       UUID NOT NULL,
    linked_by       UUID,
    linked_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (evidence_id, entity_type, entity_id)
);

TABLE evidence.chain_of_custody (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID NOT NULL REFERENCES evidence.items(id),
    action          VARCHAR(50) NOT NULL,         -- 'created','viewed','downloaded','transferred','sealed'
    actor_id        UUID NOT NULL,
    reason          TEXT,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 10. Tenant Schema — Remediation Domain

```sql
TABLE remediation.plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    engagement_id   UUID REFERENCES assessment.engagements(id),
    owner_id        UUID,
    status          VARCHAR(30) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','approved','in_progress','completed','cancelled')),
    budget_total    NUMERIC(12,2),
    budget_spent    NUMERIC(12,2) DEFAULT 0,
    start_date      DATE,
    target_date     DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE remediation.actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id         UUID NOT NULL REFERENCES remediation.plans(id),
    finding_id      UUID REFERENCES findings.findings(id),
    risk_id         UUID REFERENCES risk.entries(id),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    priority        VARCHAR(20) CHECK (priority IN ('low','medium','high','critical')),
    status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','blocked','completed','cancelled')),
    assigned_to     UUID,
    due_date        DATE,
    completed_at    TIMESTAMPTZ,
    cost_actual     NUMERIC(12,2),
    cost_estimate   NUMERIC(12,2),
    external_ticket_ref VARCHAR(255),             -- Jira/DevOps ticket ID
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE remediation.verifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id       UUID NOT NULL REFERENCES remediation.actions(id),
    verified_by     UUID NOT NULL,
    result          VARCHAR(30) NOT NULL CHECK (result IN ('pass','fail','partial')),
    notes           TEXT,
    evidence_ids    UUID[] DEFAULT '{}',
    verified_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 11. Tenant Schema — Asset Domain

```sql
TABLE asset.assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500) NOT NULL,
    asset_tag       VARCHAR(100) UNIQUE,          -- internal asset tag
    asset_type      VARCHAR(50) NOT NULL
                    CHECK (asset_type IN ('plc','rtu','dcs','hmi','scada_server','engineering_ws',
                                          'historian','switch','router','firewall','ids',
                                          'server','workstation','sensor','actuator','vfd',
                                          'wireless_ap','gateway','other')),
    vendor          VARCHAR(200),
    model           VARCHAR(200),
    serial_number   VARCHAR(200),
    firmware_version VARCHAR(100),
    hardware_version VARCHAR(100),
    criticality     VARCHAR(20)
                    CHECK (criticality IN ('safety_critical','business_critical','operational',
                                           'support','non_critical')),
    ip_addresses    INET[],
    mac_addresses   MACADDR[],
    hostname        VARCHAR(255),
    location        VARCHAR(500),
    facility_id     UUID,
    purdue_level    SMALLINT CHECK (purdue_level BETWEEN 0 AND 5),
    status          VARCHAR(30) NOT NULL DEFAULT 'operational'
                    CHECK (status IN ('operational','decommissioned','maintenance','standby')),
    metadata        JSONB DEFAULT '{}',
    discovered_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE asset.relationships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_asset_id UUID NOT NULL REFERENCES asset.assets(id),
    target_asset_id UUID NOT NULL REFERENCES asset.assets(id),
    relationship    VARCHAR(50) NOT NULL,         -- 'connected_to','manages','monitors','controls'
    protocol        VARCHAR(100),
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

TABLE asset.import_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    source          VARCHAR(50) NOT NULL,         -- 'csv','cmdb','scanner','manual'
    file_id         UUID,
    status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed')),
    total_records   INTEGER,
    imported_count  INTEGER DEFAULT 0,
    error_count     INTEGER DEFAULT 0,
    errors          JSONB DEFAULT '[]',
    created_by      UUID,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 12. Entity Relationship Diagram (Conceptual)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        PLATFORM SCHEMA                                   │
│  ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐       │
│  │ tenants │◄────│tenant_   │     │  users   │     │  roles   │       │
│  │         │     │memberships├────►│          │◄────│          │       │
│  └────┬────┘     └──────────┘     └────┬─────┘     └──────────┘       │
│       │                                │                                │
│       │          ┌──────────┐          │                                │
│       └──────────┤audit_log │◄─────────┘                                │
│                  └──────────┘                                           │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                       TENANT SCHEMA (per tenant)                         │
│                                                                          │
│  ┌─────────────┐    ┌──────────┐    ┌────────────┐    ┌──────────┐    │
│  │ engagements │◄───│ responses│    │   assets   │    │  zones   │    │
│  │             │    └──────────┘    │            │    │          │    │
│  │             │                    │            │    │          │    │
│  └──────┬──────┘                    └─────┬──────┘    └────┬─────┘    │
│         │                                 │                │           │
│         │          ┌──────────┐           │     ┌──────────┤           │
│         ├──────────┤ findings │◄──────────┘     │  zone_   │           │
│         │          │          ├─────────────────┤  members │           │
│         │          └────┬─────┘                 └──────────┘           │
│         │               │                                              │
│         │    ┌──────────┴──────────┐                                   │
│         │    │                     │                                   │
│         │  ┌─▼─────────┐   ┌──────▼──────┐                           │
│         │  │ evidence   │   │ remediation │                           │
│         │  │ items      │   │ actions     │                           │
│         │  └───────────┘   └─────────────┘                           │
│         │                                                              │
│  ┌──────▼──────┐    ┌──────────┐    ┌────────────┐                    │
│  │  risk       │    │  csms    │    │  purdue    │                    │
│  │  entries    │    │ elements │    │  models    │                    │
│  │             │    │          │    │            │                    │
│  └─────────────┘    └──────────┘    └────────────┘                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Indexing Strategy

| Table | Index | Type | Purpose |
|---|---|---|---|
| findings | (engagement_id, status) | B-tree | Assessment findings lookup |
| findings | (severity, status) | B-tree | Dashboard severity filters |
| risk.entries | (register_id, risk_level) | B-tree | Risk register views |
| evidence.items | (sha256_hash) | B-tree | Evidence deduplication |
| evidence.links | (entity_type, entity_id) | B-tree | Reverse evidence lookup |
| asset.assets | (asset_type, status) | B-tree | Asset inventory queries |
| audit_events | (entity_type, entity_id) | B-tree | Entity audit trail |
| audit_events | (created_at) | BRIN | Time-range audit queries |
| assessment.responses | (engagement_id) | B-tree | Assessment progress |

---

*Next: [API Architecture →](api-design.md)*
