import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { cookies } from "next/headers";

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export async function getServerSupabaseClient() {
    const cookieStore = await cookies();
    return createServerClient<Database>(
		requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
		requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
		{
			cookies: {
                async get(name: string) {
                    return cookieStore.get(name)?.value;
				},
                async set(name: string, value: string, options: CookieOptions) {
					cookieStore.set({ name, value, ...options });
				},
                async remove(name: string, options: CookieOptions) {
					cookieStore.set({ name, value: "", ...options });
				},
			},
		},
	);
}


