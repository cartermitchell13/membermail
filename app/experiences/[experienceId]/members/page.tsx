"use client";
import { use, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Member = {
    id: number;
    email: string;
    name: string | null;
    membership_tier: string | null;
    status: string | null;
    joined_at: string;
    last_active_at: string | null;
    engagement_score: number | null;
};

export default function MembersPage({ params }: { params: Promise<{ experienceId: string }> }) {
    const { experienceId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<Member[]>([]);
    const [total, setTotal] = useState(0);
    const [status, setStatus] = useState<string>(searchParams.get("status") ?? "");
    const [tier, setTier] = useState<string>(searchParams.get("tier") ?? "");
    const [q, setQ] = useState<string>(searchParams.get("q") ?? "");
    const [breakdown, setBreakdown] = useState<{ status: Record<string, number>; tiers: Record<string, number> }>({ status: {}, tiers: {} });

    const qs = useMemo(() => {
        const p = new URLSearchParams();
        p.set("companyId", experienceId);
        if (status) p.set("status", status);
        if (tier) p.set("tier", tier);
        if (q) p.set("q", q);
        p.set("limit", "50");
        p.set("offset", "0");
        return p.toString();
    }, [experienceId, status, tier, q]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const res = await fetch(`/api/members?${qs}`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members);
                setTotal(data.total);
                setBreakdown(data.breakdown);
            }
            setLoading(false);
        })();
    }, [qs]);

    function applyFilters() {
        const p = new URLSearchParams();
        if (status) p.set("status", status);
        if (tier) p.set("tier", tier);
        if (q) p.set("q", q);
        router.replace(`?${p.toString()}`);
    }

    async function syncNow() {
        await fetch(`/api/sync/members?companyId=${experienceId}`, { method: "POST" });
        // Refetch
        const res = await fetch(`/api/members?${qs}`, { cache: "no-store" });
        if (res.ok) {
            const data = await res.json();
            setMembers(data.members);
            setTotal(data.total);
            setBreakdown(data.breakdown);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-semibold tracking-tight">Members</h1>
                <Button onClick={syncNow}>Sync now</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total</CardTitle>
                    </CardHeader>
                    <CardContent>{total}</CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Active</CardTitle>
                    </CardHeader>
                    <CardContent>{breakdown.status?.active ?? 0}</CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Cancelled</CardTitle>
                    </CardHeader>
                    <CardContent>{breakdown.status?.cancelled ?? 0}</CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Paused</CardTitle>
                    </CardHeader>
                    <CardContent>{breakdown.status?.paused ?? 0}</CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input placeholder="Search by name/email" value={q} onChange={(e) => setQ(e.target.value)} />
                <Input placeholder="Filter by status (active/cancelled/paused)" value={status} onChange={(e) => setStatus(e.target.value)} />
                <Input placeholder="Filter by tier" value={tier} onChange={(e) => setTier(e.target.value)} />
                <Button onClick={applyFilters}>Apply</Button>
            </div>

            {loading ? (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                    <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] bg-white/5 text-white/70 text-2 px-4 py-2">
                        <span>Name / Email</span>
                        <span>Tier</span>
                        <span>Status</span>
                        <span>Joined</span>
                        <span>Engagement</span>
                    </div>
                    <div className="px-4 py-8 text-white/70 text-center">Loading...</div>
                </div>
            ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-4">
                    <div className="text-center max-w-xl">
                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-white/10">
                            <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-3">No members found</h3>
                        <p className="text-white/50 mb-8 text-base leading-relaxed">
                            {q || status || tier ? (
                                <>Your filters didn't match any members. Try adjusting your search criteria or sync your members from Whop.</>
                            ) : (
                                <>Sync your community members from Whop to get started. Once synced, you'll be able to view member details, track engagement, and send targeted campaigns.</>
                            )}
                        </p>
                        <Button 
                            onClick={syncNow}
                            className="bg-[#FA4616] text-white hover:bg-[#E23F14] h-11 px-8 shadow-lg shadow-[#FA4616]/20"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sync members from Whop
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                    <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] bg-white/5 text-white/70 text-2 px-4 py-2">
                        <span>Name / Email</span>
                        <span>Tier</span>
                        <span>Status</span>
                        <span>Joined</span>
                        <span>Engagement</span>
                    </div>
                    <div className="divide-y divide-white/5 bg-white/2">
                        {members.map((m) => (
                            <div key={m.id} className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] items-center px-4 py-3 hover:bg-white/[0.04]">
                                <div className="truncate">
                                    <div className="text-white">{m.name ?? m.email}</div>
                                    <div className="text-white/60 text-2">{m.email}</div>
                                </div>
                                <div className="text-white/70">{m.membership_tier ?? "-"}</div>
                                <div className="text-white/70">{m.status ?? "-"}</div>
                                <div className="text-white/70">{new Date(m.joined_at).toLocaleDateString()}</div>
                                <div className="text-white/70">{m.engagement_score ?? 0}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


