import Link from "next/link";
import { headers } from "next/headers";
// Avoid importing client-only utilities in server components

async function getCampaigns(baseUrl: string) {
	const res = await fetch(`${baseUrl}/api/campaigns`, { cache: "no-store" });
	if (!res.ok) return [] as any[];
	const data = await res.json();
	return data.campaigns as any[];
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
				<Link
					href="./campaigns/new"
					className={
						"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors " +
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA4616] disabled:pointer-events-none disabled:opacity-50 " +
						"bg-[#FA4616] text-white hover:bg-[#E23F14] h-9 px-4"
					}
				>
					New campaign
				</Link>
			</div>
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
							<div className="text-white/70">{c.sent_at ?? "-"}</div>
							<div className="text-white/70">{c.open_count} / {c.click_count}</div>
							<div className="text-right">
								<Link className="text-accent-9 underline" href={`./campaigns/${c.id}`}>Open</Link>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}


