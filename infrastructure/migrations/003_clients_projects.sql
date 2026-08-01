-- Migration: 003_clients_projects
-- Adds client and project tables to the tenant schema.
-- Must be run inside each tenant schema (e.g. SET search_path TO tenant_demo).

-- ── Clients ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clients (
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
                    CHECK (status IN ('active', 'inactive', 'archived')),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Projects ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    type            VARCHAR(50) NOT NULL
                    CHECK (type IN ('risk_assessment', 'gap_analysis', 'csms_assessment',
                                    'network_segmentation', 'remediation', 'compliance_audit',
                                    'consulting', 'custom')),
    status          VARCHAR(30) NOT NULL DEFAULT 'planning'
                    CHECK (status IN ('planning', 'active', 'in_progress', 'on_hold',
                                      'completed', 'cancelled')),
    client_id       UUID REFERENCES clients(id),
    owner_id        UUID,
    start_date      DATE,
    target_date     DATE,
    completed_at    TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
