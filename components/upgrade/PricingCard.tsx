"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useState } from "react";
import { useIframeSdk } from "@whop/react";
import { createCheckoutSession } from "@/lib/actions/create-checkout-session";
import { toast } from "sonner";

/**
 * Interface defining the structure of a pricing tier
 */
export interface PricingTier {
	name: string;
	price: string;
	period: string;
	description: string;
	features: string[];
	planId: string;
	accessPassId: string;
	popular?: boolean;
	buttonText?: string;
}

interface PricingCardProps {
	tier: PricingTier;
	companyId?: string;
	onPurchaseSuccess?: () => void;
}

/**
 * PricingCard component displays a subscription tier with purchase functionality
 * Uses Whop's iframe SDK to open a native payment modal
 */
export function PricingCard({
	tier,
	companyId,
	onPurchaseSuccess,
}: PricingCardProps) {
	const iframeSdk = useIframeSdk();
	const [isPurchasing, setIsPurchasing] = useState(false);

	/**
	 * Handles the purchase flow:
	 * 1. Creates a checkout session on the server
	 * 2. Opens Whop's payment modal using the iframe SDK
	 * 3. Handles success/error states
	 */
	const handlePurchase = async () => {
		try {
			setIsPurchasing(true);
			console.log("[PricingCard] Starting purchase for tier:", tier.name, "Plan ID:", tier.planId);

			// Create a checkout session on the server
			console.log("[PricingCard] Calling createCheckoutSession...");
			const result = await createCheckoutSession(tier.planId, companyId);
			console.log("[PricingCard] Server response:", result);

			if (!result.success || !result.checkoutSession) {
				console.error("[PricingCard] Checkout session failed:", result.error);
				throw new Error(result.error || "Failed to create checkout session");
			}

				// Open Whop's payment modal with the checkout session
			console.log("[PricingCard] Opening Whop payment modal...");
			console.log("[PricingCard] iframeSdk:", iframeSdk);
			
			// Check if we're in a valid Whop context
			if (!iframeSdk || typeof iframeSdk.inAppPurchase !== 'function') {
				console.warn("[PricingCard] Not in Whop iframe context - using demo mode");
				
				// Demo mode for local testing
				const shouldProceed = confirm(
					`Demo Mode: This would normally open Whop's payment modal.\n\n` +
					`Tier: ${tier.name}\n` +
					`Price: ${tier.price}/${tier.period}\n\n` +
					`Click OK to simulate successful payment, or Cancel to simulate cancellation.`
				);
				
				if (shouldProceed) {
					// Simulate successful payment
					toast.success("Demo: Purchase successful!", {
						description: `You now have access to ${tier.name} (Demo Mode)`,
					});
					
					if (onPurchaseSuccess) {
						onPurchaseSuccess();
					} else {
						window.location.href = "/upgrade/success";
					}
				} else {
					throw new Error("Purchase cancelled (Demo Mode)");
				}
				return;
			}
			
			const purchaseResult = await iframeSdk.inAppPurchase(result.checkoutSession);
			console.log("[PricingCard] Purchase result:", purchaseResult);

			// Handle the result from the payment modal
			if (purchaseResult.status === "ok") {
				toast.success("Purchase successful!", {
					description: `You now have access to ${tier.name}`,
				});

				// Call the success callback if provided
				if (onPurchaseSuccess) {
					onPurchaseSuccess();
				} else {
					// Default: redirect to success page
					window.location.href = "/upgrade/success";
				}
			} else {
				// User cancelled or there was an error
				toast.error("Purchase failed", {
					description: purchaseResult.error || "Please try again",
				});
			}
		} catch (error) {
			console.error("Purchase error:", error);
			toast.error("Purchase failed", {
				description:
					error instanceof Error ? error.message : "An unexpected error occurred",
			});
		} finally {
			setIsPurchasing(false);
		}
	};

	return (
		<div
			className={`relative flex flex-col p-6 rounded-xl ${
				tier.popular
					? "border-2 border-[#FA4616] bg-[#FA4616]/5 shadow-lg shadow-[#FA4616]/10"
					: "border border-white/10 bg-white/[0.02]"
			}`}
		>
			{/* Popular badge for featured tier */}
			{tier.popular && (
				<div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#FA4616] text-white px-3 py-1 rounded-full text-xs font-semibold">
					Most Popular
				</div>
			)}

			{/* Tier name and price */}
			<div className="mb-6">
				<h3 className="text-2xl font-bold mb-3 text-white">{tier.name}</h3>
				<div className="flex items-baseline gap-1">
					<span className="text-4xl font-bold text-white">{tier.price}</span>
					<span className="text-white/50">/{tier.period}</span>
				</div>
				<p className="text-white/60 mt-2 text-sm">{tier.description}</p>
			</div>

			{/* Feature list */}
			<ul className="space-y-3 mb-6 flex-grow">
				{tier.features.map((feature, index) => (
					<li key={index} className="flex items-start gap-2">
						<Check className="h-5 w-5 text-[#FA4616] flex-shrink-0 mt-0.5" />
						<span className="text-sm text-white/70">{feature}</span>
					</li>
				))}
			</ul>

			{/* Purchase button */}
			<Button
				onClick={handlePurchase}
				disabled={isPurchasing}
				variant={tier.popular ? "default" : "secondary"}
				className="w-full"
			>
				{isPurchasing ? "Processing..." : tier.buttonText || "Get Started"}
			</Button>
		</div>
	);
}
