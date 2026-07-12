-- ============================================================================
-- ECOSPHERE ESG MANAGEMENT PLATFORM
-- INITIAL POSTGRESQL DATABASE SCHEMA (schema.sql)
-- ============================================================================

-- Enable pgcrypto for gen_random_uuid() support (standard for PG 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('Admin', 'ESG_Manager', 'Employee');

CREATE TYPE category_type AS ENUM ('CSR_Activity', 'Challenge');

CREATE TYPE operation_type AS ENUM ('Purchase', 'Manufacturing', 'Expense', 'Fleet');

CREATE TYPE emission_source AS ENUM ('EPA', 'Ember', 'IPCC', 'DEFRA', 'Custom');

CREATE TYPE goal_metric AS ENUM ('total_emissions', 'emissions_per_employee');

CREATE TYPE approval_status AS ENUM ('Pending', 'Approved', 'Rejected');

CREATE TYPE challenge_difficulty AS ENUM ('Easy', 'Medium', 'Hard');

CREATE TYPE challenge_status AS ENUM ('Draft', 'Active', 'Under_Review', 'Completed', 'Archived');

CREATE TYPE policy_category AS ENUM ('E', 'S', 'G');

CREATE TYPE policy_status AS ENUM ('Draft', 'Published', 'Archived');

CREATE TYPE audit_status AS ENUM ('Planned', 'In_Progress', 'Completed');

CREATE TYPE compliance_severity AS ENUM ('Low', 'Medium', 'High', 'Critical');

CREATE TYPE compliance_status AS ENUM ('Open', 'Resolved');

CREATE TYPE xp_source_type AS ENUM ('challenge', 'csr', 'redemption', 'adjustment');

CREATE TYPE reward_status AS ENUM ('Active', 'Inactive', 'Out_Of_Stock');

CREATE TYPE notification_event_type AS ENUM ('compliance_issue_raised', 'participation_decision', 'policy_ack_reminder', 'badge_unlocked');

-- ============================================================================
-- TABLES DEFINITION
-- ============================================================================

-- 1. Users Table (Authentication and Authorization)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Employee',
    github_id VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Departments Table (Organizational Hierarchy)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    head_id UUID, -- Foreign Key to employees (circular dependency, added via ALTER later)
    parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    country_code CHAR(2) NOT NULL,
    employee_count INT NOT NULL DEFAULT 0 CHECK (employee_count >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Employees Table (Staff profile)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    gender VARCHAR(50),
    hire_date DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Complete circular dependency for Departments (head_id referencing employees)
ALTER TABLE departments
ADD CONSTRAINT fk_departments_head_id
FOREIGN KEY (head_id) REFERENCES employees(id) ON DELETE SET NULL;

-- 4. Categories Table (Shared taxonomy for CSR Activities & Challenges)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type category_type NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_categories_name_type UNIQUE (name, type)
);

-- 5. Products Table (ERP Product Master)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    default_unit VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Product ESG Profiles Table (Product sustainability credentials)
CREATE TABLE product_esg_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    carbon_intensity DECIMAL(12, 4) NOT NULL CHECK (carbon_intensity >= 0),
    intensity_unit VARCHAR(50) NOT NULL,
    recyclable BOOLEAN NOT NULL DEFAULT FALSE,
    eco_certified BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Operation Records Table (ERP source transactions layer)
CREATE TABLE operation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type operation_type NOT NULL,
    record_date DATE NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(12, 4) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Emission Factors Table (Carbon parameters reference)
CREATE TABLE emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    region VARCHAR(50) NOT NULL,
    factor_value DECIMAL(12, 6) NOT NULL CHECK (factor_value >= 0),
    source emission_source NOT NULL,
    valid_year INT NOT NULL,
    reference_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_emission_factors_lookup UNIQUE (activity_type, region, unit, valid_year)
);

-- 9. Carbon Transactions Table (Emission calculations ledger)
CREATE TABLE carbon_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_record_id UUID REFERENCES operation_records(id) ON DELETE SET NULL,
    emission_factor_id UUID NOT NULL REFERENCES emission_factors(id) ON DELETE RESTRICT,
    factor_value_snapshot DECIMAL(12, 6) NOT NULL CHECK (factor_value_snapshot >= 0),
    quantity DECIMAL(12, 4) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    calculated_emission DECIMAL(12, 4) NOT NULL CHECK (calculated_emission >= 0),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    txn_date DATE NOT NULL,
    auto_calculated BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Sustainability Goals Table (Sustainability Targets)
CREATE TABLE sustainability_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE, -- NULL = org-wide
    metric goal_metric NOT NULL,
    baseline_value DECIMAL(12, 4) NOT NULL CHECK (baseline_value >= 0),
    target_value DECIMAL(12, 4) NOT NULL CHECK (target_value >= 0),
    period_year INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. CSR Activities Table (Corporate Social Responsibility events catalog)
