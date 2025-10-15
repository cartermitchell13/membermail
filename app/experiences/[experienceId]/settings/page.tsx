"use client";
import { use, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
            <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Community</h2>
                    <div className="text-white/70 text-sm">Members: {stats.member_count ?? "-"} • Last sync: {stats.last_sync_at ? new Date(stats.last_sync_at).toLocaleString() : "-"}</div>
                    <Button onClick={syncNow}>Sync members</Button>
                </div>
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Email</h2>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">From name</label>
                        <Input value={fromName} onChange={(e) => setFromName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Reply-to email</label>
                        <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Footer text</label>
                        <Input value={footer} onChange={(e) => setFooter(e.target.value)} />
                    </div>
                    <Button disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</Button>
                </div>
            </div>
        </div>
    );
}


