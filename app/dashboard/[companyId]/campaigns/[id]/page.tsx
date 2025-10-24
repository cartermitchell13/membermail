"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimulateSendButton } from "@/components/campaigns/SimulateSendButton";
import { renderEmailWithStyles, extractEmailStyles } from "@/lib/email/render-with-styles";
import { renderEmailFooterHtml } from "@/lib/email/footer";
import { type EmailStyles, defaultEmailStyles } from "@/components/email-builder/ui/EmailStylePanel";
import { getEventLabel } from "@/lib/automations/events";
import type { AutomationTriggerEvent } from "@/lib/automations/events";

export default function CampaignDetailPage({ params }: { params: Promise<{ companyId: string; id: string }> }) {
	const { companyId, id } = use(params);
	const router = useRouter();
	const [campaign, setCampaign] = useState<any>(null);
    const [subject, setSubject] = useState<string>("");
    const [preview, setPreview] = useState<string>("");
	const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [emailStyles, setEmailStyles] = useState<EmailStyles>(defaultEmailStyles);
    const [senderIdentity, setSenderIdentity] = useState<{ setupComplete: boolean; displayName: string | null; mailUsername: string | null }>({
        setupComplete: false,
        displayName: null,
        mailUsername: null,
    });
    const [loadingIdentity, setLoadingIdentity] = useState(true);
    const formatTrigger = (code: string | null | undefined) => {
        if (!code) return null;
        try {
            return getEventLabel(code as AutomationTriggerEvent);
        } catch {
            return code;
        }
    };

	useEffect(() => {
		(async () => {
			const res = await fetch(`/api/campaigns/${id}`);
			if (res.ok) {
				const data = await res.json();
				setCampaign(data.campaign);
				setSubject(data.campaign.subject);
                setPreview(data.campaign.preview_text ?? "");
                const htmlContent = data.campaign.html_content || "";
                const styles = extractEmailStyles(htmlContent);
                if (styles) setEmailStyles(styles);
			}
		})();
	}, [id]);

    useEffect(() => {
        (async () => {
            const res = await fetch(`/api/campaigns/${id}/analytics?limit=50`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events);
            }
        })();
    }, [id]);

    useEffect(() => {
        (async () => {
            const res = await fetch(`/api/sender-identity?companyId=${companyId}`);
            if (res.ok) {
                const data = await res.json();
                setSenderIdentity({
                    setupComplete: Boolean(data.setupComplete && data.display_name && data.mail_username),
                    displayName: data.display_name ?? null,
                    mailUsername: data.mail_username ?? null,
                });
            }
            setLoadingIdentity(false);
        })();
    }, [companyId]);

	async function save() {
		setSaving(true);
        const html = campaign?.html_content ?? "";
        await fetch(`/api/campaigns/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, preview_text: preview, html_content: html, status: campaign?.status }),
		});
		setSaving(false);
	}

	async function send() {
		setSending(true);
		const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
		setSending(false);
		if (res.ok) {
			router.push(`/dashboard/${companyId}/campaigns`);
		} else {
			router.refresh();
		}
	}

	if (!campaign) return <div className="p-6">Loading...</div>;

    const isAutomation = campaign.send_mode === "automation";
    const triggerLabel = formatTrigger(campaign.trigger_event);
    const delayValue = campaign.trigger_delay_value ?? 0;
    const delayUnit = campaign.trigger_delay_unit ?? "minutes";
    const quietHoursEnabled = Boolean(campaign.quiet_hours_enabled);
    const quietHoursStart = typeof campaign.quiet_hours_start === "number" ? campaign.quiet_hours_start : 9;
    const quietHoursEnd = typeof campaign.quiet_hours_end === "number" ? campaign.quiet_hours_end : 20;
    return (
        <div className="max-w-6xl mx-auto py-10 px-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Campaign Preview</h1>
                <div className="flex items-center gap-2">
					{process.env.NODE_ENV === 'development' && campaign.status === 'draft' && (
						<SimulateSendButton 
							campaignId={id}
							onSuccess={() => {
								router.push(`/dashboard/${companyId}/campaigns`);
							}}
						/>
					)}
                    <Button variant="outline" disabled={saving} onClick={save}>
                        {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button disabled={sending || isAutomation || !senderIdentity.setupComplete} onClick={send}>
                        {!senderIdentity.setupComplete
                            ? "Complete setup to send"
                            : isAutomation
                                ? "Automation-managed"
                                : sending
                                    ? "Sending..."
                                    : "Send"}
                    </Button>
                </div>
            </div>

            {!loadingIdentity && !senderIdentity.setupComplete && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-yellow-100 flex items-center justify-between gap-4">
                    <div>
                        <p className="font-medium">Finish your sender setup</p>
                        <p className="text-sm opacity-80">Set your from name and username before sending this campaign.</p>
                    </div>
                    <Button variant="outline" onClick={() => router.push(`/dashboard/${companyId}/settings`)}>
                        Go to Settings
                    </Button>
                </div>
            )}

            {/* Subject and preview text (editable), preview directly below */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="space-y-4">
					<div className="space-y-3">
						<label className="block text-sm font-medium">Subject</label>
						<Input value={subject} onChange={(e) => setSubject(e.target.value)} />
						<label className="block text-sm font-medium">Preview text</label>
						<Input value={preview} onChange={(e) => setPreview(e.target.value)} />
					</div>
					<div className="bg-white rounded-lg p-4 text-black overflow-auto">
						<div className="text-sm text-gray-500 mb-2">Preview</div>
						{(() => {
							const content = campaign?.html_content ?? "";
							const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
							const unsubscribeUrl = `${base}/api/unsubscribe?c=0&m=0&sig=demo`;
							const footer = renderEmailFooterHtml("MemberMail", unsubscribeUrl, null);
							const html = renderEmailWithStyles(`${content}${footer}`, emailStyles);
							return <div dangerouslySetInnerHTML={{ __html: html }} />;
						})()}
					</div>
				</div>
				<div className="space-y-4">
					<div className="text-sm text-white/70">
						Status: {campaign.status} • Recipients: {campaign.recipient_count} • Opens: {campaign.open_count} • Clicks: {campaign.click_count}
					</div>
					<div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
						<div className="text-sm font-semibold text-white">Delivery settings</div>
						<div className="text-xs text-white/60">
							<span className="font-medium text-white/70">Mode:</span> {isAutomation ? "Automation" : "Manual"}
						</div>
						{isAutomation && (
							<div className="space-y-1 text-xs text-white/60">
								<div>
									<span className="font-medium text-white/70">Trigger:</span> {triggerLabel ?? campaign.trigger_event}
								</div>
								<div>
									<span className="font-medium text-white/70">Initial delay:</span> {delayValue} {delayUnit}
								</div>
								<div>
									<span className="font-medium text-white/70">Automation status:</span> {campaign.automation_status}
								</div>
							</div>
						)}
						<div className="text-xs text-white/60">
							<span className="font-medium text-white/70">Quiet hours:</span> {quietHoursEnabled ? `${quietHoursStart}:00 - ${quietHoursEnd}:00` : "Disabled"}
						</div>
					</div>
					<div className="rounded-xl border border-white/10 overflow-hidden">
						<div className="bg-white/5 px-4 py-2 text-white/70 text-sm">Recent events</div>
						<div className="divide-y divide-white/5 bg-white/2">
							{events.map((e) => (
								<div key={e.id} className="flex items-center justify-between px-4 py-2">
									<span className="text-white/80">{e.type}</span>
									<span className="text-white/40 text-sm">{new Date(e.created_at).toLocaleString()}</span>
								</div>
							))}
							{events.length === 0 && (
								<div className="px-4 py-3 text-white/60">No events yet.</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}







