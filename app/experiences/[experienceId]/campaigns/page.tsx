import Link from "next/link";
import { headers } from "next/headers";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/ui/cn";
// Avoid importing client-only utilities in server components

async function getCampaigns(baseUrl: string) {
	const res = await fetch(`${baseUrl}/api/campaigns`, { cache: "no-store" });
	if (!res.ok) return [] as any[];
	const data = await res.json();
	return data.campaigns as any[];
}

function formatSentDate(dateString: string | null | undefined): string {
	if (!dateString) return "-";
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	} catch {
		return "-";
	}
}

export default async function CampaignsListPage() {
	const h = await headers();
	const proto = h.get("x-forwarded-proto") ?? "http";
	const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
	const baseUrl = `${proto}://${host}`;
	const campaigns = await getCampaigns(baseUrl);
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-4xl font-semibold tracking-tight">Campaigns</h1>
				<ButtonLink
					href="./campaigns/new"
					variant="default"
					size="md"
				>
					New campaign
				</ButtonLink>
			</div>
			
			{campaigns.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 px-4">
					<div className="text-center max-w-xl">
						<div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-white/10">
							<svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
						</div>
						<h3 className="text-2xl font-semibold text-white mb-3">No campaigns yet</h3>
						<p className="text-white/50 mb-8 text-base leading-relaxed">
							Get started by creating your first email campaign. Reach your members with personalized messages, track engagement, and grow your community.
						</p>
						<ButtonLink
							href="./campaigns/new"
							variant="default"
							size="lg"
							className="inline-flex items-center gap-2"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							Create your first campaign
						</ButtonLink>
					</div>
				</div>
			) : (
				<div className="rounded-xl border border-white/10 overflow-hidden">
					<div className="grid grid-cols-[1fr_140px_140px_140px_100px] bg-white/5 text-white/70 text-2 px-4 py-2">
						<span>Subject</span>
						<span>Status</span>
						<span>Sent</span>
						<span>Opens</span>
						<span></span>
					</div>
					<div className="divide-y divide-white/5 bg-white/2">
						{campaigns.map((c) => (
							<div key={c.id} className="grid grid-cols-[1fr_140px_140px_140px_100px] items-center px-4 py-3 hover:bg-white/[0.04]">
								<div className="truncate">{c.subject}</div>
								<div className="text-white/70">{c.status}</div>
								<div className="text-white/70">{formatSentDate(c.sent_at)}</div>
								<div className="text-white/70">{c.open_count} / {c.click_count}</div>
								<div className="text-right">
									<Link className="text-accent-9 underline" href={`./campaigns/${c.id}`}>Open</Link>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}


