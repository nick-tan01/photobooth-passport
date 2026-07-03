-- Ensure pgcrypto is available for gen_random_uuid(). Already enabled on
-- this project (schema `extensions`) but kept here, idempotent, so these
-- migrations are portable to a fresh project.
create extension if not exists pgcrypto with schema extensions;
