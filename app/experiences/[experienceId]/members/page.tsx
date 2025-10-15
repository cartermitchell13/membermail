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

            <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] bg-white/5 text-white/70 text-2 px-4 py-2">
                    <span>Name / Email</span>
                    <span>Tier</span>
                    <span>Status</span>
                    <span>Joined</span>
                    <span>Engagement</span>
                </div>
                <div className="divide-y divide-white/5 bg-white/2">
                    {loading ? (
                        <div className="px-4 py-4 text-white/70">Loading...</div>
                    ) : (
                        members.map((m) => (
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
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}


