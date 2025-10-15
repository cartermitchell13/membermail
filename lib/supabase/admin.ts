import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export function getAdminSupabaseClient() {
	return createClient<Database>(
		requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
		requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
		{
			auth: {
				persistSession: false,
			},
		},
	);
}


