import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureCompanyWebhook } from "@/lib/whop/webhooks";

export default async function ExperienceLayout({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	// Derive the company from the experience and redirect to the company campaigns
	const headersList = await headers();
	const { experienceId } = await params;
	const { userId } = await whopSdk.verifyUserToken(headersList);
	const experience = await whopSdk.experiences.getExperience({ experienceId });

	// Optional: You could also enforce access here if needed using checkIfUserHasAccessToExperience
	const companyId = experience.company.id;

	// Ensure the Whop webhook is created/updated for this company
	try {
		await ensureCompanyWebhook(companyId);
	} catch (err) {
		console.warn("[ExperienceLayout] ensureCompanyWebhook failed", {
			companyId,
			error: err instanceof Error ? err.message : String(err),
		});
	}
	redirect(`/dashboard/${companyId}/campaigns`);
}
