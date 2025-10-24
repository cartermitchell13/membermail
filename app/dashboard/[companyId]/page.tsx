import { redirect } from "next/navigation";

export default function DashboardPage({
	params,
}: {
	params: { companyId: string };
}) {
	// Redirect creators straight to the campaigns dashboard for this company
	redirect(`/dashboard/${params.companyId}/campaigns`);
}
