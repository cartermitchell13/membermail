import { NextRequest } from "next/server";
import { cookies } from "next/headers";
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
    .select("id,user_id,reply_to_email")
    .eq("whop_community_id", companyId)
    .single();

  if (!community) {
    return json({ error: "Community not found" }, { status: 404 });
  }

  const identity = await fetchSenderIdentityByUserId(supabase, community.user_id);

  // If no identity is found for the community owner, try to self-heal by using the cookie user
  // if that profile has a configured identity. This addresses prior mismaps.
  let finalIdentity = identity;
  if (!finalIdentity || !finalIdentity.displayName || !finalIdentity.mailUsername) {
    try {
      const cookieStore = await cookies();
      const cookieUserId = cookieStore.get("mm_uid")?.value || null;
      if (cookieUserId && cookieUserId !== community.user_id) {
        const cookieIdentity = await fetchSenderIdentityByUserId(supabase, cookieUserId);
        const cookieHasIdentity = Boolean(cookieIdentity?.displayName && cookieIdentity?.mailUsername);
        if (cookieHasIdentity) {
          // Relink community to the cookie user and use that identity
          await supabase
            .from("communities")
            .update({ user_id: cookieUserId, updated_at: new Date().toISOString() })
            .eq("id", community.id);
          finalIdentity = cookieIdentity ?? finalIdentity;
        }
      }
    } catch {
      // non-fatal; continue
    }
  }

  if (!finalIdentity) {
    return json({ display_name: null, mail_username: null, setupComplete: false });
  }

  // Align with isSenderIdentityComplete: setup is complete when identity (name + username) is set
  const isSetupComplete = isSenderIdentityComplete(finalIdentity);

  return json({
    display_name: finalIdentity.displayName,
    mail_username: finalIdentity.mailUsername,
    setupComplete: isSetupComplete,
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
    .select("id,user_id,reply_to_email")
    .eq("whop_community_id", companyId)
    .single();

  if (!community) {
    return json({ error: "Community not found" }, { status: 404 });
  }

  // Determine which user/profile to update. Prefer the cookie user if they already
  // have an identity configured, or if the current community owner lacks identity.
  const profileIdentity = await fetchSenderIdentityByUserId(supabase, community.user_id);
  let targetUserId = community.user_id as string;
  try {
    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get("mm_uid")?.value || null;
    if (cookieUserId && cookieUserId !== community.user_id) {
      const cookieIdentity = await fetchSenderIdentityByUserId(supabase, cookieUserId);
      const cookieHasIdentity = Boolean(cookieIdentity?.displayName && cookieIdentity?.mailUsername);
      const ownerHasIdentity = Boolean(profileIdentity?.displayName && profileIdentity?.mailUsername);
      if (cookieHasIdentity || !ownerHasIdentity) {
        // Use the cookie user as the canonical owner and re-link the community.
        targetUserId = cookieUserId;
        await supabase
          .from("communities")
          .update({ user_id: cookieUserId, updated_at: new Date().toISOString() })
          .eq("id", community.id);
      }
    }
  } catch {
    // non-fatal; continue
  }
  const targetIdentity = await fetchSenderIdentityByUserId(supabase, targetUserId);

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

  if (targetIdentity?.mailUsername && targetIdentity.mailUsername !== normalized) {
    return json({ error: "Username cannot be changed once set" }, { status: 409 });
  }

  // Check availability if username is new
  if (!targetIdentity?.mailUsername) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("mail_username", normalized)
      .limit(1)
      .maybeSingle();

    if (existing && existing.id !== targetUserId) {
      return json({ error: "Username taken" }, { status: 409 });
    }
  }

  const updates: Record<string, unknown> = {
    display_name: displayName,
    updated_at: new Date().toISOString(),
  };

  if (!targetIdentity?.mailUsername) {
    updates.mail_username = normalized;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", targetUserId);

  if (updateError) {
    if (updateError.message?.includes("idx_profiles_mail_username_unique")) {
      return json({ error: "Username taken" }, { status: 409 });
    }
    return json({ error: "Failed to save sender identity" }, { status: 500 });
  }

  const identity = await fetchSenderIdentityByUserId(supabase, targetUserId);

  if (!identity) {
    return json({ error: "Failed to load sender identity" }, { status: 500 });
  }

  // Align with isSenderIdentityComplete: setup is complete when identity (name + username) is set
  const isSetupComplete = isSenderIdentityComplete(identity);

  return json({
    display_name: identity.displayName,
    mail_username: identity.mailUsername,
    setupComplete: isSetupComplete,
    from_address: isSenderIdentityComplete(identity)
      ? formatSenderAddress({
        displayName: identity.displayName,
        mailUsername: identity.mailUsername,
      })
      : null,
  });
}