CREATE TABLE csr_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    activity_date DATE NOT NULL,
    points_value INT NOT NULL CHECK (points_value >= 0),
    evidence_required BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Employee Participation Table (CSR engagements)
CREATE TABLE employee_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    csr_activity_id UUID NOT NULL REFERENCES csr_activities(id) ON DELETE CASCADE,
    proof_url VARCHAR(500),
    approval_status approval_status NOT NULL DEFAULT 'Pending',
    points_earned INT NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    completion_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_employee_participation UNIQUE (employee_id, csr_activity_id)
);

-- 13. Diversity Metrics Table (Social pillar reporting data)
CREATE TABLE diversity_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    period VARCHAR(50) NOT NULL, -- e.g., '2026-Q1', '2026-YTD'
    headcount INT NOT NULL DEFAULT 0 CHECK (headcount >= 0),
    female_count INT NOT NULL DEFAULT 0 CHECK (female_count >= 0),
    male_count INT NOT NULL DEFAULT 0 CHECK (male_count >= 0),
    other_count INT NOT NULL DEFAULT 0 CHECK (other_count >= 0),
    pay_gap_pct DECIMAL(5, 2) CHECK (pay_gap_pct BETWEEN -100.00 AND 100.00),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_diversity_metric_dept_period UNIQUE (department_id, period),
    CONSTRAINT chk_headcount_sum CHECK (female_count + male_count + other_count = headcount)
);

-- 14. Training Records Table (Training program completions tracking)
CREATE TABLE training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    training_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    completed_at TIMESTAMPTZ,
    due_date DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. ESG Policies Table (Governance policy directives)
CREATE TABLE esg_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    category policy_category NOT NULL,
    version VARCHAR(50) NOT NULL,
    status policy_status NOT NULL DEFAULT 'Draft',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Policy Acknowledgements Table (Employee governance agreements)
CREATE TABLE policy_acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES esg_policies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_policy_acknowledgement UNIQUE (policy_id, employee_id)
);

-- 17. Audits Table (Governance audits registry)
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope VARCHAR(255) NOT NULL,
    auditor_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    audit_date DATE NOT NULL,
    status audit_status NOT NULL DEFAULT 'Planned',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Compliance Issues Table (Governance violations logs)
CREATE TABLE compliance_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    severity compliance_severity NOT NULL,
    description TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT, -- Assignee
    due_date DATE NOT NULL,
    status compliance_status NOT NULL DEFAULT 'Open',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. XP Events Table (Append-only gamification point ledger)
CREATE TABLE xp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    delta INT NOT NULL, -- positive for credit, negative for debits
    source xp_source_type NOT NULL,
    source_id UUID, -- points to employee_participations.id, challenge_participations.id or reward_redemptions.id
    note VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Challenges Table (Gamified sustainability activities)
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    xp_reward INT NOT NULL CHECK (xp_reward >= 0),
    difficulty challenge_difficulty NOT NULL,
    evidence_required BOOLEAN NOT NULL DEFAULT FALSE,
    deadline DATE NOT NULL,
    status challenge_status NOT NULL DEFAULT 'Draft',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Challenge Participations Table (Employee challenge completions)
CREATE TABLE challenge_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    progress DECIMAL(5, 2) NOT NULL DEFAULT 0.00 CHECK (progress BETWEEN 0.00 AND 100.00),
    proof_url VARCHAR(500),
    approval_status approval_status NOT NULL DEFAULT 'Pending',
    xp_awarded INT NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_challenge_participation UNIQUE (challenge_id, employee_id)
);

-- 22. Badges Table (Achievement badges metadata)
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255),
    unlock_rule JSONB NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. Employee Badges Table (Employee unlocked achievements)
CREATE TABLE employee_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_employee_badge UNIQUE (employee_id, badge_id)
);

-- 24. Rewards Table (Point store catalog catalog)
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    points_required INT NOT NULL CHECK (points_required >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    status reward_status NOT NULL DEFAULT 'Active',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. Reward Redemptions Table (Catalog orders transaction ledger)
CREATE TABLE reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    points_deducted INT NOT NULL CHECK (points_deducted >= 0),
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. Department Scores Table (Materialized pillar scores)
CREATE TABLE department_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    environmental_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00 CHECK (environmental_score BETWEEN 0.00 AND 100.00),
    social_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00 CHECK (social_score BETWEEN 0.00 AND 100.00),
    governance_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00 CHECK (governance_score BETWEEN 0.00 AND 100.00),
    total_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00 CHECK (total_score BETWEEN 0.00 AND 100.00),
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 27. ESG Configuration Table (System global configuration singleton)
CREATE TABLE esg_configurations (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    env_weight DECIMAL(3, 2) NOT NULL DEFAULT 0.40 CHECK (env_weight BETWEEN 0.00 AND 1.00),
    social_weight DECIMAL(3, 2) NOT NULL DEFAULT 0.30 CHECK (social_weight BETWEEN 0.00 AND 1.00),
    gov_weight DECIMAL(3, 2) NOT NULL DEFAULT 0.30 CHECK (gov_weight BETWEEN 0.00 AND 1.00),
    auto_emission_calc BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_required BOOLEAN NOT NULL DEFAULT FALSE,
    badge_auto_award BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT singleton_id CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid),
    CONSTRAINT weight_sum_check CHECK (env_weight + social_weight + gov_weight = 1.00)
);

