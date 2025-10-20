"use server";

import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

/**
 * Server action to create a checkout session for a specific plan
 * This creates a checkout session that can be used with the iframe SDK's inAppPurchase function
 * 
 * @param planId - The Whop plan ID to create a checkout session for
 * @param companyId - Optional company ID to attach as metadata
 * @returns The checkout session object to pass to iframeSdk.inAppPurchase()
 */
export async function createCheckoutSession(
	planId: string,
	companyId?: string
) {
	try {
		console.log("[Checkout] Starting checkout session for plan:", planId);
		
		// Get the current user from the request headers
		const headersList = await headers();
		console.log("[Checkout] Headers received, verifying user token...");
		
		const { userId } = await whopSdk.verifyUserToken(headersList);
		console.log("[Checkout] User verified:", userId);

		// Create a checkout session with Whop
		// This prepares the payment but doesn't charge the user yet
		console.log("[Checkout] Creating checkout session with Whop SDK...");
		const checkoutSession = await whopSdk.payments.createCheckoutSession({
			planId: planId,
			// Attach metadata that will be available in webhooks
			metadata: {
				...(companyId && { companyId }),
				userId,
			},
		});
		console.log("[Checkout] Checkout session created successfully:", checkoutSession?.id);

		return {
			success: true,
			checkoutSession,
		};
	} catch (error) {
		console.error("[Checkout] Failed to create checkout session:", error);
		console.error("[Checkout] Error details:", {
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			planId,
		});
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to create checkout session",
		};
	}
}

/**
 * Server action to check if a user has access to a specific access pass
 * 
 * @param accessPassId - The access pass ID to check
 * @returns Boolean indicating if the user has access
 */
export async function checkUserAccess(accessPassId: string) {
	try {
		const headersList = await headers();
		const { userId } = await whopSdk.verifyUserToken(headersList);

		const hasAccess = await whopSdk.access.checkIfUserHasAccessToAccessPass({
			accessPassId,
			userId,
		});

		return {
			success: true,
			hasAccess: hasAccess.hasAccess,
			userId,
		};
	} catch (error) {
		console.error("Failed to check user access:", error);
		return {
			success: false,
			hasAccess: false,
			error: error instanceof Error ? error.message : "Failed to check access",
		};
	}
}
