import { headers } from "next/headers";
import { whopSdk } from "@/lib/whop-sdk";
import { DEV_BYPASS_COMPANY_IDS } from "@/lib/subscriptions/constants";

type AccessTier = "free" | "pro" | "enterprise";

export type SubscriptionAccess = {
	tier: AccessTier;
	canUseAI: boolean;
	canSend: boolean;
	isCompanyMember: boolean;
	userId: string | null;
	companyId: string | null;
	proAccess: boolean;
	enterpriseAccess: boolean;
	authorizedUsersCount?: number;
};

function resolveEnv(key: string): string | null {
	const value = process.env[key];
	if (!value || value === "fallback") {
		console.warn(`[SubscriptionAccess] Missing environment variable: ${key}`);
		return null;
	}
	return value;
}

export async function getSubscriptionAccess({
	companyId,
	headersList,
}: {
	companyId?: string | null;
	headersList?: Headers;
}): Promise<SubscriptionAccess> {
	const bypassedCompany = Boolean(companyId && DEV_BYPASS_COMPANY_IDS.has(companyId));

	if (bypassedCompany) {
		return {
			tier: "enterprise",
			canUseAI: true,
			canSend: true,
			isCompanyMember: true,
			userId: null,
			companyId: companyId ?? null,
			proAccess: true,
			enterpriseAccess: true,
			authorizedUsersCount: undefined,
		};
	}

	const effectiveHeaders = headersList ?? (await headers());
	let userId: string | null = null;
	let tier: AccessTier = "free";
	let proAccess = false;
	let enterpriseAccess = false;
	let isCompanyMember = false;
	let authorizedUsersCount: number | undefined;

	try {
		const verification = await whopSdk.verifyUserToken(effectiveHeaders);
		userId = verification.userId ?? null;
	} catch (error) {
		console.error("[SubscriptionAccess] Failed to verify user token", error);
		return {
			tier,
			canUseAI: false,
			canSend: false,
			isCompanyMember,
			userId,
			companyId: companyId ?? null,
			proAccess,
			enterpriseAccess,
		};
	}

	if (userId) {
		const enterprisePassId = resolveEnv("NEXT_PUBLIC_ENTERPRISE_ACCESS_PASS_ID");
		const proPassId = resolveEnv("NEXT_PUBLIC_PRO_ACCESS_PASS_ID");

		try {
			if (enterprisePassId) {
				const access = await whopSdk.access.checkIfUserHasAccessToAccessPass({
					accessPassId: enterprisePassId,
					userId,
				});
				enterpriseAccess = Boolean(access?.hasAccess);
			}
		} catch (error) {
			console.error("[SubscriptionAccess] Failed enterprise access check", error);
		}

		try {
			if (!enterpriseAccess && proPassId) {
				const access = await whopSdk.access.checkIfUserHasAccessToAccessPass({
					accessPassId: proPassId,
					userId,
				});
				proAccess = Boolean(access?.hasAccess);
			}
		} catch (error) {
			console.error("[SubscriptionAccess] Failed pro access check", error);
		}

		if (companyId) {
			try {
				const companyAccess = await whopSdk.access.checkIfUserHasAccessToCompany({
					companyId,
					userId,
				});
				isCompanyMember = Boolean(companyAccess?.hasAccess);
			} catch (error) {
				console.error("[SubscriptionAccess] Failed company access check", error);
			}
		}
	}

	if (enterpriseAccess) {
		tier = "enterprise";
	} else if (proAccess) {
		tier = "pro";
	}

	if (tier === "enterprise" && companyId) {
		try {
			const authorized = await whopSdk.companies.listAuthorizedUsers({
				companyId,
			});
			authorizedUsersCount = Array.isArray(authorized?.authorizedUsers)
				? authorized.authorizedUsers.length
				: undefined;
		} catch (error) {
			console.error("[SubscriptionAccess] Failed to list authorized users", error);
		}
	}

	return {
		tier,
		canUseAI: tier !== "free",
		canSend: tier !== "free",
		isCompanyMember,
		userId,
		companyId: companyId ?? null,
		proAccess,
		enterpriseAccess,
		authorizedUsersCount,
	};
}
