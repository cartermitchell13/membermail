alter table automation_sequences
    add column if not exists quiet_hours_enabled boolean,
    add column if not exists quiet_hours_start integer,
    add column if not exists quiet_hours_end integer;
