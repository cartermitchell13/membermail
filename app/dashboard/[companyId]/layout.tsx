import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ensureCompanyWebhook } from "@/lib/whop/webhooks";

export default async function DashboardLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;

	// Ensure the Whop webhook is created/updated for this company when a dashboard route is loaded
	try {
		await ensureCompanyWebhook(companyId);
	} catch (err) {
		console.warn("[DashboardLayout] ensureCompanyWebhook failed", {
			companyId,
			error: err instanceof Error ? err.message : String(err),
		});
	}
	return (
		<SidebarProvider>
			<div className="min-h-screen bg-black flex">
				<AppSidebar companyId={companyId} />
				<main className="relative flex-1 min-h-0 m-4 h-[calc(100vh-2rem)] rounded-2xl border border-white/10 bg-[#111111] text-white overflow-y-auto overflow-x-hidden px-8 pt-8 pb-8">
					{children}
				</main>
			</div>
		</SidebarProvider>
	);
}
