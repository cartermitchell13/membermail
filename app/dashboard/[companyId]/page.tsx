import { redirect } from "next/navigation";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	// Redirect creators straight to the campaigns dashboard for this company
	const { companyId } = await params;
	redirect(`/dashboard/${companyId}/campaigns`);
}
