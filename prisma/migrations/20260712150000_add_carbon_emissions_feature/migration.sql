-- CreateEnum
CREATE TYPE "transport_mode" AS ENUM ('Car_Petrol', 'Car_Diesel', 'Car_Electric', 'Motorcycle', 'Bus', 'Train', 'Bicycle', 'Walk', 'Carpool');

-- CreateEnum
CREATE TYPE "attendance_status" AS ENUM ('Present', 'WFH', 'Leave', 'Holiday');

-- CreateEnum
CREATE TYPE "invoice_category" AS ENUM ('Electricity', 'Fuel', 'Diesel', 'Petrol', 'Natural_Gas', 'Air_Travel', 'Hotel', 'Office_Purchases', 'Waste_Disposal');

-- AlterTable
ALTER TABLE "esg_configurations" ALTER COLUMN "id" SET DEFAULT '00000000-0000-0000-0000-000000000000';

-- CreateTable
CREATE TABLE "employee_commute_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "transport_mode" "transport_mode" NOT NULL,
    "distance_km" DECIMAL(8,2) NOT NULL,
    "round_trip" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_commute_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "status" "attendance_status" NOT NULL DEFAULT 'Present',
    "transport_mode_override" "transport_mode",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" "invoice_category" NOT NULL,
    "department_id" UUID NOT NULL,
    "vendor_name" VARCHAR(255) NOT NULL,
    "invoice_number" VARCHAR(100),
    "invoice_date" DATE NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "attachment_url" VARCHAR(500),
    "import_batch_id" UUID,
    "carbon_transaction_id" UUID,
    "created_by_user_id" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_import_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file_name" VARCHAR(255) NOT NULL,
    "uploaded_by_user_id" UUID NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "success_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "error_report" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_monthly_emissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "period_year" INTEGER NOT NULL,
    "period_month" INTEGER NOT NULL,
    "attended_days" INTEGER NOT NULL DEFAULT 0,
    "total_distance_km" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_emission_kgco2e" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "last_recalculated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "employee_monthly_emissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_commute_profiles_employee_id_key" ON "employee_commute_profiles"("employee_id");

-- CreateIndex
CREATE INDEX "idx_attendance_employee_date" ON "attendance"("employee_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_employee_id_date_key" ON "attendance"("employee_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_carbon_transaction_id_key" ON "invoices"("carbon_transaction_id");

-- CreateIndex
CREATE INDEX "idx_invoices_dept_date" ON "invoices"("department_id", "invoice_date");

-- CreateIndex
CREATE INDEX "idx_invoices_category_date" ON "invoices"("category", "invoice_date");

-- CreateIndex
CREATE INDEX "idx_invoices_import_batch" ON "invoices"("import_batch_id");

-- CreateIndex
CREATE INDEX "idx_employee_monthly_emission_period" ON "employee_monthly_emissions"("period_year", "period_month");

-- CreateIndex
CREATE UNIQUE INDEX "employee_monthly_emissions_employee_id_period_year_period_m_key" ON "employee_monthly_emissions"("employee_id", "period_year", "period_month");

-- AddForeignKey
ALTER TABLE "employee_commute_profiles" ADD CONSTRAINT "employee_commute_profiles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "invoice_import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_carbon_transaction_id_fkey" FOREIGN KEY ("carbon_transaction_id") REFERENCES "carbon_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_import_batches" ADD CONSTRAINT "invoice_import_batches_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_monthly_emissions" ADD CONSTRAINT "employee_monthly_emissions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

