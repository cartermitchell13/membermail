import type { PricingTier } from "@/components/upgrade/PricingCard";

function resolveEnv(key: string, fallback: string) {
	const value = process.env[key];
	if (!value || value === "fallback") {
		console.warn(`[Pricing] Missing or placeholder environment variable: ${key}`);
		return fallback;
	}
	return value;
}

export function getDefaultPricingTiers(): PricingTier[] {
	return [
		{
			name: "Pro",
			price: "$29",
			period: "month",
			description: "Best for growing businesses",
			features: [
				"Up to 5,000 email sends per month",
				"Advanced email templates",
				"A/B testing",
				"Priority support",
				"Up to 5 company workspaces",
				"Custom branding",
				"Advanced analytics",
			],
			planId: resolveEnv("NEXT_PUBLIC_PRO_PLAN_ID", "plan_pro_monthly"),
			accessPassId: resolveEnv("NEXT_PUBLIC_PRO_ACCESS_PASS_ID", "prod_pro"),
			popular: true,
			buttonText: "Start 7-day trial",
		},
		{
			name: "Enterprise",
			price: "$200",
			period: "month",
			description: "For large-scale operations with up to 5 team members included",
			features: [
				"Unlimited email sends",
				"All Pro features",
				"Custom integrations",
				"Dedicated account manager",
				"Unlimited company workspaces",
				"White-label options",
				"SLA guarantee",
				"Phone support",
				"Includes up to 5 team members",
			],
			planId: resolveEnv("NEXT_PUBLIC_ENTERPRISE_PLAN_ID", "plan_enterprise_monthly"),
			accessPassId: resolveEnv("NEXT_PUBLIC_ENTERPRISE_ACCESS_PASS_ID", "prod_enterprise"),
			buttonText: "Contact Sales",
		},
	];
}
