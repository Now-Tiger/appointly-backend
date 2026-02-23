-- =============================================================================
-- Appointly — Full Database Schema
-- =============================================================================
-- PostgreSQL 16+
-- This file is the canonical SQL representation of all tables required by the
-- Appointly Core API across all development phases (0–6). The Prisma schema
-- file (schema.prisma) is the authoritative source for migrations; this SQL
-- file serves as a readable reference and for manual review / RLS policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Phase 5: vector similarity for FAQ auto-reply
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
CREATE TYPE tenant_status AS ENUM ('ONBOARDING', 'ACTIVE', 'SUSPENDED', 'CHURNED');
CREATE TYPE subscription_plan AS ENUM ('STARTER', 'GROWTH', 'PRO', 'ENTERPRISE');
CREATE TYPE subscription_status AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');
CREATE TYPE staff_role AS ENUM ('OWNER', 'MANAGER', 'STAFF', 'READONLY');
CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE appointment_type AS ENUM ('INDIVIDUAL', 'GROUP', 'RECURRING');
CREATE TYPE day_of_week AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
CREATE TYPE notification_channel AS ENUM ('WHATSAPP', 'EMAIL', 'PUSH');
CREATE TYPE delivery_status AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');
CREATE TYPE webhook_event_status AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE integration_type AS ENUM ('GOOGLE_CALENDAR', 'OUTLOOK_CALENDAR', 'STRIPE', 'ZAPIER', 'MAKE');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- ---------------------------------------------------------------------------
-- Phase 6: Organizations (top-level entity for multi-branch / agency)
-- ---------------------------------------------------------------------------
CREATE TABLE organizations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Phase 0: Tenants
-- ---------------------------------------------------------------------------
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255)  NOT NULL,
    slug            VARCHAR(100)  NOT NULL UNIQUE,
    status          tenant_status NOT NULL DEFAULT 'ONBOARDING',
    organization_id UUID          REFERENCES organizations(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_organization ON tenants(organization_id);

-- ---------------------------------------------------------------------------
-- Phase 0: Business Profiles (one per tenant)
-- ---------------------------------------------------------------------------
CREATE TABLE business_profiles (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id                   UUID         NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    business_name               VARCHAR(255) NOT NULL,
    description                 TEXT,
    phone                       VARCHAR(20),
    email                       VARCHAR(255),
    website                     VARCHAR(500),
    address                     TEXT,
    city                        VARCHAR(100),
    state                       VARCHAR(100),
    country                     VARCHAR(100),
    postal_code                 VARCHAR(20),
    timezone                    VARCHAR(50)  NOT NULL DEFAULT 'UTC',
    whatsapp_phone_number_id    VARCHAR(50),
    whatsapp_business_account_id VARCHAR(50),
    whatsapp_verified           BOOLEAN      NOT NULL DEFAULT FALSE,
    logo_url                    VARCHAR(500),
    brand_color                 VARCHAR(7),
    custom_domain               VARCHAR(255),
    default_buffer_minutes      INT          NOT NULL DEFAULT 15,
    max_concurrent_bookings     INT          NOT NULL DEFAULT 1,
    locale                      VARCHAR(10)  NOT NULL DEFAULT 'en',
    onboarding_completed_at     TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Phase 6: Locations (multi-branch)
-- ---------------------------------------------------------------------------
CREATE TABLE locations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    address     TEXT,
    city        VARCHAR(100),
    state       VARCHAR(100),
    country     VARCHAR(100),
    postal_code VARCHAR(20),
    phone       VARCHAR(20),
    timezone    VARCHAR(50)  NOT NULL DEFAULT 'UTC',
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_locations_tenant ON locations(tenant_id);

-- ---------------------------------------------------------------------------
-- Phase 0: Staff Members
-- ---------------------------------------------------------------------------
CREATE TABLE staff_members (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id        UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_auth_id VARCHAR(255) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    full_name        VARCHAR(255) NOT NULL,
    phone            VARCHAR(20),
    role             staff_role   NOT NULL DEFAULT 'STAFF',
    avatar_url       VARCHAR(500),
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    location_id      UUID         REFERENCES locations(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, email)
);

CREATE INDEX idx_staff_members_tenant ON staff_members(tenant_id);
CREATE INDEX idx_staff_members_auth   ON staff_members(external_auth_id);

-- ---------------------------------------------------------------------------
-- Phase 1: Services (catalog of bookable services)
-- ---------------------------------------------------------------------------
CREATE TABLE services (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id        UUID             NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name             VARCHAR(255)     NOT NULL,
    description      TEXT,
    duration_minutes INT              NOT NULL,
    price            DECIMAL(10, 2)   NOT NULL DEFAULT 0,
    currency         VARCHAR(3)       NOT NULL DEFAULT 'USD',
    is_active        BOOLEAN          NOT NULL DEFAULT TRUE,
    sort_order       INT              NOT NULL DEFAULT 0,
    appointment_type appointment_type NOT NULL DEFAULT 'INDIVIDUAL',
    capacity_limit   INT,
    created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_tenant ON services(tenant_id);

-- ---------------------------------------------------------------------------
-- Phase 1: Customers (WhatsApp end-users of businesses)
-- ---------------------------------------------------------------------------
CREATE TABLE customers (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    whatsapp_phone_number   VARCHAR(20)    NOT NULL,
    full_name               VARCHAR(255),
    email                   VARCHAR(255),
    notes                   TEXT,
    locale                  VARCHAR(10)    NOT NULL DEFAULT 'en',
    total_appointments      INT            NOT NULL DEFAULT 0,
    total_no_shows          INT            NOT NULL DEFAULT 0,
    total_spent             DECIMAL(10, 2) NOT NULL DEFAULT 0,
    last_interaction_at     TIMESTAMPTZ,
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, whatsapp_phone_number)
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);

-- ---------------------------------------------------------------------------
-- Phase 4: Payment Intents
-- ---------------------------------------------------------------------------
CREATE TABLE payment_intents (
    id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_payment_intent_id  VARCHAR(255),
    stripe_payment_link_url   VARCHAR(500),
    amount                    DECIMAL(10, 2) NOT NULL,
    currency                  VARCHAR(3)     NOT NULL DEFAULT 'USD',
    status                    payment_status NOT NULL DEFAULT 'PENDING',
    refunded_amount           DECIMAL(10, 2) NOT NULL DEFAULT 0,
    paid_at                   TIMESTAMPTZ,
    refunded_at               TIMESTAMPTZ,
    created_at                TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_intents_stripe ON payment_intents(stripe_payment_intent_id);

-- ---------------------------------------------------------------------------
-- Phase 4: Recurring Appointment Series
-- ---------------------------------------------------------------------------
CREATE TABLE recurring_appointment_series (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_id      UUID         NOT NULL REFERENCES services(id),
    staff_id        UUID         NOT NULL REFERENCES staff_members(id),
    customer_id     UUID         NOT NULL REFERENCES customers(id),
    recurrence_rule VARCHAR(255) NOT NULL,
    start_date      TIMESTAMPTZ  NOT NULL,
    end_date        TIMESTAMPTZ,
    max_occurrences INT,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recurring_series_tenant ON recurring_appointment_series(tenant_id);

-- ---------------------------------------------------------------------------
-- Phase 1: Appointments (core aggregate)
-- ---------------------------------------------------------------------------
CREATE TABLE appointments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID               NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_id          UUID               NOT NULL REFERENCES services(id),
    staff_id            UUID               NOT NULL REFERENCES staff_members(id),
    customer_id         UUID               NOT NULL REFERENCES customers(id),
    recurring_series_id UUID               REFERENCES recurring_appointment_series(id) ON DELETE SET NULL,
    location_id         UUID               REFERENCES locations(id) ON DELETE SET NULL,
    status              appointment_status NOT NULL DEFAULT 'PENDING',
    start_time          TIMESTAMPTZ        NOT NULL,
    end_time            TIMESTAMPTZ        NOT NULL,
    notes               TEXT,
    no_show_risk_score  DOUBLE PRECISION,
    payment_intent_id   UUID               REFERENCES payment_intents(id) ON DELETE SET NULL,
    booked_via          VARCHAR(20)        NOT NULL DEFAULT 'whatsapp',
    cancelled_at        TIMESTAMPTZ,
    cancel_reason       VARCHAR(500),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, staff_id, start_time)
);

CREATE INDEX idx_appointments_tenant_status     ON appointments(tenant_id, status);
CREATE INDEX idx_appointments_tenant_start      ON appointments(tenant_id, start_time);
CREATE INDEX idx_appointments_tenant_staff_time ON appointments(tenant_id, staff_id, start_time);
CREATE INDEX idx_appointments_customer          ON appointments(customer_id);

-- ---------------------------------------------------------------------------
-- Phase 1: Business Hours (weekly schedule per tenant)
-- ---------------------------------------------------------------------------
CREATE TABLE business_hours (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    start_time VARCHAR(5)  NOT NULL,   -- HH:MM
    end_time   VARCHAR(5)  NOT NULL,   -- HH:MM
    is_enabled BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, day_of_week)
);

CREATE INDEX idx_business_hours_tenant ON business_hours(tenant_id);

-- ---------------------------------------------------------------------------
-- Phase 1: Staff Schedules (per-staff overrides)
-- ---------------------------------------------------------------------------
CREATE TABLE staff_schedules (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id   UUID        NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    start_time VARCHAR(5)  NOT NULL,
    end_time   VARCHAR(5)  NOT NULL,
    is_enabled BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (staff_id, day_of_week)
);

CREATE INDEX idx_staff_schedules_staff ON staff_schedules(staff_id);

-- ---------------------------------------------------------------------------
-- Phase 1: Blocked Slots (ad-hoc unavailability)
-- ---------------------------------------------------------------------------
CREATE TABLE blocked_slots (
    id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id                  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id                   UUID        REFERENCES staff_members(id) ON DELETE CASCADE,
    start_time                 TIMESTAMPTZ NOT NULL,
    end_time                   TIMESTAMPTZ NOT NULL,
    reason                     VARCHAR(500),
    is_all_day                 BOOLEAN     NOT NULL DEFAULT FALSE,
    external_calendar_event_id VARCHAR(255),
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blocked_slots_tenant_time ON blocked_slots(tenant_id, start_time, end_time);
CREATE INDEX idx_blocked_slots_staff       ON blocked_slots(staff_id);

-- ---------------------------------------------------------------------------
-- Phase 1: Notification Templates
-- ---------------------------------------------------------------------------
CREATE TABLE notification_templates (
    id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id                UUID                 NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name                     VARCHAR(255)         NOT NULL,
    channel                  notification_channel NOT NULL,
    subject                  VARCHAR(500),
    body                     TEXT                 NOT NULL,
    locale                   VARCHAR(10)          NOT NULL DEFAULT 'en',
    whatsapp_template_name   VARCHAR(255),
    whatsapp_template_status VARCHAR(50),
    is_active                BOOLEAN              NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_templates_tenant_channel ON notification_templates(tenant_id, channel);

-- ---------------------------------------------------------------------------
-- Phase 1: Delivery Attempts (notification audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE delivery_attempts (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id     UUID                 REFERENCES appointments(id) ON DELETE SET NULL,
    channel            notification_channel NOT NULL,
    recipient          VARCHAR(255)         NOT NULL,
    status             delivery_status      NOT NULL DEFAULT 'PENDING',
    external_message_id VARCHAR(255),
    idempotency_key    VARCHAR(255)         NOT NULL UNIQUE,
    payload            JSONB,
    error_message      TEXT,
    sent_at            TIMESTAMPTZ,
    delivered_at       TIMESTAMPTZ,
    failed_at          TIMESTAMPTZ,
    created_at         TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_attempts_appointment  ON delivery_attempts(appointment_id);
CREATE INDEX idx_delivery_attempts_idempotency  ON delivery_attempts(idempotency_key);
CREATE INDEX idx_delivery_attempts_status       ON delivery_attempts(status);

-- ---------------------------------------------------------------------------
-- Phase 2: Device Tokens (mobile push notifications)
-- ---------------------------------------------------------------------------
CREATE TABLE device_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id   UUID         NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    token      VARCHAR(500) NOT NULL,
    platform   VARCHAR(10)  NOT NULL,   -- 'ios' | 'android'
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE (staff_id, token)
);

CREATE INDEX idx_device_tokens_staff ON device_tokens(staff_id);

-- ---------------------------------------------------------------------------
-- Phase 2: Subscriptions (Stripe billing)
-- ---------------------------------------------------------------------------
CREATE TABLE subscriptions (
    id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id                 UUID                NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan                      subscription_plan   NOT NULL DEFAULT 'STARTER',
    status                    subscription_status NOT NULL DEFAULT 'TRIALING',
    stripe_customer_id        VARCHAR(255),
    stripe_subscription_id    VARCHAR(255),
    stripe_price_id           VARCHAR(255),
    monthly_appointment_limit INT,
    current_period_start      TIMESTAMPTZ,
    current_period_end        TIMESTAMPTZ,
    trial_ends_at             TIMESTAMPTZ,
    cancelled_at              TIMESTAMPTZ,
    created_at                TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_stripe_customer     ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

-- ---------------------------------------------------------------------------
-- Phase 2: Invoices
-- ---------------------------------------------------------------------------
CREATE TABLE invoices (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id         UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255),
    amount_due        DECIMAL(10, 2) NOT NULL,
    amount_paid       DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency          VARCHAR(3)     NOT NULL DEFAULT 'USD',
    status            VARCHAR(50)    NOT NULL,
    period_start      TIMESTAMPTZ    NOT NULL,
    period_end        TIMESTAMPTZ    NOT NULL,
    paid_at           TIMESTAMPTZ,
    invoice_pdf_url   VARCHAR(500),
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);

-- ---------------------------------------------------------------------------
-- Phase 2: Usage Records (per billing period)
-- ---------------------------------------------------------------------------
CREATE TABLE usage_records (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id              UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    period_start           TIMESTAMPTZ NOT NULL,
    period_end             TIMESTAMPTZ NOT NULL,
    appointment_count      INT         NOT NULL DEFAULT 0,
    whatsapp_message_count INT         NOT NULL DEFAULT 0,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, period_start)
);

CREATE INDEX idx_usage_records_tenant ON usage_records(tenant_id);

-- ---------------------------------------------------------------------------
-- Phase 1: Webhook Events (inbound event log)
-- ---------------------------------------------------------------------------
CREATE TABLE webhook_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source          VARCHAR(50)          NOT NULL,   -- 'whatsapp' | 'stripe'
    external_id     VARCHAR(255)         NOT NULL,
    idempotency_key VARCHAR(255)         NOT NULL UNIQUE,
    status          webhook_event_status NOT NULL DEFAULT 'RECEIVED',
    payload         JSONB                NOT NULL,
    error_message   TEXT,
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_idempotency    ON webhook_events(idempotency_key);
CREATE INDEX idx_webhook_events_source_ext     ON webhook_events(source, external_id);

-- ---------------------------------------------------------------------------
-- Phase 2: Analytics Daily (pre-aggregated)
-- ---------------------------------------------------------------------------
CREATE TABLE analytics_daily (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID           NOT NULL,
    date                DATE           NOT NULL,
    total_bookings      INT            NOT NULL DEFAULT 0,
    completed_bookings  INT            NOT NULL DEFAULT 0,
    cancelled_bookings  INT            NOT NULL DEFAULT 0,
    no_shows            INT            NOT NULL DEFAULT 0,
    revenue_collected   DECIMAL(10, 2) NOT NULL DEFAULT 0,
    peak_hour           INT,
    top_service_id      UUID,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, date)
);

CREATE INDEX idx_analytics_daily_tenant_date ON analytics_daily(tenant_id, date);

-- ---------------------------------------------------------------------------
-- Phase 3: Audit Log (immutable)
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_id    UUID         NOT NULL,
    actor_type  VARCHAR(20)  NOT NULL,   -- 'staff' | 'system' | 'customer'
    action      audit_action NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID         NOT NULL,
    before      JSONB,
    after       JSONB,
    metadata    JSONB,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_entity ON audit_logs(tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_logs_tenant_time   ON audit_logs(tenant_id, created_at);

-- ---------------------------------------------------------------------------
-- Phase 4: Waiting List
-- ---------------------------------------------------------------------------
CREATE TABLE waiting_list_entries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    appointment_id  UUID        REFERENCES appointments(id) ON DELETE SET NULL,
    customer_id     UUID        NOT NULL REFERENCES customers(id),
    service_id      UUID        NOT NULL REFERENCES services(id),
    requested_date  TIMESTAMPTZ NOT NULL,
    position        INT         NOT NULL,
    notified_at     TIMESTAMPTZ,
    promoted_at     TIMESTAMPTZ,
    expired_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_waiting_list_tenant_service_date ON waiting_list_entries(tenant_id, service_id, requested_date);

-- ---------------------------------------------------------------------------
-- Phase 4: Integration Connections (Google Calendar, Outlook, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE integration_connections (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID             NOT NULL,
    staff_id            UUID,
    type                integration_type NOT NULL,
    access_token        TEXT,
    refresh_token       TEXT,
    external_account_id VARCHAR(255),
    token_expires_at    TIMESTAMPTZ,
    is_active           BOOLEAN          NOT NULL DEFAULT TRUE,
    last_sync_at        TIMESTAMPTZ,
    sync_error          TEXT,
    created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, staff_id, type)
);

CREATE INDEX idx_integration_connections_tenant ON integration_connections(tenant_id);

-- ---------------------------------------------------------------------------
-- Phase 4: API Keys (public API access)
-- ---------------------------------------------------------------------------
CREATE TABLE api_keys (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    key_hash    VARCHAR(255) NOT NULL UNIQUE,
    prefix      VARCHAR(10)  NOT NULL,
    last_used_at TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_tenant  ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_hash    ON api_keys(key_hash);

-- ---------------------------------------------------------------------------
-- Phase 4: Outbound Webhook Configs
-- ---------------------------------------------------------------------------
CREATE TABLE outbound_webhook_configs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id  UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    url        VARCHAR(500) NOT NULL,
    secret     VARCHAR(255) NOT NULL,
    events     TEXT[]       NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbound_webhook_configs_tenant ON outbound_webhook_configs(tenant_id);

-- ---------------------------------------------------------------------------
-- Phase 4: Outbound Webhook Deliveries
-- ---------------------------------------------------------------------------
CREATE TABLE outbound_webhook_deliveries (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id    UUID         NOT NULL REFERENCES outbound_webhook_configs(id) ON DELETE CASCADE,
    event_type   VARCHAR(100) NOT NULL,
    payload      JSONB        NOT NULL,
    http_status  INT,
    response     TEXT,
    attempts     INT          NOT NULL DEFAULT 0,
    succeeded_at TIMESTAMPTZ,
    failed_at    TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbound_webhook_deliveries_config ON outbound_webhook_deliveries(config_id);

-- ---------------------------------------------------------------------------
-- Phase 5: FAQs (with vector embedding for similarity search)
-- ---------------------------------------------------------------------------
CREATE TABLE faqs (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id            UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    question             TEXT           NOT NULL,
    answer               TEXT           NOT NULL,
    -- embedding         vector(1536),   -- uncomment when pgvector extension is enabled
    similarity_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    is_active            BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_faqs_tenant ON faqs(tenant_id);

-- ===========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ===========================================================================
-- RLS ensures tenant isolation at the database level. The application sets
-- the session variable `app.current_tenant_id` before executing queries.
-- ===========================================================================

-- Helper function to get current tenant from session
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', TRUE)::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS policies (tenant_id = current_tenant_id())
CREATE POLICY tenant_isolation ON tenants
    USING (id = current_tenant_id());

CREATE POLICY tenant_isolation ON business_profiles
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON staff_members
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON services
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON customers
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON appointments
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON business_hours
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON blocked_slots
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON notification_templates
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON subscriptions
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON invoices
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON usage_records
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON analytics_daily
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON audit_logs
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON waiting_list_entries
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON api_keys
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON outbound_webhook_configs
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON faqs
    USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON locations
    USING (tenant_id = current_tenant_id());

-- staff_schedules use staff_id, policy joins through staff_members
CREATE POLICY tenant_isolation ON staff_schedules
    USING (staff_id IN (
        SELECT id FROM staff_members WHERE tenant_id = current_tenant_id()
    ));

-- ===========================================================================
-- TRIGGERS: auto-update updated_at columns
-- ===========================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_business_profiles_updated_at BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_staff_members_updated_at BEFORE UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_business_hours_updated_at BEFORE UPDATE ON business_hours FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_staff_schedules_updated_at BEFORE UPDATE ON staff_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_blocked_slots_updated_at BEFORE UPDATE ON blocked_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_device_tokens_updated_at BEFORE UPDATE ON device_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_usage_records_updated_at BEFORE UPDATE ON usage_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_analytics_daily_updated_at BEFORE UPDATE ON analytics_daily FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_waiting_list_entries_updated_at BEFORE UPDATE ON waiting_list_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_integration_connections_updated_at BEFORE UPDATE ON integration_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_outbound_webhook_configs_updated_at BEFORE UPDATE ON outbound_webhook_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payment_intents_updated_at BEFORE UPDATE ON payment_intents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_recurring_series_updated_at BEFORE UPDATE ON recurring_appointment_series FOR EACH ROW EXECUTE FUNCTION update_updated_at();
