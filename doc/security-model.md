# IEC 62443 Platform — Security Architecture

> Version: 1.0 | Status: Draft | Last Updated: 2026-07-31

---

## 1. Security Philosophy

As a platform that manages OT cybersecurity assessments, the platform itself must exemplify the highest security standards. The security architecture follows:

- **Defense in depth** — multiple overlapping security controls
- **Zero trust** — no implicit trust; every request authenticated and authorized
- **Least privilege** — minimal permissions by default
- **Secure by design** — security requirements drive architecture decisions
- **Compliance alignment** — ISO 27001, SOC 2 Type II, GDPR

---

## 2. Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Layer 1: Network Security                                  │   │
│  │  • CloudFlare WAF / DDoS protection                        │   │
│  │  • VPC with private subnets                                 │   │
│  │  • Security groups (deny-all, allow-explicit)               │   │
│  │  • Network ACLs                                             │   │
│  │  • IDS/IPS (Suricata / AWS GuardDuty)                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Layer 2: Transport Security                                │   │
│  │  • TLS 1.3 only (no TLS 1.2 or below)                      │   │
│  │  • HSTS with preload (max-age: 63072000)                   │   │
│  │  • Certificate pinning for mobile clients                   │   │
│  │  • mTLS for service-to-service communication                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Layer 3: Application Security                              │   │
│  │  • JWT authentication (short-lived tokens)                  │   │
│  │  • RBAC authorization                                       │   │
│  │  • Input validation (Zod schemas)                           │   │
│  │  • Output encoding (context-aware)                          │   │
│  │  • CSRF protection (SameSite cookies + token)               │   │
│  │  • Rate limiting (per-endpoint, per-user)                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Layer 4: Data Security                                     │   │
│  │  • Encryption at rest (AES-256-GCM)                        │   │
│  │  • Encryption in transit (TLS 1.3)                         │   │
│  │  • Column-level encryption (PII, secrets)                   │   │
│  │  • Key management (AWS KMS / HashiCorp Vault)              │   │
│  │  • Data classification & labeling                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Layer 5: Audit & Monitoring                                │   │
│  │  • Immutable audit log (hash-chained)                       │   │
│  │  • Centralized logging (structured JSON)                    │   │
│  │  • SIEM integration                                         │   │
│  │  • Anomaly detection                                        │   │
│  │  • Real-time alerting                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Authentication Security

### 3.1 Password Policy

| Requirement    | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Minimum length | 14 characters                                          |
| Complexity     | At least 1 uppercase, 1 lowercase, 1 digit, 1 special  |
| Breach check   | Checked against Have I Been Pwned API (k-anonymity)    |
| History        | Cannot reuse last 12 passwords                         |
| Expiry         | Configurable per tenant (default: 90 days)             |
| Hashing        | Argon2id (memory: 64MB, iterations: 3, parallelism: 4) |

### 3.2 Multi-Factor Authentication

| Method             | Priority      | Notes                                              |
| ------------------ | ------------- | -------------------------------------------------- |
| **WebAuthn/FIDO2** | Preferred     | Hardware keys (YubiKey) or platform authenticators |
| **TOTP**           | Standard      | RFC 6238, 30-second window, 6-digit code           |
| **Email OTP**      | Backup        | 8-character code, 10-minute expiry, rate-limited   |
| **SMS**            | Not supported | Vulnerable to SIM-swapping; not offered            |

**MFA Enforcement:**

- Required for: Tenant Owners, Tenant Admins, Platform Admins
- Optional (recommended) for: all other roles
- Configurable per-tenant policy (mandatory for all users)

### 3.3 Session Management

| Parameter              | Value                                        |
| ---------------------- | -------------------------------------------- |
| Access token TTL       | 15 minutes                                   |
| Refresh token TTL      | 7 days                                       |
| Refresh token rotation | Every use (old token invalidated)            |
| Refresh token family   | Detected if stolen token reused (revoke all) |
| Session binding        | IP address + User-Agent fingerprint          |
| Concurrent sessions    | Configurable (default: 5 per user)           |
| Idle timeout           | 30 minutes (configurable per tenant)         |
| Absolute timeout       | 12 hours (configurable per tenant)           |

