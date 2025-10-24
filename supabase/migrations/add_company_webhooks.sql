-- Company webhooks storage for per-company (Whop) webhook secrets
-- Stores the webhook id and secret returned by Whop for signature verification

create table if not exists company_webhooks (
    id bigserial primary key,
    -- Whop company id (e.g., biz_XXXX) – use this as the primary lookup key
    whop_community_id text not null unique,
    -- Optional link to our internal communities row if available
    community_id bigint null references communities(id) on delete cascade,
    whop_webhook_id text not null,
    webhook_secret text not null,
    url text not null,
    enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Keep community_id unique when present (nulls are allowed and ignored)
create unique index if not exists idx_company_webhooks_community_id_unique
  on company_webhooks(community_id)
  where community_id is not null;

-- Fast lookup by whop id
create index if not exists idx_company_webhooks_whop_id
  on company_webhooks(whop_community_id);

-- Maintain updated_at
create or replace function set_updated_at_company_webhooks()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_company_webhooks on company_webhooks;
create trigger trg_set_updated_at_company_webhooks
before update on company_webhooks
for each row execute procedure set_updated_at_company_webhooks();

