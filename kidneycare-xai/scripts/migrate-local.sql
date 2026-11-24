\set QUIET 1
-- The caller must use one transaction with ON_ERROR_STOP so the lock lasts
-- through every migration and an interrupted upgrade rolls back in full.
SELECT pg_advisory_xact_lock(5795413166591485631) AS migration_lock \gset
SELECT to_regclass('public.users') IS NULL AS needs_bootstrap \gset
\if :needs_bootstrap
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r', 'p', 'v', 'm', 'f')) THEN
        RAISE EXCEPTION 'The target database is neither empty nor a recognized KidneyCare database';
    END IF;
END $$;
\endif
\if :enable_vector
CREATE EXTENSION IF NOT EXISTS vector;
\endif
\if :needs_bootstrap
\i schema.sql
\endif
\i migration_v2.sql
\i migration_v3.sql
\i migration_v4.sql
\i migration_v5.sql
