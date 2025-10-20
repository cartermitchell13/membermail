import { z } from "zod";

const EnvSchema = z.object({
	// Whop - Required at runtime but optional during build
	NEXT_PUBLIC_WHOP_APP_ID: z.string().min(1).optional(),
	WHOP_API_KEY: z.string().min(1).optional(),
	NEXT_PUBLIC_WHOP_AGENT_USER_ID: z.string().optional(),
	NEXT_PUBLIC_WHOP_COMPANY_ID: z.string().optional(),
	WHOP_WEBHOOK_SECRET: z.string().optional(),

	// Supabase - Required at runtime but optional during build
	NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
	NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10).optional(),
	SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
	SUPABASE_JWT_SECRET: z.string().optional(),

	// Email / Resend
	RESEND_API_KEY: z.string().optional(),
	EMAIL_FROM: z.string().email().optional(),

	// Tracking
	TRACKING_HMAC_SECRET: z.string().optional(),

	// AI / OpenAI
	OPENAI_API_KEY: z.string().optional(),
	
	// AI / Google Gemini (for image generation)
	GEMINI_API_KEY: z.string().optional(),

	// App URL for absolute tracking links
	NEXT_PUBLIC_APP_URL: z
		.string()
		.url()
		.optional(),
});

function loadEnv() {
	// Parse environment variables with Zod schema
	// All required variables are marked as optional to allow builds to succeed
	// Individual API routes/functions should validate required vars at runtime
	const parsed = EnvSchema.safeParse(process.env);
	
	if (!parsed.success) {
		const formatted = parsed.error.format();
		console.error(
			"Environment variables validation failed: " +
			JSON.stringify(formatted, null, 2),
		);
		// Return empty object with proxy to access process.env directly
		return new Proxy({} as z.infer<typeof EnvSchema>, {
			get(target, prop) {
				if (typeof prop === 'string' && prop in process.env) {
					return process.env[prop as string];
				}
				return undefined;
			}
		});
	}
	
	return parsed.data;
}

export const env = loadEnv();


