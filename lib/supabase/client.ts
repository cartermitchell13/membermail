import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

function requireEnv(name: string): string {
	// In the browser, access environment variables directly
	const value = typeof window !== 'undefined' 
		? (window as any)[`__NEXT_PUBLIC_${name.replace('NEXT_PUBLIC_', '')}`] || process.env[name]
		: process.env[name];
	
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

let browserClient: SupabaseClient<Database> | undefined;

export function getBrowserSupabaseClient(): SupabaseClient<Database> {
	if (!browserClient) {
		// Access environment variables directly in browser context
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
		const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
		
		if (!supabaseUrl || !supabaseAnonKey) {
			throw new Error('Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
		}
		
		browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
	}
	return browserClient;
}


