-- Add idempotency_key to reward_redemptions.
-- Nullable VARCHAR(36) stores a client-generated UUID per submission.
-- The UNIQUE constraint is the authoritative server-side deduplication barrier:
-- concurrent requests with the same key will produce a P2002 error at the DB
-- level, ensuring exactly-once semantics even if the pre-flight check races.

ALTER TABLE "reward_redemptions"
  ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(36);

CREATE UNIQUE INDEX IF NOT EXISTS "reward_redemptions_idempotency_key_key"
  ON "reward_redemptions"("idempotency_key");
