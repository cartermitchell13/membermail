import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type DbClient = SupabaseClient<Database>;

export type SenderIdentityRecord = {
  displayName: string | null;
  mailUsername: string | null;
  setupComplete: boolean;
};

const RESERVED_USERNAMES = new Set([
  "admin",
  "support",
  "postmaster",
  "abuse",
  "no-reply",
]);

const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateMailUsername(raw: string): {
  ok: boolean;
  normalized?: string;
  error?: string;
} {
  if (!raw || typeof raw !== "string") {
    return { ok: false, error: "Username is required" };
  }

  const normalized = normalizeUsername(raw);

  if (normalized.length < 3 || normalized.length > 30) {
    return { ok: false, error: "Username must be between 3 and 30 characters" };
  }

  if (!USERNAME_REGEX.test(normalized)) {
    return {
      ok: false,
      error: "Use lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.",
    };
  }

  if (normalized.includes("--")) {
    return { ok: false, error: "Hyphens cannot be consecutive" };
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return { ok: false, error: "This username is reserved" };
  }

  return { ok: true, normalized };
}

export function isSenderIdentityComplete(record: SenderIdentityRecord | null): record is {
  displayName: string;
  mailUsername: string;
  setupComplete: true;
} {
  return Boolean(record && record.displayName && record.mailUsername);
}

export function formatSenderAddress(record: { displayName: string; mailUsername: string }): string {
  const escapedName = record.displayName.replace(/"/g, '\\"').trim();
  const safeName = escapedName.length > 0 ? escapedName : "MemberMail";
  return `${safeName} <${record.mailUsername}@mail.membermail.app>`;
}

export async function fetchSenderIdentityByUserId(
  supabase: DbClient,
  userId: string,
): Promise<SenderIdentityRecord | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, mail_username")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    displayName: data.display_name,
    mailUsername: data.mail_username,
    setupComplete: Boolean(data.display_name && data.mail_username),
  };
}

