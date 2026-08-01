-- Tenant Schema — Full DDL
-- Run once per tenant, after platform schema is initialized.
-- Parameter: replace {SCHEMA} with the tenant schema name (e.g., tenant_iog)

-- ── Assessment ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS {SCHEMA}.templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    iec_part        VARCHAR(20) NOT NULL,
    version         VARCHAR(20) NOT NULL,
    is_system       BOOLEAN NOT NULL DEFAULT false,
    sections        JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID NOT NULL REFERENCES {SCHEMA}.templates(id),
    section         VARCHAR(200),
    clause_ref      VARCHAR(50),
    question_text   TEXT NOT NULL,
    requirement_id  VARCHAR(100),
    foundation_requirement VARCHAR(10)
                    CHECK (foundation_requirement IN ('FR-1','FR-2','FR-3','FR-4','FR-5','FR-6','FR-7')),
    max_score       SMALLINT DEFAULT 4,
    guidance_text   TEXT,
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.engagements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    type            VARCHAR(50) NOT NULL
                    CHECK (type IN ('gap','system','component','csms','custom')),
    iec_part        VARCHAR(20),
    scope_system_id UUID,
    target_sl       SMALLINT CHECK (target_sl BETWEEN 0 AND 4),
    current_sl      SMALLINT CHECK (current_sl BETWEEN 0 AND 4),
    status          VARCHAR(30) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','in_progress','review','completed','archived')),
    lead_assessor_id UUID,
    start_date      DATE,
    target_date     DATE,
    completed_at    TIMESTAMPTZ,
    template_id     UUID REFERENCES {SCHEMA}.templates(id),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_engagements_status ON {SCHEMA}.engagements(status);

CREATE TABLE IF NOT EXISTS {SCHEMA}.responses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id   UUID NOT NULL REFERENCES {SCHEMA}.engagements(id),
    question_id     UUID NOT NULL REFERENCES {SCHEMA}.questions(id),
    score           SMALLINT CHECK (score >= 0),
    maturity_level  SMALLINT CHECK (maturity_level BETWEEN 0 AND 4),
    assessor_notes  TEXT,
    evidence_refs   UUID[] DEFAULT '{}',
    finding_refs    UUID[] DEFAULT '{}',
    answered_by     UUID,
    answered_at     TIMESTAMPTZ,
    reviewed_by     UUID,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (engagement_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_responses_engagement ON {SCHEMA}.responses(engagement_id);

CREATE TABLE IF NOT EXISTS {SCHEMA}.scorecards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id   UUID NOT NULL REFERENCES {SCHEMA}.engagements(id),
    category        VARCHAR(200),
    current_sl      SMALLINT,
    target_sl       SMALLINT,
    gap             SMALLINT GENERATED ALWAYS AS (target_sl - current_sl) STORED,
    total_questions INTEGER,
    answered_count  INTEGER,
    compliance_pct  NUMERIC(5,2),
    snapshot_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Risk ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS {SCHEMA}.registers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500) NOT NULL,
    scope_type      VARCHAR(50),
    scope_id        UUID,
    owner_id        UUID,
    status          VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_id     UUID NOT NULL REFERENCES {SCHEMA}.registers(id),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    category        VARCHAR(100)
                    CHECK (category IN ('safety','operational','environmental','financial','reputational','regulatory')),
    threat_source   VARCHAR(200),
    vulnerability   TEXT,
    threat_category VARCHAR(30) CHECK (threat_category IN ('accidental','deliberate','natural','failure')),
    threat_capability VARCHAR(30) CHECK (threat_capability IN ('low','moderate','high','very_high')),
    attack_vector   VARCHAR(30) CHECK (attack_vector IN ('network','adjacent','local','physical')),
    threat_scenario TEXT,
    vulnerability_class VARCHAR(30) CHECK (vulnerability_class IN ('design','implementation','configuration','operational','physical')),
    cve_refs        VARCHAR[] DEFAULT '{}',
    icsa_refs       VARCHAR[] DEFAULT '{}',
    asset_ids       UUID[] DEFAULT '{}',
    zone_ids        UUID[] DEFAULT '{}',
    likelihood      SMALLINT CHECK (likelihood BETWEEN 1 AND 5),
    impact          SMALLINT CHECK (impact BETWEEN 1 AND 5),
    inherent_score  SMALLINT GENERATED ALWAYS AS (likelihood * impact) STORED,
    risk_level      VARCHAR(20) GENERATED ALWAYS AS (
                        CASE WHEN (likelihood * impact) <= 4 THEN 'low'
                             WHEN (likelihood * impact) <= 9 THEN 'medium'
                             WHEN (likelihood * impact) <= 15 THEN 'high'
                             ELSE 'critical' END) STORED,
    treatment       VARCHAR(30) CHECK (treatment IN ('mitigate','transfer','accept','avoid','pending')),
    residual_likelihood SMALLINT CHECK (residual_likelihood BETWEEN 1 AND 5),
    residual_impact     SMALLINT CHECK (residual_impact BETWEEN 1 AND 5),
    residual_score      SMALLINT GENERATED ALWAYS AS
                        (COALESCE(residual_likelihood, likelihood) * COALESCE(residual_impact, impact)) STORED,
    risk_owner_id   UUID,
    iec_requirement VARCHAR(100),
    status          VARCHAR(30) NOT NULL DEFAULT 'identified',
    identified_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    reassess_by     DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_entries_register_level ON {SCHEMA}.entries(register_id, risk_level);

