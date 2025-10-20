import { headers } from "next/headers";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MetricsData {
	overview: {
		totalCampaigns: number;
		totalRecipients: number;
		avgOpenRate: string;
		avgClickRate: string;
		sentCampaigns: number;
	};
	recentCampaigns: Array<{
		id: number;
		subject: string;
		sent_at: string | null;
		recipient_count: number;
		open_count: number;
		click_count: number;
		open_rate: number;
		click_rate: number;
	}>;
	topCampaigns: Array<{
		id: number;
		subject: string;
		sent_at: string | null;
		recipient_count: number;
		open_count: number;
		click_count: number;
		open_rate: number;
		click_rate: number;
	}>;
	eventsSummary: {
		opened: number;
		clicked: number;
		bounced: number;
		complained: number;
	};
	performanceOverTime: Array<{
		date: string;
		opens: number;
		clicks: number;
		recipients: number;
	}>;
}

async function getMetrics(baseUrl: string, communityId: string): Promise<MetricsData | null> {
	try {
		const res = await fetch(`${baseUrl}/api/metrics?communityId=${communityId}`, {
			cache: "no-store",
		});
		if (!res.ok) return null;
		return await res.json();
	} catch (error) {
		console.error("Error fetching metrics:", error);
		return null;
	}
}

function formatDate(dateString: string | null): string {
	if (!dateString) return "-";
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatNumber(num: number): string {
	if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
	if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
	return num.toString();
}

export default async function MetricsPage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	const h = await headers();
	const proto = h.get("x-forwarded-proto") ?? "http";
	const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
	const baseUrl = `${proto}://${host}`;

	const metrics = await getMetrics(baseUrl, experienceId);

	if (!metrics) {
    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight">Metrics</h1>
				<div className="text-white/60">Unable to load metrics data.</div>
			</div>
		);
	}

	const { overview, recentCampaigns, topCampaigns, eventsSummary, performanceOverTime } = metrics;

	return (
		<div className="space-y-8 overflow-auto h-full">
			<div className="flex items-center justify-between">
				<h1 className="text-4xl font-semibold tracking-tight">Metrics</h1>
			</div>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium text-white/70">
								Total Campaigns
							</CardTitle>
							<svg
								className="w-4 h-4 text-white/40"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{overview.totalCampaigns}</div>
						<p className="text-2 text-white/50 mt-1">
							{overview.sentCampaigns} sent
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium text-white/70">
								Total Recipients
							</CardTitle>
							<svg
								className="w-4 h-4 text-white/40"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{formatNumber(overview.totalRecipients)}</div>
						<p className="text-2 text-white/50 mt-1">emails sent</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium text-white/70">
								Avg. Open Rate
							</CardTitle>
							<svg
								className="w-4 h-4 text-white/40"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
							</svg>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{overview.avgOpenRate}%</div>
						<p className="text-2 text-white/50 mt-1">
							{eventsSummary.opened} total opens
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium text-white/70">
								Avg. Click Rate
							</CardTitle>
							<svg
								className="w-4 h-4 text-white/40"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
								/>
							</svg>
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{overview.avgClickRate}%</div>
						<p className="text-2 text-white/50 mt-1">
							{eventsSummary.clicked} total clicks
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Recent Campaigns */}
			<div>
				<h2 className="text-2xl font-semibold mb-4">Recent Campaigns</h2>
				{recentCampaigns.length === 0 ? (
					<Card>
						<CardContent className="py-12">
							<div className="text-center text-white/50">
								No campaigns sent yet. Create your first campaign to see metrics here.
							</div>
						</CardContent>
					</Card>
				) : (
					<div className="rounded-xl border border-white/10 overflow-hidden">
						<div className="grid grid-cols-[1fr_120px_120px_120px_120px] bg-white/5 text-white/70 text-2 px-4 py-3 font-medium">
							<span>Subject</span>
							<span className="text-right">Recipients</span>
							<span className="text-right">Opens</span>
							<span className="text-right">Clicks</span>
							<span className="text-right">Open Rate</span>
						</div>
						<div className="divide-y divide-white/5 bg-white/2">
							{recentCampaigns.map((campaign) => (
								<Link
									key={campaign.id}
									href={`./campaigns/${campaign.id}`}
									className="grid grid-cols-[1fr_120px_120px_120px_120px] items-center px-4 py-3 hover:bg-white/[0.04] transition-colors"
								>
									<div className="space-y-1">
										<div className="truncate font-medium">{campaign.subject}</div>
										<div className="text-2 text-white/50">
											{formatDate(campaign.sent_at)}
										</div>
									</div>
									<div className="text-right text-white/70">
										{formatNumber(campaign.recipient_count)}
									</div>
									<div className="text-right text-white/70">
										{formatNumber(campaign.open_count)}
									</div>
									<div className="text-right text-white/70">
										{formatNumber(campaign.click_count)}
									</div>
									<div className="text-right">
										<Badge
											className={
												campaign.open_rate > 30
													? "bg-green-500/20 text-green-300"
													: campaign.open_rate > 15
														? "bg-yellow-500/20 text-yellow-300"
														: "bg-white/10 text-white/70"
											}
										>
											{campaign.open_rate.toFixed(1)}%
										</Badge>
									</div>
								</Link>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Two Column Layout for Top Campaigns and Events */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Top Performing Campaigns */}
				<div>
					<h2 className="text-2xl font-semibold mb-4">Top Performing</h2>
					{topCampaigns.length === 0 ? (
						<Card>
							<CardContent className="py-8">
								<div className="text-center text-white/50 text-sm">
									No data available yet.
								</div>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="p-0">
								<div className="divide-y divide-white/5">
									{topCampaigns.map((campaign, index) => (
										<Link
											key={campaign.id}
											href={`./campaigns/${campaign.id}`}
											className="flex items-center gap-4 p-4 hover:bg-white/[0.04] transition-colors"
										>
											<div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-white/70 font-semibold text-sm">
												{index + 1}
											</div>
											<div className="flex-1 min-w-0">
												<div className="truncate font-medium text-sm">
													{campaign.subject}
												</div>
												<div className="text-2 text-white/50">
													{formatNumber(campaign.recipient_count)} recipients
												</div>
											</div>
											<div className="flex gap-2">
												<Badge className="bg-green-500/20 text-green-300">
													{campaign.open_rate.toFixed(1)}% opens
												</Badge>
												<Badge className="bg-blue-500/20 text-blue-300">
													{campaign.click_rate.toFixed(1)}% clicks
												</Badge>
											</div>
										</Link>
									))}
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Email Events Summary */}
				<div>
					<h2 className="text-2xl font-semibold mb-4">Email Events</h2>
					<div className="grid grid-cols-2 gap-4">
						<Card>
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
										<svg
											className="w-5 h-5 text-green-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
									</div>
									<div>
										<div className="text-2xl font-bold">
											{formatNumber(eventsSummary.opened)}
										</div>
										<div className="text-sm text-white/60">Opens</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
										<svg
											className="w-5 h-5 text-blue-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
											/>
										</svg>
									</div>
									<div>
										<div className="text-2xl font-bold">
											{formatNumber(eventsSummary.clicked)}
										</div>
										<div className="text-sm text-white/60">Clicks</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
										<svg
											className="w-5 h-5 text-red-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
											/>
										</svg>
									</div>
									<div>
										<div className="text-2xl font-bold">
											{formatNumber(eventsSummary.bounced)}
										</div>
										<div className="text-sm text-white/60">Bounces</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
										<svg
											className="w-5 h-5 text-yellow-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01"
											/>
										</svg>
									</div>
									<div>
										<div className="text-2xl font-bold">
											{formatNumber(eventsSummary.complained)}
										</div>
										<div className="text-sm text-white/60">Complaints</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>

			{/* Performance Timeline */}
			{performanceOverTime.length > 0 && (
				<div>
					<h2 className="text-2xl font-semibold mb-4">Recent Activity (Last 30 Days)</h2>
					<Card>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className="bg-white/5 text-white/70 text-2">
										<tr>
											<th className="text-left px-4 py-3 font-medium">Date</th>
											<th className="text-right px-4 py-3 font-medium">Recipients</th>
											<th className="text-right px-4 py-3 font-medium">Opens</th>
											<th className="text-right px-4 py-3 font-medium">Clicks</th>
											<th className="text-right px-4 py-3 font-medium">Open Rate</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-white/5">
										{performanceOverTime.map((day, index) => {
											const openRate =
												day.recipients > 0
													? ((day.opens / day.recipients) * 100).toFixed(1)
													: "0.0";
											return (
												<tr key={index} className="hover:bg-white/[0.02]">
													<td className="px-4 py-3 text-sm">
														{formatDate(day.date)}
													</td>
													<td className="px-4 py-3 text-right text-white/70">
														{formatNumber(day.recipients)}
													</td>
													<td className="px-4 py-3 text-right text-white/70">
														{formatNumber(day.opens)}
													</td>
													<td className="px-4 py-3 text-right text-white/70">
														{formatNumber(day.clicks)}
													</td>
													<td className="px-4 py-3 text-right">
														<span className="text-green-400">{openRate}%</span>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{overview.totalCampaigns === 0 && (
				<div className="flex flex-col items-center justify-center py-24 px-4">
					<div className="text-center max-w-xl">
						<div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-white/10">
							<svg
								className="w-10 h-10 text-white/40"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
						</div>
						<h3 className="text-2xl font-semibold text-white mb-3">No metrics yet</h3>
						<p className="text-white/50 mb-8 text-base leading-relaxed">
							Create and send campaigns to start tracking your email performance metrics.
						</p>
						<Link
							href="./campaigns/new"
							className={
								"inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors " +
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA4616] focus-visible:ring-offset-2 focus-visible:ring-offset-black " +
								"bg-[#FA4616] text-white hover:bg-[#E23F14] h-11 px-8 shadow-lg shadow-[#FA4616]/20"
							}
						>
							<svg
								className="w-4 h-4 mr-2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 4v16m8-8H4"
								/>
							</svg>
							Create your first campaign
						</Link>
					</div>
				</div>
			)}
        </div>
    );
}

