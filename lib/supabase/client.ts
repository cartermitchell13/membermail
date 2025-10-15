import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

let browserClient: SupabaseClient<Database> | undefined;

export function getBrowserSupabaseClient(): SupabaseClient<Database> {
	if (!browserClient) {
		browserClient = createClient<Database>(
			requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
			requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
		);
	}
	return browserClient;
}


