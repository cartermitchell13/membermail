"use client";
import { use, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage({ params }: { params: Promise<{ experienceId: string }> }) {
    const { experienceId } = use(params);
    const [fromName, setFromName] = useState("");
    const [replyTo, setReplyTo] = useState("");
    const [footer, setFooter] = useState("");
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState<{ member_count?: number; last_sync_at?: string | null }>({});

    useEffect(() => {
        (async () => {
            const res = await fetch(`/api/communities/resolve?companyId=${experienceId}`);
            if (res.ok) {
                const { id } = await res.json();
                const details = await fetch(`/api/communities/${id}`);
                if (details.ok) {
                    const data = await details.json();
                    setFromName(data.from_name ?? "");
                    setReplyTo(data.reply_to_email ?? "");
                    setFooter(data.footer_text ?? "");
                    setStats({ member_count: data.member_count, last_sync_at: data.last_sync_at });
                }
            }
        })();
    }, [experienceId]);

    async function save() {
        setSaving(true);
        const res = await fetch(`/api/communities/update-email-settings?companyId=${experienceId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from_name: fromName, reply_to_email: replyTo, footer_text: footer }),
        });
        setSaving(false);
    }

    async function syncNow() {
        await fetch(`/api/sync/members?companyId=${experienceId}`, { method: "POST" });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Members</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">{stats.member_count ?? "-"}</CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Last Sync</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-white/70">
                        {stats.last_sync_at ? new Date(stats.last_sync_at).toLocaleString() : "Never"}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={syncNow} className="w-full">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sync members
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Email Settings */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="bg-white/5 px-6 py-4 border-b border-white/10">
                    <h2 className="text-xl font-semibold">Email Settings</h2>
                    <p className="text-sm text-white/60 mt-1">Configure how your emails appear to recipients</p>
                </div>
                <div className="bg-white/2 p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">From name</label>
                        <Input 
                            value={fromName} 
                            onChange={(e) => setFromName(e.target.value)}
                            placeholder="Your Company Name"
                            className="max-w-md"
                        />
                        <p className="text-xs text-white/50">This name will appear in the "From" field of your emails</p>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Reply-to email</label>
                        <Input 
                            value={replyTo} 
                            onChange={(e) => setReplyTo(e.target.value)}
                            placeholder="hello@example.com"
                            type="email"
                            className="max-w-md"
                        />
                        <p className="text-xs text-white/50">Replies to your campaigns will be sent to this email address</p>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Footer text</label>
                        <Input 
                            value={footer} 
                            onChange={(e) => setFooter(e.target.value)}
                            placeholder="© 2025 Your Company. All rights reserved."
                            className="max-w-md"
                        />
                        <p className="text-xs text-white/50">This text will appear at the bottom of all your emails</p>
                    </div>
                    <div className="pt-4">
                        <Button 
                            disabled={saving} 
                            onClick={save}
                            className="bg-[#FA4616] text-white hover:bg-[#E23F14] shadow-lg shadow-[#FA4616]/20"
                        >
                            {saving ? "Saving..." : "Save changes"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


