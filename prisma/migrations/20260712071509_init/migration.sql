-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('Admin', 'ESG_Manager', 'Employee');

-- CreateEnum
CREATE TYPE "category_type" AS ENUM ('CSR_Activity', 'Challenge');

-- CreateEnum
CREATE TYPE "operation_type" AS ENUM ('Purchase', 'Manufacturing', 'Expense', 'Fleet');

-- CreateEnum
CREATE TYPE "emission_source" AS ENUM ('EPA', 'Ember', 'IPCC', 'DEFRA', 'Custom');

-- CreateEnum
CREATE TYPE "goal_metric" AS ENUM ('total_emissions', 'emissions_per_employee');

-- CreateEnum
CREATE TYPE "approval_status" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "challenge_difficulty" AS ENUM ('Easy', 'Medium', 'Hard');

-- CreateEnum
CREATE TYPE "challenge_status" AS ENUM ('Draft', 'Active', 'Under_Review', 'Completed', 'Archived');

-- CreateEnum
CREATE TYPE "policy_category" AS ENUM ('E', 'S', 'G');

-- CreateEnum
CREATE TYPE "policy_status" AS ENUM ('Draft', 'Published', 'Archived');

-- CreateEnum
CREATE TYPE "audit_status" AS ENUM ('Planned', 'In_Progress', 'Completed');

-- CreateEnum
CREATE TYPE "compliance_severity" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "compliance_status" AS ENUM ('Open', 'Resolved');

-- CreateEnum
CREATE TYPE "xp_source_type" AS ENUM ('challenge', 'csr', 'redemption', 'adjustment');

-- CreateEnum
CREATE TYPE "reward_status" AS ENUM ('Active', 'Inactive', 'Out_Of_Stock');

