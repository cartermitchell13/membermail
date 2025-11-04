"use client";

import { useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Send } from "lucide-react";
import { PricingCard } from "@/components/upgrade/PricingCard";
import { getDefaultPricingTiers } from "@/lib/subscriptions/pricing";
import { Button } from "@/components/ui/button";

type PaywallGateProps = {
	open: boolean;
	onClose: () => void;
	companyId: string;
	reason: "ai" | "send";
	currentTier: "free" | "pro" | "enterprise";
	onRefresh: () => Promise<void>;
};

const FEATURE_COPY: Record<"ai" | "send", { title: string; description: string; icon: typeof Sparkles }> = {
	ai: {
		title: "Unlock AI copilots",
		description: "Upgrade to generate newsletters, rewrite copy, and pull on-brand imagery with one click.",
		icon: Sparkles,
	},
	send: {
		title: "Send without limits",
		description: "Upgrade to send campaigns and production tests to your members with full deliverability tooling.",
		icon: Send,
	},
};

export function PaywallGate({ open, onClose, companyId, reason, currentTier, onRefresh }: PaywallGateProps) {
	const tiers = useMemo(() => getDefaultPricingTiers(), []);
	const feature = FEATURE_COPY[reason];
	const Icon = feature.icon;

    if (!open) return null;

    return createPortal(
        (
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <div
                    onClick={(event) => event.stopPropagation()}
                    className="relative w-full max-w-5xl rounded-2xl border border-white/10 bg-[#111111] text-white shadow-2xl mx-auto max-h-[85vh] overflow-hidden"
                >
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="ghost"
                        size="sm"
                        className="absolute right-4 top-4"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="p-6 md:p-8 overflow-y-auto max-h-[85vh]">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="flex flex-col justify-center space-y-6">
                                <div className="inline-flex items-center gap-3 rounded-full border border-[#FA4616]/40 bg-[#FA4616]/10 px-4 py-2 text-xs font-medium text-[#FA4616]">
                                    <span>Current tier: {currentTier === "free" ? "Free" : currentTier === "pro" ? "Pro" : "Enterprise"}</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-[#FA4616]/15 p-3">
                                        <Icon className="h-6 w-6 text-[#FA4616]" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-semibold text-white">{feature.title}</h2>
                                        <p className="mt-2 text-sm text-white/60">{feature.description}</p>
                                    </div>
                                </div>
                                <ul className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/70">
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1.5 h-2 w-2 rounded-full bg-[#FA4616]" />
                                        <span>Pro unlocks AI assistants, image generation, and higher send limits.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1.5 h-2 w-2 rounded-full bg-[#FA4616]" />
                                        <span>Enterprise includes everything in Pro plus concierge onboarding and 5 team seats.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1.5 h-2 w-2 rounded-full bg-[#FA4616]" />
                                        <span>Purchases update instantly. Refresh this page once checkout completes.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                                    <h3 className="text-sm font-medium uppercase tracking-wider text-white/60">Choose your plan</h3>
                                    <div className="mt-4 grid gap-4">
                                        {tiers.map((tier) => (
                                            <PricingCard
                                                key={tier.planId}
                                                tier={tier}
                                                companyId={companyId}
                                                onPurchaseSuccess={async () => {
                                                    await onRefresh();
                                                    onClose();
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={async () => {
                                        await onRefresh();
                                        onClose();
                                    }}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Already upgraded? Refresh access
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        document.body,
    );
}
