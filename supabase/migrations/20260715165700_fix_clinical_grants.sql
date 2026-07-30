-- Fix grants: ensure anon and authenticated roles have correct DML
-- permissions on all tables (including clinical tables created after 009_grants.sql)

-- Re-apply grants to ALL current tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Ensure sequences are accessible too
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
