import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
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
