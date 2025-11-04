-- Migration: ensure campaigns table includes automation_trigger_metadata
-- Run this in Supabase SQL editor before using automation-trigger metadata.

alter table campaigns
    add column if not exists automation_trigger_metadata jsonb;