CREATE TABLE IF NOT EXISTS {SCHEMA}.treatments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_id         UUID NOT NULL REFERENCES {SCHEMA}.entries(id),
    type            VARCHAR(30) NOT NULL,
    description     TEXT NOT NULL,
    responsible_id  UUID,
    target_date     DATE,
    status          VARCHAR(30) NOT NULL DEFAULT 'planned'
                    CHECK (status IN ('planned','in_progress','completed','cancelled')),
    effectiveness   VARCHAR(30),
    cost_estimate   NUMERIC(12,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.acceptances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_id         UUID NOT NULL REFERENCES {SCHEMA}.entries(id),
    accepted_by     UUID NOT NULL,
    justification   TEXT NOT NULL,
    approval_chain  JSONB,
    expires_at      TIMESTAMPTZ,
    review_date     DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.matrix_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_id     UUID NOT NULL REFERENCES {SCHEMA}.registers(id),
    likelihood_labels JSONB NOT NULL,
    impact_labels   JSONB NOT NULL,
    thresholds      JSONB NOT NULL,
    color_scheme    JSONB DEFAULT '{}'
);

-- ── Zone & Conduit ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS {SCHEMA}.zones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    zone_type       VARCHAR(50) CHECK (zone_type IN ('process_control','safety_instrumented','manufacturing_ops','enterprise_it','idmz','remote_access','wireless','custom')),
    security_level  SMALLINT CHECK (security_level BETWEEN 0 AND 4),
    target_sl       SMALLINT CHECK (target_sl BETWEEN 0 AND 4),
    achieved_sl     SMALLINT CHECK (achieved_sl BETWEEN 0 AND 4),
    parent_zone_id  UUID REFERENCES {SCHEMA}.zones(id),
    purdue_level    SMALLINT CHECK (purdue_level BETWEEN 0 AND 5),
    facility_id     UUID,
    diagram_x       NUMERIC,
    diagram_y       NUMERIC,
    diagram_width   NUMERIC,
    diagram_height  NUMERIC,
    color           VARCHAR(7),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.conduits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    source_zone_id  UUID NOT NULL REFERENCES {SCHEMA}.zones(id),
    target_zone_id  UUID NOT NULL REFERENCES {SCHEMA}.zones(id),
    conduit_type    VARCHAR(50) CHECK (conduit_type IN ('hardwired','network','wireless','removable_media','human','other')),
    protocol        VARCHAR(100),
    security_level  SMALLINT CHECK (security_level BETWEEN 0 AND 4),
    target_sl       SMALLINT CHECK (target_sl BETWEEN 0 AND 4),
    achieved_sl     SMALLINT CHECK (achieved_sl BETWEEN 0 AND 4),
    encryption      BOOLEAN DEFAULT false,
    authentication  BOOLEAN DEFAULT false,
    monitoring      BOOLEAN DEFAULT false,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.memberships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id         UUID NOT NULL REFERENCES {SCHEMA}.zones(id),
    asset_id        UUID NOT NULL,
    assigned_by     UUID,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (zone_id, asset_id)
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.segmentation_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conduit_id      UUID REFERENCES {SCHEMA}.conduits(id),
    zone_id         UUID REFERENCES {SCHEMA}.zones(id),
    rule_type       VARCHAR(50) NOT NULL,
    description     TEXT,
    direction       VARCHAR(20) CHECK (direction IN ('inbound','outbound','bidirectional')),
    action          VARCHAR(20) CHECK (action IN ('allow','deny','inspect','proxy')),
    is_compliant    BOOLEAN DEFAULT true,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Purdue Model ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS {SCHEMA}.models (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    facility_id     UUID,
    description     TEXT,
    is_default      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.levels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID NOT NULL REFERENCES {SCHEMA}.models(id),
    level_number    NUMERIC(3,1) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    color           VARCHAR(7),
    sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.asset_mappings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID NOT NULL REFERENCES {SCHEMA}.models(id),
    asset_id        UUID NOT NULL,
    level_id        UUID NOT NULL REFERENCES {SCHEMA}.levels(id),
    assigned_by     UUID,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (model_id, asset_id)
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.communication_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID NOT NULL REFERENCES {SCHEMA}.models(id),
    source_level_id UUID NOT NULL REFERENCES {SCHEMA}.levels(id),
    target_level_id UUID NOT NULL REFERENCES {SCHEMA}.levels(id),
    is_allowed      BOOLEAN NOT NULL DEFAULT false,
    condition       TEXT,
    protocol        VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── CSMS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS {SCHEMA}.frameworks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    organization_id UUID,
    version         VARCHAR(20) NOT NULL DEFAULT '1.0',
    status          VARCHAR(30) NOT NULL DEFAULT 'draft',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.elements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id    UUID NOT NULL REFERENCES {SCHEMA}.frameworks(id),
    category        VARCHAR(100) NOT NULL
                    CHECK (category IN ('SM-1','SM-2','SM-3','SM-4','SM-5','SM-6','SM-7','SM-8','SM-9','SM-10','SM-11','SM-12')),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    requirement_ref VARCHAR(100),
    implementation_status VARCHAR(30)
                    CHECK (implementation_status IN ('implemented','partial','planned','not_started','na')),
    maturity_score  SMALLINT CHECK (maturity_score BETWEEN 0 AND 4),
    owner_id        UUID,
    last_reviewed   TIMESTAMPTZ,
    next_review     DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id    UUID NOT NULL REFERENCES {SCHEMA}.frameworks(id),
    element_id      UUID REFERENCES {SCHEMA}.elements(id),
    title           VARCHAR(500) NOT NULL,
    version         VARCHAR(20) NOT NULL DEFAULT '1.0',
    status          VARCHAR(30) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','review','approved','deprecated')),
    body            TEXT,
    approved_by     UUID,
    approved_at     TIMESTAMPTZ,
    review_cycle    INTEGER DEFAULT 365,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.improvement_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id    UUID NOT NULL REFERENCES {SCHEMA}.frameworks(id),
    element_id      UUID REFERENCES {SCHEMA}.elements(id),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    priority        VARCHAR(20) CHECK (priority IN ('low','medium','high','critical')),
    target_date     DATE,
    status          VARCHAR(30) NOT NULL DEFAULT 'planned',
    owner_id        UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Findings ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS {SCHEMA}.findings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id   UUID REFERENCES {SCHEMA}.engagements(id),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    severity        VARCHAR(20) NOT NULL
                    CHECK (severity IN ('critical','high','medium','low','informational')),
    status          VARCHAR(30) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('draft','open','acknowledged','remediation_planned','in_progress','verification','verified','closed','false_positive','risk_accepted')),
    category        VARCHAR(100),
    subcategory     VARCHAR(100),
    iec_requirement VARCHAR(100),
    asset_ids       UUID[] DEFAULT '{}',
    zone_ids        UUID[] DEFAULT '{}',
    risk_ids        UUID[] DEFAULT '{}',
    assigned_to     UUID,
    due_date        TIMESTAMPTZ,
    discovered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at       TIMESTAMPTZ,
    closed_by       UUID,
    resolution_note TEXT,
    source          VARCHAR(50) DEFAULT 'manual',
    external_ref    VARCHAR(255),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_findings_engagement_status ON {SCHEMA}.findings(engagement_id, status);
