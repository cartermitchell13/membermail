import { PricingCard } from "@/components/upgrade/PricingCard";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

/**
 * Upgrade page displaying tiered subscription options
 * Users can choose from different pricing tiers and purchase using Whop
 * 
 * Setup Instructions:
 * 1. Go to https://whop.com/dashboard/developer
 * 2. Create access passes for each tier (e.g., "Free", "Pro", "Enterprise")
 * 3. For each access pass, create pricing plans (free/monthly/yearly)
 * 4. Copy the plan IDs and access pass IDs
 * 5. Add them to your environment variables:
 *    - NEXT_PUBLIC_FREE_PLAN_ID
 *    - NEXT_PUBLIC_FREE_ACCESS_PASS_ID
 *    - NEXT_PUBLIC_PRO_PLAN_ID
 *    - NEXT_PUBLIC_PRO_ACCESS_PASS_ID
 *    - NEXT_PUBLIC_ENTERPRISE_PLAN_ID
 *    - NEXT_PUBLIC_ENTERPRISE_ACCESS_PASS_ID
 */
export default function UpgradePage() {
	// Define your pricing tiers
	// Replace these plan IDs with your actual Whop plan IDs from your dashboard
	const pricingTiers = [
		{
			name: "Free",
			price: "$0",
			period: "forever",
			description: "Perfect for getting started",
			features: [
				"Up to 100 email sends per month",
				"Basic email templates",
				"Community support",
				"1 company workspace",
				"Email analytics dashboard",
			],
			// Free tier - no plan ID needed, or use a free plan ID if you create one
			planId: process.env.NEXT_PUBLIC_FREE_PLAN_ID || "plan_free",
			// Replace with your actual access pass ID from Whop dashboard
			accessPassId:
				process.env.NEXT_PUBLIC_FREE_ACCESS_PASS_ID || "prod_free",
			buttonText: "Get Started Free",
		},
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
			// Replace with your actual plan ID from Whop dashboard
			planId: process.env.NEXT_PUBLIC_PRO_PLAN_ID || "plan_pro_monthly",
			// Replace with your actual access pass ID from Whop dashboard
			accessPassId: process.env.NEXT_PUBLIC_PRO_ACCESS_PASS_ID || "prod_pro",
			popular: true,
			buttonText: "Go Pro",
		},
		{
			name: "Enterprise",
			price: "$99",
			period: "month",
			description: "For large-scale operations",
			features: [
				"Unlimited email sends",
				"All Pro features",
				"Custom integrations",
				"Dedicated account manager",
				"Unlimited company workspaces",
				"White-label options",
				"SLA guarantee",
				"Phone support",
			],
			// Replace with your actual plan ID from Whop dashboard
			planId:
				process.env.NEXT_PUBLIC_ENTERPRISE_PLAN_ID || "plan_enterprise_monthly",
			// Replace with your actual access pass ID from Whop dashboard
			accessPassId:
				process.env.NEXT_PUBLIC_ENTERPRISE_ACCESS_PASS_ID || "prod_enterprise",
			buttonText: "Contact Sales",
		},
	];

	return (
		<SidebarProvider>
			<div className="min-h-screen bg-black flex">
				<AppSidebar experienceId="" />
				<main className="relative flex-1 min-h-0 m-4 h-[calc(100vh-2rem)] rounded-2xl border border-white/10 bg-[#111111] text-white overflow-auto">
					<div className="px-8 pt-8 pb-8 space-y-8">
						{/* Header section */}
						<div className="space-y-3">
							<h1 className="text-4xl font-semibold tracking-tight">
								Choose Your Plan
							</h1>
							<p className="text-white/50 text-lg">
								Select the perfect subscription tier for your needs. All plans include secure payment processing through Whop.
							</p>
						</div>

						{/* Pricing cards grid */}
						<div className="grid md:grid-cols-3 gap-6">
							{pricingTiers.map((tier) => (
								<PricingCard
									key={tier.planId}
									tier={tier}
								/>
							))}
						</div>

						{/* FAQ section */}
						<div className="mt-12 space-y-6">
							<h2 className="text-2xl font-semibold">
								Frequently Asked Questions
							</h2>
							<div className="space-y-4">
								<div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
									<h3 className="font-semibold text-lg mb-2">
										How does billing work?
									</h3>
									<p className="text-white/60">
										You'll be charged automatically each month on your subscription date. You can cancel anytime from your billing portal.
									</p>
								</div>
								<div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
									<h3 className="font-semibold text-lg mb-2">
										Can I change plans later?
									</h3>
									<p className="text-white/60">
										Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
									</p>
								</div>
								<div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
									<h3 className="font-semibold text-lg mb-2">
										Is my payment information secure?
									</h3>
									<p className="text-white/60">
										Absolutely. All payments are processed securely through Whop, which is PCI DSS compliant and uses industry-standard encryption.
									</p>
								</div>
							</div>
						</div>

						{/* Setup instructions for developers */}
						<div className="rounded-xl border border-[#FA4616]/20 bg-[#FA4616]/5 p-6">
							<h3 className="font-semibold text-lg mb-2 text-[#FA4616]">
								🔧 Developer Setup Instructions
							</h3>
							<p className="text-white/70 text-sm mb-4">
								To configure your pricing tiers, follow these steps:
							</p>
							<ol className="list-decimal list-inside space-y-2 text-sm text-white/80">
								<li>
									Go to your{" "}
									<a
										href="https://whop.com/dashboard/developer"
										target="_blank"
										rel="noopener noreferrer"
										className="text-[#FA4616] hover:underline font-medium"
									>
										Whop Dashboard
									</a>
								</li>
								<li>Create access passes for each tier (Free, Pro, Enterprise)</li>
								<li>For each access pass, create pricing plans (monthly or yearly)</li>
								<li>Copy the plan IDs and access pass IDs from the dashboard</li>
								<li>
									Add them to your <code className="bg-white/10 px-2 py-0.5 rounded text-xs">.env.local</code> file:
									<pre className="bg-black/40 p-3 rounded-lg mt-2 text-xs overflow-x-auto border border-white/10">
										{`NEXT_PUBLIC_FREE_PLAN_ID="plan_xxx"
NEXT_PUBLIC_FREE_ACCESS_PASS_ID="prod_xxx"
NEXT_PUBLIC_PRO_PLAN_ID="plan_xxx"
NEXT_PUBLIC_PRO_ACCESS_PASS_ID="prod_xxx"
NEXT_PUBLIC_ENTERPRISE_PLAN_ID="plan_xxx"
NEXT_PUBLIC_ENTERPRISE_ACCESS_PASS_ID="prod_xxx"`}
									</pre>
								</li>
							</ol>
						</div>
					</div>
				</main>
			</div>
		</SidebarProvider>
	);
}
