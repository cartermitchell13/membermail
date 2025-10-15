import AppSidebar from "@/components/AppSidebar";

export default async function ExperienceLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	return (
		<div className="min-h-screen grid grid-cols-[240px_1fr] bg-black">
			<AppSidebar experienceId={experienceId} />
			<main className="m-4 min-h-[calc(100vh-2rem)] rounded-2xl border border-white/10 bg-[#111111] text-white overflow-hidden px-8 py-8">
				{children}
			</main>
		</div>
	);
}