CREATE INDEX IF NOT EXISTS idx_findings_severity_status ON {SCHEMA}.findings(severity, status);

CREATE TABLE IF NOT EXISTS {SCHEMA}.status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id      UUID NOT NULL REFERENCES {SCHEMA}.findings(id),
    from_status     VARCHAR(30),
    to_status       VARCHAR(30) NOT NULL,
    changed_by      UUID NOT NULL,
    reason          TEXT,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id      UUID NOT NULL REFERENCES {SCHEMA}.findings(id),
    author_id       UUID NOT NULL,
    body            TEXT NOT NULL,
    is_internal     BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Evidence ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS {SCHEMA}.files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_backend VARCHAR(20) NOT NULL DEFAULT 's3',
    storage_key     VARCHAR(1000) NOT NULL,
    bucket          VARCHAR(255),
    encryption_key_id VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    evidence_type   VARCHAR(50) NOT NULL
                    CHECK (evidence_type IN ('document','screenshot','config','log','scan_result','network_capture','certificate','interview','other')),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','archived','superseded')),
    file_id         UUID,
    file_name       VARCHAR(500),
    file_size       BIGINT,
    mime_type       VARCHAR(200),
    sha256_hash     VARCHAR(64),
    md5_hash        VARCHAR(32),
    collected_by    UUID,
    collected_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    retention_until TIMESTAMPTZ,
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_items_sha256_hash ON {SCHEMA}.items(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_items_status ON {SCHEMA}.items(status);

CREATE TABLE IF NOT EXISTS {SCHEMA}.links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID NOT NULL REFERENCES {SCHEMA}.items(id),
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (evidence_id, entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_links_entity ON {SCHEMA}.links(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS {SCHEMA}.chain_of_custody (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id     UUID NOT NULL REFERENCES {SCHEMA}.items(id),
    event_type      VARCHAR(50) NOT NULL,
    user_id         UUID NOT NULL,
    details         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Remediation ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS {SCHEMA}.plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    finding_ids     UUID[] DEFAULT '{}',
    risk_ids        UUID[] DEFAULT '{}',
    owner_id        UUID,
    status          VARCHAR(30) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','planned','approved','in_progress','completed','cancelled','overdue')),
    budget_estimate NUMERIC(12,2),
    budget_actual   NUMERIC(12,2),
    start_date      DATE,
    target_date     DATE,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id         UUID NOT NULL REFERENCES {SCHEMA}.plans(id),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    finding_id      UUID,
    risk_id         UUID,
    assignee_id     UUID,
    status          VARCHAR(30) NOT NULL DEFAULT 'planned'
                    CHECK (status IN ('planned','in_progress','completed','cancelled')),
    start_date      DATE,
    due_date        DATE,
    completed_date  DATE,
    cost_estimate   NUMERIC(12,2),
    cost_actual     NUMERIC(12,2),
    milestone       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.verifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id       UUID NOT NULL REFERENCES {SCHEMA}.actions(id),
    verified_by     UUID NOT NULL,
    verification_date TIMESTAMPTZ,
    result          VARCHAR(30) NOT NULL
                    CHECK (result IN ('pass','fail','partial')),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Assets ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS {SCHEMA}.assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    type            VARCHAR(50),
    criticality     VARCHAR(30),
    vendor          VARCHAR(255),
    model           VARCHAR(255),
    firmware_version VARCHAR(100),
    serial_number   VARCHAR(255),
    ip_address      VARCHAR(45),
    mac_address     VARCHAR(17),
    network_segment VARCHAR(255),
    purdue_level    SMALLINT CHECK (purdue_level BETWEEN 0 AND 5),
    zone_id         UUID,
    location        VARCHAR(500),
    operational_status VARCHAR(30) NOT NULL DEFAULT 'operational'
                    CHECK (operational_status IN ('operational','decommissioned','maintenance','standby')),
    install_date    TIMESTAMPTZ,
    last_patch_date TIMESTAMPTZ,
    eol_date        TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assets_type_status ON {SCHEMA}.assets(type, operational_status);

CREATE TABLE IF NOT EXISTS {SCHEMA}.relationships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_asset_id UUID NOT NULL REFERENCES {SCHEMA}.assets(id),
    target_asset_id UUID NOT NULL REFERENCES {SCHEMA}.assets(id),
    relationship_type VARCHAR(50) NOT NULL,
    protocol        VARCHAR(100),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {SCHEMA}.import_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed')),
    total_records   INTEGER,
    processed_records INTEGER,
    succeeded_count INTEGER,
    failed_count    INTEGER,
    errors          JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

-- ── Reports ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS {SCHEMA}.reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(50) NOT NULL
                    CHECK (type IN ('assessment_summary','risk_register','csms_gap','zone_topology','purdue_compliance','remediation_status','executive','audit_trail','certification_evidence','custom')),
    title           VARCHAR(500) NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed')),
    config          JSONB NOT NULL,
    file_url        TEXT,
    file_size       INTEGER,
    generated_by    UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

-- ── Clients ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS {SCHEMA}.clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    industry        VARCHAR(100),
    description     TEXT,
    contact_name    VARCHAR(200),
    contact_email   VARCHAR(320),
    contact_phone   VARCHAR(50),
    website         TEXT,
    address         TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','inactive','archived')),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Projects ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS {SCHEMA}.projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    type            VARCHAR(50) NOT NULL
                    CHECK (type IN ('risk_assessment','gap_analysis','csms_assessment','network_segmentation','remediation','compliance_audit','consulting','custom')),
    status          VARCHAR(30) NOT NULL DEFAULT 'planning'
                    CHECK (status IN ('planning','active','in_progress','on_hold','completed','cancelled')),
    client_id       UUID REFERENCES {SCHEMA}.clients(id),
    owner_id        UUID,
    start_date      DATE,
    target_date     DATE,
    completed_at    TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_status ON {SCHEMA}.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON {SCHEMA}.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_type ON {SCHEMA}.projects(type);
