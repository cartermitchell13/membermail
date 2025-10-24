"use client";

import { use } from "react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const RESERVED_USERNAMES = new Set(["admin", "support", "postmaster", "abuse", "no-reply"]);
type AvailabilityState = "unknown" | "checking" | "available" | "taken" | "invalid";

function validateUsername(username: string): { valid: boolean; normalized: string; message?: string } {
    const normalized = username.trim().toLowerCase();

    if (normalized.length === 0) {
        return { valid: false, normalized: "", message: "Username is required" };
    }

    if (normalized.length < 3 || normalized.length > 30) {
        return { valid: false, normalized, message: "Must be 3-30 characters" };
    }

    if (!/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(normalized)) {
        return {
            valid: false,
            normalized,
            message: "Use lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.",
        };
    }

    if (normalized.includes("--")) {
        return { valid: false, normalized, message: "Hyphens cannot be consecutive" };
    }

    if (RESERVED_USERNAMES.has(normalized)) {
        return { valid: false, normalized, message: "This username is reserved" };
    }

    return { valid: true, normalized };
}

export default function SettingsPage({ params }: { params: Promise<{ companyId: string }> }) {
    const { companyId } = use(params);

    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [usernameLocked, setUsernameLocked] = useState(false);
    const [usernameAvailability, setUsernameAvailability] = useState<AvailabilityState>("unknown");
    const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
    const [savingIdentity, setSavingIdentity] = useState(false);
    const [loadingIdentity, setLoadingIdentity] = useState(true);

    const [fromName, setFromName] = useState("");
    const [replyTo, setReplyTo] = useState("");
    const [footer, setFooter] = useState("");
    const [savingEmailSettings, setSavingEmailSettings] = useState(false);
    const [stats, setStats] = useState<{ member_count?: number; last_sync_at?: string | null }>({});

    useEffect(() => {
        (async () => {
            const res = await fetch(`/api/communities/resolve?companyId=${companyId}`);
            if (!res.ok) {
                setLoadingIdentity(false);
                return;
            }

            const { id } = await res.json();

            const [detailsRes, identityRes] = await Promise.all([
                fetch(`/api/communities/${id}`),
                fetch(`/api/sender-identity?companyId=${companyId}`),
            ]);

            if (detailsRes.ok) {
                const data = await detailsRes.json();
                setFromName(data.from_name ?? "");
                setReplyTo(data.reply_to_email ?? "");
                setFooter(data.footer_text ?? "");
                setStats({ member_count: data.member_count, last_sync_at: data.last_sync_at });
            }

            if (identityRes.ok) {
                const identity = await identityRes.json();
                setDisplayName(identity.display_name ?? "");
                if (identity.mail_username) {
                    setUsername(identity.mail_username);
                    setUsernameLocked(true);
                    setUsernameAvailability("available");
                } else {
                    setUsername("");
                    setUsernameLocked(false);
                }
            }

            setLoadingIdentity(false);
        })();
    }, [companyId]);

    useEffect(() => {
        if (usernameLocked) {
            setUsernameAvailability("available");
            setUsernameMessage(null);
            return;
        }

        if (!username) {
            setUsernameAvailability("unknown");
            setUsernameMessage(null);
            return;
        }

        const { valid, normalized, message } = validateUsername(username);
        setUsernameMessage(message ?? null);

        if (!valid) {
            setUsernameAvailability("invalid");
            return;
        }

        setUsernameAvailability("checking");
        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/sender-identity/check?username=${encodeURIComponent(normalized)}`, {
                    signal: controller.signal,
                });
                if (!res.ok) {
                    setUsernameAvailability("invalid");
                    return;
                }
                const data = await res.json();
                setUsernameAvailability(data.available ? "available" : "taken");
            } catch (error) {
                if ((error as Error).name !== "AbortError") {
                    setUsernameAvailability("invalid");
                }
            }
        }, 300);

        return () => {
            controller.abort();
            clearTimeout(timeout);
        };
    }, [username, usernameLocked]);

    const senderPreview = useMemo(() => {
        if (!displayName && !username) return "Sender address preview";
        const safeName = displayName.replace(/"/g, '\\"').trim();
        const label = safeName.length > 0 ? safeName : "MemberMail";
        const handle = username || "username";
        return `${label} <${handle}@mail.membermail.app>`;
    }, [displayName, username]);

    async function saveIdentity(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (savingIdentity) return;

        if (!displayName.trim()) {
            setUsernameMessage("Display name is required");
            return;
        }

        const { valid, normalized, message } = validateUsername(username);
        if (!usernameLocked && !valid) {
            setUsernameMessage(message ?? "Invalid username");
            setUsernameAvailability("invalid");
            return;
        }

        setSavingIdentity(true);
        setUsernameMessage(null);

        const payload = {
            display_name: displayName.trim(),
            mail_username: usernameLocked ? username : normalized,
        };

        const res = await fetch(`/api/sender-identity?companyId=${companyId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: "Failed to save sender identity" }));
            setUsernameMessage(error.error ?? "Failed to save sender identity");
            setSavingIdentity(false);
            return;
        }

        if (!usernameLocked) {
            setUsernameLocked(true);
        }

        setFromName(displayName.trim());
        toast.success("Sender identity saved");
        setSavingIdentity(false);
    }

    async function saveEmailSettings() {
        setSavingEmailSettings(true);
        await fetch(`/api/communities/update-email-settings?companyId=${companyId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from_name: fromName, reply_to_email: replyTo, footer_text: footer }),
        });
        setSavingEmailSettings(false);
        toast.success("Email settings saved");
    }

    async function syncNow() {
        await fetch(`/api/sync/members?companyId=${companyId}`, { method: "POST" });
        toast.success("Sync requested");
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
            </div>

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

            <Card className="border border-white/10">
                <CardHeader className="border-b border-white/10 bg-white/5">
                    <CardTitle>Sender identity</CardTitle>
                    <p className="text-sm text-white/60">Set the name and address that appear on every email you send.</p>
                </CardHeader>
                <CardContent className="space-y-6 bg-white/2 p-6">
                    <form className="space-y-6" onSubmit={saveIdentity}>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-white/90">From name</label>
                            <Input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your display name"
                                disabled={loadingIdentity || savingIdentity}
                                className="max-w-md bg-black/40 border-white/10 text-white"
                            />
                            <p className="text-xs text-white/50">Shown in recipients' inboxes as the sender name.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-white/90">Username</label>
                            <div className="flex items-stretch max-w-md">
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                    placeholder="yourname"
                                    disabled={loadingIdentity || savingIdentity || usernameLocked}
                                    className={`flex-1 rounded-r-none border-r-0 bg-black/40 border-white/10 text-white ${usernameLocked ? "opacity-75" : ""}`}
                                />
                                <span className="px-3 py-2 rounded-r-md border border-white/10 bg-black/30 text-white/80 text-sm flex items-center">
                                    @mail.membermail.app
                                </span>
                            </div>
                            {!usernameLocked && (
                                <p className="text-xs text-white/60">
                                    {usernameAvailability === "checking" && "Checking availability..."}
                                    {usernameAvailability === "available" && "✅ Available"}
                                    {usernameAvailability === "taken" && "❌ Username taken"}
                                    {usernameAvailability === "invalid" && (usernameMessage ?? "Invalid username")}
                                    {usernameAvailability === "unknown" && (usernameMessage ?? "Choose a unique sender handle.")}
                                </p>
                            )}
                            {usernameLocked && (
                                <p className="text-xs text-white/60">Username is locked. Contact support if you need to change it.</p>
                            )}
                        </div>

                        <div className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
                            <span className="text-white/90 font-medium">Preview:</span> {senderPreview}
                        </div>

                        {usernameMessage && usernameLocked && (
                            <div className="text-sm text-[#ff6b6b]">{usernameMessage}</div>
                        )}

                        <Button
                            type="submit"
                            disabled={savingIdentity || loadingIdentity || (!usernameLocked && usernameAvailability !== "available")}
                            className="bg-[#FA4616] hover:bg-[#E23F14] text-white"
                        >
                            {savingIdentity ? "Saving..." : "Save sender identity"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border border-white/10">
                <CardHeader className="border-b border-white/10 bg-white/5">
                    <CardTitle>Reply-to & footer settings</CardTitle>
                    <p className="text-sm text-white/60">Control where replies go and what appears at the bottom of your emails.</p>
                </CardHeader>
                <CardContent className="space-y-6 bg-white/2 p-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Reply-to email</label>
                        <Input
                            value={replyTo}
                            onChange={(e) => setReplyTo(e.target.value)}
                            placeholder="you@example.com"
                            type="email"
                            className="max-w-md bg-black/40 border-white/10 text-white"
                        />
                        <p className="text-xs text-white/50">Replies to your campaigns will land in this inbox.</p>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Footer text</label>
                        <Input
                            value={footer}
                            onChange={(e) => setFooter(e.target.value)}
                            placeholder="Copyright 2025 Your Company. All rights reserved."
                            className="max-w-md bg-black/40 border-white/10 text-white"
                        />
                        <p className="text-xs text-white/50">Shown at the bottom of every email you send.</p>
                    </div>
                    <div className="pt-2">
                        <Button
                            disabled={savingEmailSettings}
                            onClick={saveEmailSettings}
                            className="bg-[#FA4616] hover:bg-[#E23F14] text-white"
                        >
                            {savingEmailSettings ? "Saving..." : "Save reply & footer"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
