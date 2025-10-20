import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function ExperienceLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	return (
		<SidebarProvider>
			<div className="min-h-screen bg-black flex">
				<AppSidebar experienceId={experienceId} />
				<main className="relative flex-1 min-h-0 m-4 h-[calc(100vh-2rem)] rounded-2xl border border-white/10 bg-[#111111] text-white overflow-hidden px-8 pt-8 pb-8">
					{children}
				</main>
			</div>
		</SidebarProvider>
	);
}