### 3.4 SSO Integration

| Provider             | Protocol        | Notes                  |
| -------------------- | --------------- | ---------------------- |
| Azure AD (Entra ID)  | OIDC + SAML 2.0 | Enterprise standard    |
| Okta                 | OIDC            | SaaS identity          |
| Keycloak             | OIDC + SAML 2.0 | Self-hosted / on-prem  |
| Google Workspace     | OIDC            | Optional               |
| Generic SAML 2.0 IdP | SAML 2.0        | Custom enterprise IdPs |

---

## 4. Data Security

### 4.1 Encryption at Rest

```
┌────────────────────────────────────────────────┐
│              Encryption Hierarchy               │
│                                                 │
│  ┌─────────────┐                               │
│  │  Root Key   │  (AWS KMS / HSM-backed)      │
│  │  (per region)│                               │
│  └──────┬──────┘                               │
│         │                                       │
│  ┌──────▼──────┐                               │
│  │ Tenant Key  │  (one per tenant, rotated     │
│  │ (DEK)       │   annually)                   │
│  └──────┬──────┘                               │
│         │                                       │
│  ┌──────▼──────────────────────┐               │
│  │ Data encrypted with DEK    │               │
│  │ • Database columns (PII)   │               │
│  │ • Evidence files (S3 SSE)  │               │
│  │ • Backups                  │               │
│  │ • Export files             │               │
│  └─────────────────────────────┘               │
└────────────────────────────────────────────────┘
```

### 4.2 Data Classification

| Classification   | Examples                                        | Encryption                        | Access                           |
| ---------------- | ----------------------------------------------- | --------------------------------- | -------------------------------- |
| **Confidential** | Evidence files, assessment data, risk registers | AES-256 + tenant DEK              | RBAC + project scope             |
| **Restricted**   | PII (email, name), MFA secrets, API keys        | AES-256 + column-level encryption | Tenant Admin only for PII export |
| **Internal**     | User preferences, UI settings                   | AES-256 (database-level)          | Authenticated user               |
| **Public**       | Platform name, documentation                    | None                              | Unauthenticated                  |

### 4.3 PII Protection

```
Fields classified as PII:
  • user.email
  • user.first_name / user.last_name
  • audit_events.ip_address

Protection measures:
  • Encrypted at column level (pgcrypto or application-level)
  • Masked in API responses for Viewer role
  • Not included in error responses or logs
  • Subject to GDPR right-to-erasure (tenant-scoped)
  • Audit trail preserved (pseudonymized, not deleted)
```

### 4.4 Key Management

| Key Type                    | Storage                       | Rotation                    | Access                 |
| --------------------------- | ----------------------------- | --------------------------- | ---------------------- |
| Root encryption key         | AWS KMS (HSM-backed)          | Annual                      | Platform security team |
| Tenant data encryption keys | AWS KMS (wrapped by root key) | Annual + on-demand          | Application service    |
| JWT signing keys            | AWS KMS                       | 90 days (auto-rotated)      | Auth service only      |
| Evidence file encryption    | S3 SSE-KMS                    | Per-tenant key              | Evidence service       |
| API key hashing             | Application (Argon2id)        | N/A (hashed, not encrypted) | Auth middleware        |

---

## 5. Application Security Controls

### 5.1 Input Validation

```
Strategy: Validate at every boundary

┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────►│   API    │────►│ Service  │
│  (Zod)   │     │  (Zod)   │     │ (Domain  │
│          │     │          │     │  rules)  │
└──────────┘     └──────────┘     └──────────┘

Rules:
  • All inputs validated with Zod schemas at API boundary
  • Whitelist validation (allowed values) preferred over blacklist
  • SQL injection: parameterized queries only (no string concatenation)
  • XSS: output encoding + Content-Security-Policy headers
  • File uploads: type validation (MIME + magic bytes), size limits
  • Path traversal: no user-controlled file paths
```

