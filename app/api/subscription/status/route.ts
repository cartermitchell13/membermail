import { NextRequest } from "next/server";
import { getSubscriptionAccess } from "@/lib/subscriptions/access";

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const companyId = url.searchParams.get("companyId");

	try {
		const access = await getSubscriptionAccess({ companyId });
		return Response.json({
			success: true,
			tier: access.tier,
			canUseAI: access.canUseAI,
			canSend: access.canSend,
			isCompanyMember: access.isCompanyMember,
			authorizedUsersCount: access.authorizedUsersCount ?? null,
		});
	} catch (error) {
		console.error("[/api/subscription/status] Failed to resolve subscription access", error);
		return Response.json(
			{
				success: false,
				error: "Unable to resolve subscription status",
			},
			{ status: 500 },
		);
	}
}
