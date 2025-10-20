import { checkUserAccess } from "@/lib/actions/create-checkout-session";
import { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Server-side component that checks if a user has access to a specific subscription tier
 * If they don't have access, it shows an upgrade prompt instead of the protected content
 * 
 * Usage:
 * ```tsx
 * <SubscriptionGuard accessPassId={process.env.NEXT_PUBLIC_PRO_ACCESS_PASS_ID!}>
 *   <PremiumFeature />
 * </SubscriptionGuard>
 * ```
 */
export async function SubscriptionGuard({
	accessPassId,
	tierName = "Premium",
	children,
}: {
	accessPassId: string;
	tierName?: string;
	children: ReactNode;
}) {
	// Check if the user has access to the required tier
	const result = await checkUserAccess(accessPassId);

	// If there was an error checking access, show error state
	if (!result.success) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-6">
				<h3 className="text-red-800 font-semibold mb-2">Error Checking Access</h3>
				<p className="text-red-600 text-sm">{result.error}</p>
			</div>
		);
	}

	// If user has access, render the protected content
	if (result.hasAccess) {
		return <>{children}</>;
	}

	// If user doesn't have access, show upgrade prompt
	return (
		<div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8">
			<div className="flex flex-col items-center text-center max-w-md mx-auto">
				{/* Lock icon */}
				<div className="bg-white rounded-full p-4 mb-4 shadow-sm">
					<Lock className="h-8 w-8 text-blue-600" />
				</div>

				{/* Heading */}
				<h3 className="text-2xl font-bold mb-2 text-gray-900">
					{tierName} Feature
				</h3>

				{/* Description */}
				<p className="text-gray-600 mb-6">
					This feature is only available to {tierName} subscribers. Upgrade your
					plan to unlock this and many other premium features.
				</p>

				{/* Upgrade button */}
				<Link
					href="/upgrade"
					className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
				>
					View Upgrade Options
				</Link>

				{/* Additional info */}
				<p className="text-gray-500 text-sm mt-4">
					Already subscribed?{" "}
					<button
						onClick={() => window.location.reload()}
						className="text-blue-600 hover:underline"
					>
						Refresh page
					</button>
				</p>
			</div>
		</div>
	);
}

/**
 * Client-side hook to check subscription access (for conditional rendering)
 * 
 * Usage:
 * ```tsx
 * 'use client';
 * const { hasAccess, loading } = useSubscriptionAccess(accessPassId);
 * 
 * if (loading) return <Spinner />;
 * if (!hasAccess) return <UpgradePrompt />;
 * return <PremiumFeature />;
 * ```
 */
export function useSubscriptionAccessExample() {
	// This is a placeholder showing the pattern
	// In a real implementation, you'd want to:
	// 1. Create an API route that calls checkUserAccess
	// 2. Use SWR or React Query to fetch that data client-side
	// 3. Cache the result to avoid repeated checks
	
	return {
		hasAccess: false,
		loading: true,
		error: null,
	};
}
