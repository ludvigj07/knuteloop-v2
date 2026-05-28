-- Roles and extensions setup. Must run before any tenant-scoped schema.
-- Idempotent: safe to re-run during test setup.

-- gen_random_uuid() needs pgcrypto on older Postgres. PG17 has it built-in,
-- but pgcrypto is harmless to enable explicitly.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- app_role: the role the API connects as. Subject to RLS policies.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_role') THEN
    CREATE ROLE app_role NOLOGIN;
  END IF;
END $$;

-- admin_role: support / sponsor-report queries. Bypasses RLS — handle with care.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin_role') THEN
    CREATE ROLE admin_role NOLOGIN BYPASSRLS;
  END IF;
END $$;

-- Login users granted into the appropriate role.
-- Dev passwords are intentionally weak — production gets long random passwords from Aiven console.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE USER app_user LOGIN PASSWORD 'app_user_dev' IN ROLE app_role;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin_user') THEN
    CREATE USER admin_user LOGIN PASSWORD 'admin_user_dev' IN ROLE admin_role;
  END IF;
END $$;

-- Schema-level grants. Tables created later inherit via default privileges below.
GRANT USAGE ON SCHEMA public TO app_role;
GRANT USAGE ON SCHEMA public TO admin_role;

-- Default privileges so any table created after this point automatically grants to roles.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO admin_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO admin_role;
