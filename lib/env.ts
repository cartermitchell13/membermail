import { z } from "zod";

const EnvSchema = z.object({
	// Whop
	NEXT_PUBLIC_WHOP_APP_ID: z.string().min(1),
	WHOP_API_KEY: z.string().min(1),
	NEXT_PUBLIC_WHOP_AGENT_USER_ID: z.string().optional(),
	NEXT_PUBLIC_WHOP_COMPANY_ID: z.string().optional(),
	WHOP_WEBHOOK_SECRET: z.string().optional(),

	// Supabase
	NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
	NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
	SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
	SUPABASE_JWT_SECRET: z.string().optional(),

	// Email / Resend
	RESEND_API_KEY: z.string().optional(),
	EMAIL_FROM: z.string().email().optional(),

	// Tracking
	TRACKING_HMAC_SECRET: z.string().optional(),

	// App URL for absolute tracking links
	NEXT_PUBLIC_APP_URL: z
		.string()
		.url()
		.optional(),
});

function loadEnv() {
	const parsed = EnvSchema.safeParse(process.env);
	if (!parsed.success) {
		const formatted = parsed.error.format();
		// Only throw during build/server; avoid breaking client hydration unexpectedly
		throw new Error(
			"Environment variables validation failed: " +
			JSON.stringify(formatted, null, 2),
		);
	}
	return parsed.data;
}

export const env = loadEnv();