-- 28. Notification Settings Table (Employee preferences)
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    event_type notification_event_type NOT NULL,
    in_app BOOLEAN NOT NULL DEFAULT TRUE,
    email BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_notification_setting UNIQUE (employee_id, event_type)
);

-- 29. Notifications Table (Sent alerts inbox)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type notification_event_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    related_table VARCHAR(100),
    related_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Common trigger function to set updated_at = NOW()
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach trigger to tables requiring updated_at updates
CREATE TRIGGER tr_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_departments_modtime BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_employees_modtime BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_categories_modtime BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_product_esg_profiles_modtime BEFORE UPDATE ON product_esg_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_operation_records_modtime BEFORE UPDATE ON operation_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_emission_factors_modtime BEFORE UPDATE ON emission_factors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_carbon_transactions_modtime BEFORE UPDATE ON carbon_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_sustainability_goals_modtime BEFORE UPDATE ON sustainability_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_csr_activities_modtime BEFORE UPDATE ON csr_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_employee_participations_modtime BEFORE UPDATE ON employee_participations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_diversity_metrics_modtime BEFORE UPDATE ON diversity_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_training_records_modtime BEFORE UPDATE ON training_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_esg_policies_modtime BEFORE UPDATE ON esg_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_policy_acknowledgements_modtime BEFORE UPDATE ON policy_acknowledgements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_audits_modtime BEFORE UPDATE ON audits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_compliance_issues_modtime BEFORE UPDATE ON compliance_issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_challenges_modtime BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_challenge_participations_modtime BEFORE UPDATE ON challenge_participations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_badges_modtime BEFORE UPDATE ON badges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_rewards_modtime BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_esg_configurations_modtime BEFORE UPDATE ON esg_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_notification_settings_modtime BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEX RECOMMENDATIONS FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Foreign Keys indexes (speeds up JOINs and cascades)
CREATE INDEX idx_departments_parent_dept ON departments(parent_department_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_operation_records_department ON operation_records(department_id);
CREATE INDEX idx_operation_records_product ON operation_records(product_id);
CREATE INDEX idx_carbon_transactions_op_rec ON carbon_transactions(operation_record_id);
CREATE INDEX idx_carbon_transactions_factor ON carbon_transactions(emission_factor_id);
CREATE INDEX idx_sustainability_goals_department ON sustainability_goals(department_id);
CREATE INDEX idx_csr_activities_category ON csr_activities(category_id);
CREATE INDEX idx_employee_participations_employee ON employee_participations(employee_id);
CREATE INDEX idx_employee_participations_activity ON employee_participations(csr_activity_id);
CREATE INDEX idx_training_records_employee ON training_records(employee_id);
CREATE INDEX idx_policy_acknowledgements_policy ON policy_acknowledgements(policy_id);
CREATE INDEX idx_policy_acknowledgements_employee ON policy_acknowledgements(employee_id);
CREATE INDEX idx_audits_auditor ON audits(auditor_id);
CREATE INDEX idx_compliance_issues_audit ON compliance_issues(audit_id);
CREATE INDEX idx_compliance_issues_owner ON compliance_issues(owner_id);
CREATE INDEX idx_xp_events_employee ON xp_events(employee_id);
CREATE INDEX idx_challenges_category ON challenges(category_id);
CREATE INDEX idx_challenge_participations_challenge ON challenge_participations(challenge_id);
CREATE INDEX idx_challenge_participations_employee ON challenge_participations(employee_id);
CREATE INDEX idx_employee_badges_employee ON employee_badges(employee_id);
CREATE INDEX idx_employee_badges_badge ON employee_badges(badge_id);
CREATE INDEX idx_reward_redemptions_reward ON reward_redemptions(reward_id);
CREATE INDEX idx_reward_redemptions_employee ON reward_redemptions(employee_id);
CREATE INDEX idx_department_scores_department ON department_scores(department_id);
CREATE INDEX idx_notification_settings_employee ON notification_settings(employee_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Performance Composite Indexes (Specific to ESG Platform workflows)
-- 1. Emission factors resolution lookup (Region -> Country -> GLOBAL)
CREATE INDEX idx_emission_factors_lookup_perf ON emission_factors(activity_type, region, valid_year);

-- 2. Carbon emissions aggregates per department / period
CREATE INDEX idx_carbon_transactions_dept_date ON carbon_transactions(department_id, txn_date);

-- 3. In-app notifications unread lookup
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;