-- CreateEnum
CREATE TYPE "notification_event_type" AS ENUM ('compliance_issue_raised', 'participation_decision', 'policy_ack_reminder', 'badge_unlocked');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'Employee',
    "github_id" VARCHAR(100),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "head_id" UUID,
    "parent_department_id" UUID,
    "country_code" CHAR(2) NOT NULL,
    "employee_count" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "department_id" UUID NOT NULL,
    "gender" VARCHAR(50),
    "hire_date" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "type" "category_type" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "default_unit" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_esg_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "carbon_intensity" DECIMAL(12,4) NOT NULL,
    "intensity_unit" VARCHAR(50) NOT NULL,
    "recyclable" BOOLEAN NOT NULL DEFAULT false,
    "eco_certified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_esg_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "operation_type" NOT NULL,
    "record_date" DATE NOT NULL,
    "department_id" UUID NOT NULL,
    "product_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_factors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "activity_type" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "region" VARCHAR(50) NOT NULL,
    "factor_value" DECIMAL(12,6) NOT NULL,
    "source" "emission_source" NOT NULL,
    "valid_year" INTEGER NOT NULL,
    "reference_url" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carbon_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operation_record_id" UUID,
    "emission_factor_id" UUID NOT NULL,
    "factor_value_snapshot" DECIMAL(12,6) NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "calculated_emission" DECIMAL(12,4) NOT NULL,
    "department_id" UUID NOT NULL,
    "txn_date" DATE NOT NULL,
    "auto_calculated" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carbon_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sustainability_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "department_id" UUID,
    "metric" "goal_metric" NOT NULL,
    "baseline_value" DECIMAL(12,4) NOT NULL,
    "target_value" DECIMAL(12,4) NOT NULL,
    "period_year" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sustainability_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csr_activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "category_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "activity_date" DATE NOT NULL,
    "points_value" INTEGER NOT NULL,
    "evidence_required" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "csr_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_participations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "csr_activity_id" UUID NOT NULL,
    "proof_url" VARCHAR(500),
    "approval_status" "approval_status" NOT NULL DEFAULT 'Pending',
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "completion_date" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diversity_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "department_id" UUID NOT NULL,
    "period" VARCHAR(50) NOT NULL,
    "headcount" INTEGER NOT NULL DEFAULT 0,
    "female_count" INTEGER NOT NULL DEFAULT 0,
    "male_count" INTEGER NOT NULL DEFAULT 0,
    "other_count" INTEGER NOT NULL DEFAULT 0,
    "pay_gap_pct" DECIMAL(5,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diversity_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "training_name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "completed_at" TIMESTAMPTZ,
    "due_date" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esg_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "document_url" VARCHAR(500) NOT NULL,
    "category" "policy_category" NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "status" "policy_status" NOT NULL DEFAULT 'Draft',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esg_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_acknowledgements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policy_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "acknowledged_at" TIMESTAMPTZ,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_acknowledgements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scope" VARCHAR(255) NOT NULL,
    "auditor_id" UUID NOT NULL,
    "audit_date" DATE NOT NULL,
    "status" "audit_status" NOT NULL DEFAULT 'Planned',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_issues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "audit_id" UUID NOT NULL,
    "severity" "compliance_severity" NOT NULL,
    "description" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "compliance_status" NOT NULL DEFAULT 'Open',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "source" "xp_source_type" NOT NULL,
    "source_id" UUID,
    "note" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "category_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL,
    "difficulty" "challenge_difficulty" NOT NULL,
    "evidence_required" BOOLEAN NOT NULL DEFAULT false,
    "deadline" DATE NOT NULL,
    "status" "challenge_status" NOT NULL DEFAULT 'Draft',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_participations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "challenge_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "progress" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "proof_url" VARCHAR(500),
    "approval_status" "approval_status" NOT NULL DEFAULT 'Pending',
    "xp_awarded" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "icon" VARCHAR(255),
    "unlock_rule" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_badges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "awarded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "points_required" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "status" "reward_status" NOT NULL DEFAULT 'Active',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_redemptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reward_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "points_deducted" INTEGER NOT NULL,
    "redeemed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_scores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "department_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "environmental_score" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "social_score" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "governance_score" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "total_score" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "computed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esg_configurations" (
    "id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    "env_weight" DECIMAL(3,2) NOT NULL DEFAULT 0.40,
    "social_weight" DECIMAL(3,2) NOT NULL DEFAULT 0.30,
    "gov_weight" DECIMAL(3,2) NOT NULL DEFAULT 0.30,
    "auto_emission_calc" BOOLEAN NOT NULL DEFAULT false,
    "evidence_required" BOOLEAN NOT NULL DEFAULT false,
    "badge_auto_award" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "esg_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "event_type" "notification_event_type" NOT NULL,
    "in_app" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "event_type" "notification_event_type" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "related_table" VARCHAR(100),
    "related_id" UUID,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "idx_departments_parent_dept" ON "departments"("parent_department_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE INDEX "idx_employees_department" ON "employees"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_type_key" ON "categories"("name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_esg_profiles_product_id_key" ON "product_esg_profiles"("product_id");

-- CreateIndex
CREATE INDEX "idx_operation_records_department" ON "operation_records"("department_id");

-- CreateIndex
CREATE INDEX "idx_operation_records_product" ON "operation_records"("product_id");

-- CreateIndex
CREATE INDEX "idx_emission_factors_lookup_perf" ON "emission_factors"("activity_type", "region", "valid_year");

-- CreateIndex
CREATE UNIQUE INDEX "emission_factors_activity_type_region_unit_valid_year_key" ON "emission_factors"("activity_type", "region", "unit", "valid_year");

-- CreateIndex
CREATE INDEX "idx_carbon_transactions_op_rec" ON "carbon_transactions"("operation_record_id");

-- CreateIndex
CREATE INDEX "idx_carbon_transactions_factor" ON "carbon_transactions"("emission_factor_id");

-- CreateIndex
CREATE INDEX "idx_carbon_transactions_dept_date" ON "carbon_transactions"("department_id", "txn_date");

-- CreateIndex
CREATE INDEX "idx_sustainability_goals_department" ON "sustainability_goals"("department_id");

-- CreateIndex
CREATE INDEX "idx_csr_activities_category" ON "csr_activities"("category_id");

-- CreateIndex
CREATE INDEX "idx_employee_participations_employee" ON "employee_participations"("employee_id");

-- CreateIndex
CREATE INDEX "idx_employee_participations_activity" ON "employee_participations"("csr_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_participations_employee_id_csr_activity_id_key" ON "employee_participations"("employee_id", "csr_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "diversity_metrics_department_id_period_key" ON "diversity_metrics"("department_id", "period");

-- CreateIndex
CREATE INDEX "idx_training_records_employee" ON "training_records"("employee_id");

-- CreateIndex
CREATE INDEX "idx_policy_acknowledgements_policy" ON "policy_acknowledgements"("policy_id");

-- CreateIndex
CREATE INDEX "idx_policy_acknowledgements_employee" ON "policy_acknowledgements"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "policy_acknowledgements_policy_id_employee_id_key" ON "policy_acknowledgements"("policy_id", "employee_id");

-- CreateIndex
CREATE INDEX "idx_audits_auditor" ON "audits"("auditor_id");

-- CreateIndex
CREATE INDEX "idx_compliance_issues_audit" ON "compliance_issues"("audit_id");

-- CreateIndex
CREATE INDEX "idx_compliance_issues_owner" ON "compliance_issues"("owner_id");

-- CreateIndex
CREATE INDEX "idx_xp_events_employee" ON "xp_events"("employee_id");

-- CreateIndex
CREATE INDEX "idx_challenges_category" ON "challenges"("category_id");

-- CreateIndex
CREATE INDEX "idx_challenge_participations_challenge" ON "challenge_participations"("challenge_id");

-- CreateIndex
CREATE INDEX "idx_challenge_participations_employee" ON "challenge_participations"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_participations_challenge_id_employee_id_key" ON "challenge_participations"("challenge_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_name_key" ON "badges"("name");

-- CreateIndex
CREATE INDEX "idx_employee_badges_employee" ON "employee_badges"("employee_id");

-- CreateIndex
CREATE INDEX "idx_employee_badges_badge" ON "employee_badges"("badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_badges_employee_id_badge_id_key" ON "employee_badges"("employee_id", "badge_id");

-- CreateIndex
CREATE INDEX "idx_reward_redemptions_reward" ON "reward_redemptions"("reward_id");

-- CreateIndex
CREATE INDEX "idx_reward_redemptions_employee" ON "reward_redemptions"("employee_id");

-- CreateIndex
CREATE INDEX "idx_department_scores_department" ON "department_scores"("department_id");

-- CreateIndex
CREATE INDEX "idx_notification_settings_employee" ON "notification_settings"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_employee_id_event_type_key" ON "notification_settings"("employee_id", "event_type");

-- CreateIndex
CREATE INDEX "idx_notifications_user" ON "notifications"("user_id");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_department_id_fkey" FOREIGN KEY ("parent_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_esg_profiles" ADD CONSTRAINT "product_esg_profiles_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_records" ADD CONSTRAINT "operation_records_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_records" ADD CONSTRAINT "operation_records_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carbon_transactions" ADD CONSTRAINT "carbon_transactions_operation_record_id_fkey" FOREIGN KEY ("operation_record_id") REFERENCES "operation_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carbon_transactions" ADD CONSTRAINT "carbon_transactions_emission_factor_id_fkey" FOREIGN KEY ("emission_factor_id") REFERENCES "emission_factors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carbon_transactions" ADD CONSTRAINT "carbon_transactions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sustainability_goals" ADD CONSTRAINT "sustainability_goals_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csr_activities" ADD CONSTRAINT "csr_activities_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_participations" ADD CONSTRAINT "employee_participations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_participations" ADD CONSTRAINT "employee_participations_csr_activity_id_fkey" FOREIGN KEY ("csr_activity_id") REFERENCES "csr_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diversity_metrics" ADD CONSTRAINT "diversity_metrics_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_acknowledgements" ADD CONSTRAINT "policy_acknowledgements_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "esg_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_acknowledgements" ADD CONSTRAINT "policy_acknowledgements_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_auditor_id_fkey" FOREIGN KEY ("auditor_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_issues" ADD CONSTRAINT "compliance_issues_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_issues" ADD CONSTRAINT "compliance_issues_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_participations" ADD CONSTRAINT "challenge_participations_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_participations" ADD CONSTRAINT "challenge_participations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_badges" ADD CONSTRAINT "employee_badges_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_badges" ADD CONSTRAINT "employee_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_scores" ADD CONSTRAINT "department_scores_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esg_configurations" ADD CONSTRAINT "esg_configurations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
