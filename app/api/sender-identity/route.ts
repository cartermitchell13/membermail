import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  fetchSenderIdentityByUserId,
  formatSenderAddress,
  isSenderIdentityComplete,
  normalizeUsername,
  validateMailUsername,
} from "@/lib/email/sender-identity";

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");

  if (!companyId) {
    return json({ error: "Missing companyId" }, { status: 400 });
  }

  const supabase = getAdminSupabaseClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id,user_id")
    .eq("whop_community_id", companyId)
    .single();

  if (!community) {
    return json({ error: "Community not found" }, { status: 404 });
  }

  const identity = await fetchSenderIdentityByUserId(supabase, community.user_id);

  if (!identity) {
    return json({ display_name: null, mail_username: null, setupComplete: false });
  }

  return json({
    display_name: identity.displayName,
    mail_username: identity.mailUsername,
    setupComplete: identity.setupComplete,
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");

  if (!companyId) {
    return json({ error: "Missing companyId" }, { status: 400 });
  }

  const supabase = getAdminSupabaseClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id,user_id")
    .eq("whop_community_id", companyId)
    .single();

  if (!community) {
    return json({ error: "Community not found" }, { status: 404 });
  }

  const profileIdentity = await fetchSenderIdentityByUserId(supabase, community.user_id);

  type SenderIdentityPayload = {
    display_name?: unknown;
    mail_username?: unknown;
  };

  let body: SenderIdentityPayload | null = null;
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as SenderIdentityPayload;
    } else {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : "";
  const usernameRaw = typeof body.mail_username === "string" ? body.mail_username : "";

  if (!displayName) {
    return json({ error: "Display name is required" }, { status: 400 });
  }

  if (displayName.length > 100) {
    return json({ error: "Display name is too long" }, { status: 400 });
  }

  const { ok, error: validationError, normalized } = validateMailUsername(usernameRaw);
  if (!ok || !normalized) {
    return json({ error: validationError ?? "Invalid username" }, { status: 400 });
  }

  if (profileIdentity?.mailUsername && profileIdentity.mailUsername !== normalized) {
    return json({ error: "Username cannot be changed once set" }, { status: 409 });
  }

  // Check availability if username is new
  if (!profileIdentity?.mailUsername) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("mail_username", normalized)
      .limit(1)
      .maybeSingle();

    if (existing && existing.id !== community.user_id) {
      return json({ error: "Username taken" }, { status: 409 });
    }
  }

  const updates: Record<string, unknown> = {
    display_name: displayName,
    updated_at: new Date().toISOString(),
  };

  if (!profileIdentity?.mailUsername) {
    updates.mail_username = normalized;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", community.user_id);

  if (updateError) {
    if (updateError.message?.includes("idx_profiles_mail_username_unique")) {
      return json({ error: "Username taken" }, { status: 409 });
    }
    return json({ error: "Failed to save sender identity" }, { status: 500 });
  }

  const identity = await fetchSenderIdentityByUserId(supabase, community.user_id);

  if (!identity) {
    return json({ error: "Failed to load sender identity" }, { status: 500 });
  }

  return json({
    display_name: identity.displayName,
    mail_username: identity.mailUsername,
    setupComplete: identity.setupComplete,
    from_address: isSenderIdentityComplete(identity)
      ? formatSenderAddress({
        displayName: identity.displayName,
        mailUsername: identity.mailUsername,
      })
      : null,
  });
}
