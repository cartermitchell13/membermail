import Link from "next/link";
import { headers } from "next/headers";
// Avoid importing client-only utilities in server components

async function getCampaigns(baseUrl: string) {
	const res = await fetch(`${baseUrl}/api/campaigns`, { cache: "no-store" });
	if (!res.ok) return [] as any[];
	const data = await res.json();
	return data.campaigns as any[];
}

export default async function CampaignsListPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	const h = await headers();
	const proto = h.get("x-forwarded-proto") ?? "http";
	const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
	const baseUrl = `${proto}://${host}`;
	const campaigns = await getCampaigns(baseUrl);
	
	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Campaigns</h1>
				<div className="flex w-full sm:w-auto sm:ml-auto items-center gap-3">
					<Link
						href={`/dashboard/${companyId}/campaigns/new`}
						className={
							"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors " +
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA4616] disabled:pointer-events-none disabled:opacity-50 " +
							"bg-[#FA4616] text-white hover:bg-[#E23F14] h-9 px-4 w-full sm:w-auto"
						}
					>
						New campaign
					</Link>
					<Link
						href={`/dashboard/${companyId}/campaigns/new?source=drafts`}
						className={
							"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors " +
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA4616] disabled:pointer-events-none disabled:opacity-50 " +
							"border border-white/10 text-white hover:bg-white/10 h-9 px-4 w-full sm:w-auto"
						}
					>
						Open drafts
					</Link>
				</div>
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
						<Link
							href={`/dashboard/${companyId}/campaigns/new`}
							className={
								"inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors " +
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA4616] focus-visible:ring-offset-2 focus-visible:ring-offset-black " +
								"bg-[#FA4616] text-white hover:bg-[#E23F14] h-11 px-8 shadow-lg shadow-[#FA4616]/20"
							}
						>
							<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							Create your first campaign
						</Link>
					</div>
				</div>
			) : (
				<div className="rounded-xl border border-white/10 overflow-hidden">
					{/* Desktop Header - Hidden on mobile */}
					<div className="hidden lg:grid grid-cols-[1fr_140px_140px_140px_100px] bg-white/5 text-white/70 text-sm px-4 py-2">
						<span>Subject</span>
						<span>Status</span>
						<span>Sent</span>
						<span>Opens / Clicks</span>
						<span></span>
					</div>
					<div className="divide-y divide-white/5 bg-white/2">
						{campaigns.map((c) => (
							<Link 
								key={c.id} 
								href={`/dashboard/${companyId}/campaigns/${c.id}`}
								className="block hover:bg-white/[0.04] transition-colors cursor-pointer group"
							>
								{/* Desktop Layout */}
								<div className="hidden lg:grid grid-cols-[1fr_140px_140px_140px_100px] items-center px-4 py-3">
									<div className="truncate font-medium group-hover:text-white transition-colors">{c.subject}</div>
									<div className="text-white/70 flex items-center gap-2">
										<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
											c.status === 'sent' ? 'bg-green-500/10 text-green-400' :
											c.status === 'draft' ? 'bg-blue-500/10 text-blue-400' :
											'bg-gray-500/10 text-gray-400'
										}`}>
											{c.status}
										</span>
										{c.send_mode === 'automation' && (
											<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-300">
												Automation
											</span>
										)}
									</div>
									<div className="text-white/70">{c.sent_at ?? "-"}</div>
									<div className="text-white/70">{c.open_count} / {c.click_count}</div>
									<div className="flex justify-end">
										<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#FA4616]/10 text-[#FA4616] group-hover:bg-[#FA4616] group-hover:text-white transition-colors">
											View
											<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</span>
									</div>
								</div>
								
								{/* Mobile/Tablet Layout */}
								<div className="lg:hidden px-4 py-4 space-y-3">
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1 min-w-0">
											<h3 className="font-medium text-white truncate group-hover:text-[#FA4616] transition-colors">{c.subject}</h3>
											<div className="flex items-center gap-2 mt-1.5">
												<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
													c.status === 'sent' ? 'bg-green-500/10 text-green-400' :
													c.status === 'draft' ? 'bg-blue-500/10 text-blue-400' :
													'bg-gray-500/10 text-gray-400'
												}`}>
													{c.status}
												</span>
												{c.send_mode === 'automation' && (
													<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-300">
														Automation
													</span>
												)}
												<span className="text-xs text-white/50">{c.sent_at ?? "Not sent"}</span>
											</div>
										</div>
										<svg className="w-5 h-5 text-white/30 group-hover:text-[#FA4616] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
										</svg>
									</div>
									<div className="flex items-center gap-4 text-sm">
										<div className="flex items-center gap-1.5">
											<svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
											</svg>
											<span className="text-white/70">{c.open_count}</span>
										</div>
										<div className="flex items-center gap-1.5">
											<svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
											</svg>
											<span className="text-white/70">{c.click_count}</span>
										</div>
									</div>
								</div>
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