### 5.2 Content Security Policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.iec62443-platform.io wss://ws.iec62443-platform.io;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

### 5.3 HTTP Security Headers

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0  (rely on CSP instead)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Cache-Control: no-store (for authenticated responses)
```

### 5.4 File Upload Security

| Control               | Value                                                           |
| --------------------- | --------------------------------------------------------------- |
| Max file size         | 100 MB (evidence), 50 MB (imports)                              |
| Allowed types         | Whitelist: PDF, DOCX, XLSX, PNG, JPG, CSV, JSON, TXT, PCAP, XML |
| Virus scanning        | ClamAV scan on upload (quarantine if positive)                  |
| Filename sanitization | Strip path separators, limit length, UUID storage key           |
| Storage               | S3 with server-side encryption, pre-signed URLs for download    |
| Download              | Pre-signed URLs (15-min expiry), no direct S3 access            |

---

## 6. Audit & Compliance

### 6.1 Audit Event Schema

```json
{
  "id": 12345,
  "tenant_id": "tenant-uuid",
  "user_id": "user-uuid",
  "event_type": "finding.status_changed",
  "entity_type": "finding",
  "entity_id": "finding-uuid",
  "action": "update",
  "details": {
    "field": "status",
    "old_value": "open",
    "new_value": "acknowledged"
  },
  "ip_address": "203.0.113.42",
  "user_agent": "Mozilla/5.0 ...",
  "previous_hash": "a1b2c3d4...",
  "event_hash": "e5f6g7h8...",
  "created_at": "2026-07-31T10:00:00Z"
}
```

### 6.2 Hash Chain Integrity

```
Event N hash = SHA-256(
    Event N data +
    Event (N-1) hash
)

Verification:
  • Re-compute hash chain from first event
  • Compare stored hashes with computed hashes
  • Any mismatch = tamper detected
  • Alert security team + mark chain as broken

Periodic verification:
  • Automated daily chain verification (background job)
  • On-demand verification via admin API
  • Results stored separately (immutable log)
```

### 6.3 Audit Events Tracked

**Authentication:**

- Login success/failure
- Token refresh
- MFA enrollment/verification/challenge
- Password change/reset
- SSO initiation
- Session termination

**Data Operations:**

- Create/Read/Update/Delete on all domain entities
- Bulk operations
- Data export
- Evidence upload/download
- File integrity verification

**Administrative:**

- Role assignment/revocation
- User invitation/removal
- Tenant configuration changes
- API key creation/revocation
- Integration configuration
- Policy approval

### 6.4 Compliance Mappings

| Requirement              | Standard         | Implementation                                 |
| ------------------------ | ---------------- | ---------------------------------------------- |
| Access control           | ISO 27001 A.9    | RBAC + MFA + session management                |
| Encryption               | ISO 27001 A.10   | AES-256 at rest, TLS 1.3 in transit            |
| Audit logging            | ISO 27001 A.12.4 | Hash-chained immutable audit log               |
| Vulnerability management | ISO 27001 A.12.6 | Dependency scanning, SAST, DAST                |
| Network security         | ISO 27001 A.13   | VPC, WAF, IDS/IPS, security groups             |
| Data protection          | GDPR Art. 32     | Encryption, access control, pseudonymization   |
| Right to erasure         | GDPR Art. 17     | User data deletion (audit trail pseudonymized) |
| Incident response        | SOC 2 CC7.3      | Alerting, runbooks, post-incident review       |
| Change management        | SOC 2 CC8.1      | Git-based workflow, code review, CI/CD gates   |

---

## 7. Vulnerability Management

### 7.1 SDLC Security Gates

```
┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│  Code  │───►│  PR    │───►│  CI    │───►│  CD    │───►│  Prod  │
│  Dev   │    │ Review │    │  Build │    │ Staging│    │ Deploy │
└────────┘    └────────┘    └────────┘    └────────┘    └────────┘
     │             │             │             │             │
     ▼             ▼             ▼             ▼             ▼
  IDE security   Security     SAST          DAST         Continuous
  linting        review       Dependency    Penetration  monitoring
  (Semgrep)      (required    scanning      testing      (runtime)
                  for auth/   (Snyk/        (OWASP
                  crypto      Trivy)        ZAP)
                  changes)
```

### 7.2 Dependency Security

| Control             | Implementation                                             |
| ------------------- | ---------------------------------------------------------- |
| Dependency scanning | Snyk / Dependabot — on every PR and nightly                |
| License compliance  | FOSSA / license-checker — block copyleft licenses          |
| Container scanning  | Trivy — base image + layer scanning                        |
| SBOM generation     | CycloneDX format, generated on every release               |
| Patch SLA           | Critical: 24h, High: 7 days, Medium: 30 days, Low: 90 days |

---

## 8. Incident Response

### 8.1 Severity Classification

| Severity          | Definition                                        | Response Time  | Example                                  |
| ----------------- | ------------------------------------------------- | -------------- | ---------------------------------------- |
| **P1 — Critical** | Active breach, data exfiltration, service down    | 15 minutes     | Ransomware, credential compromise        |
| **P2 — High**     | Vulnerability exploitable, partial service impact | 1 hour         | Unpatched RCE, auth bypass               |
| **P3 — Medium**   | Potential risk, no active exploitation            | 4 hours        | Information disclosure, misconfiguration |
| **P4 — Low**      | Minor issue, cosmetic or defense-in-depth gap     | 1 business day | Missing security header, verbose errors  |

### 8.2 Response Process

```
[Detection] ──► [Triage] ──► [Containment] ──► [Eradication]
     │              │              │                  │
     ▼              ▼              ▼                  ▼
  Alert from    Classify       Isolate affected   Remove threat
  monitoring,   severity,      systems, revoke    actor, patch
  report, or    notify         compromised        vulnerability
  disclosure    stakeholders   credentials

                                                    │
                                    ┌───────────────┘
                                    ▼
                          [Recovery] ──► [Post-Incident]
                              │               │
                              ▼               ▼
                         Restore from    Retrospective,
                         clean backup,   update controls,
                         verify integrity regulatory
                                         notification
```

### 8.3 Data Breach Notification

| Regulation      | Notification Deadline | Authority                       |
| --------------- | --------------------- | ------------------------------- |
| GDPR            | 72 hours              | Supervisory Authority           |
| SOC 2           | Per policy            | Affected customers              |
| State laws (US) | Varies by state       | State AG + affected individuals |

---

## 9. Penetration Testing

| Scope                | Frequency                     | Provider                              |
| -------------------- | ----------------------------- | ------------------------------------- |
| External API         | Annual + after major releases | Third-party firm                      |
| Internal application | Annual                        | Third-party firm                      |
| Infrastructure       | Semi-annual                   | Third-party firm + automated scanning |
| Social engineering   | Annual                        | Third-party firm                      |
| Red team exercise    | Annual (Enterprise)           | Third-party firm                      |

Results shared with Enterprise customers under NDA.

---

## 10. Data Residency & Sovereignty

| Deployment  | Data Location              | Compliance              |
| ----------- | -------------------------- | ----------------------- |
| EU cloud    | eu-west-1 (Ireland)        | GDPR, EU data residency |
| US cloud    | us-east-1 (Virginia)       | SOC 2, FedRAMP (future) |
| APAC cloud  | ap-southeast-1 (Singapore) | PDPA, local regulations |
| On-premises | Customer-controlled        | Full data sovereignty   |

Cross-region data transfer:

- Only with explicit tenant consent
- Encrypted in transit (TLS 1.3) + at rest
- Standard Contractual Clauses (SCCs) for international transfers

---

_Next: [Technology Stack →](tech-stack.md)_
