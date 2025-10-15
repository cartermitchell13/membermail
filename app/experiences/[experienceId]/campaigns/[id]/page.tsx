"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

export default function CampaignDetailPage({ params }: { params: Promise<{ experienceId: string; id: string }> }) {
	const { experienceId, id } = use(params);
	const router = useRouter();
	const [campaign, setCampaign] = useState<any>(null);
    const [subject, setSubject] = useState<string>("");
    const [preview, setPreview] = useState<string>("");
	const [saving, setSaving] = useState(false);
	const [sending, setSending] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Link.configure({ openOnClick: false, autolink: true }),
            Image,
            Placeholder.configure({ placeholder: "Write your newsletter..." }),
        ],
        content: "",
        editable: true,
    });

	useEffect(() => {
		(async () => {
			const res = await fetch(`/api/campaigns/${id}`);
			if (res.ok) {
				const data = await res.json();
				setCampaign(data.campaign);
				setSubject(data.campaign.subject);
                setPreview(data.campaign.preview_text ?? "");
                editor?.commands.setContent(data.campaign.html_content || "");
			}
		})();
    }, [id, editor]);

    useEffect(() => {
        (async () => {
            const res = await fetch(`/api/campaigns/${id}/analytics?limit=50`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events);
            }
        })();
    }, [id]);

	async function save() {
		setSaving(true);
        const html = editor?.getHTML() ?? "";
        await fetch(`/api/campaigns/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, preview_text: preview, html_content: html, status: campaign?.status }),
		});
		setSaving(false);
	}

	async function send() {
		setSending(true);
		await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
		setSending(false);
		router.refresh();
	}

	if (!campaign) return <div className="p-6">Loading...</div>;

	return (
        <div className="max-w-6xl mx-auto py-10 px-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Edit Campaign</h1>
                <div className="space-x-2">
                    <Button variant="outline" disabled={saving} onClick={save}>
                        {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button disabled={sending} onClick={send}>
                        {sending ? "Sending..." : "Send"}
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="block text-sm font-medium">Subject</label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                    <label className="block text-sm font-medium">Preview text</label>
                    <Input value={preview} onChange={(e) => setPreview(e.target.value)} />
                    <label className="block text-sm font-medium">Content</label>
                    <div className="rounded-md border border-white/10 bg-white/[0.02] p-2 min-h-[320px]">
                        <EditorContent editor={editor} />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 text-black overflow-auto">
                        <div className="text-sm text-gray-500 mb-2">Preview</div>
                        <div dangerouslySetInnerHTML={{ __html: editor?.getHTML() ?? "" }} />
                    </div>
                    <div className="text-sm text-white/70">
                        Status: {campaign.status} • Recipients: {campaign.recipient_count} • Opens: {campaign.open_count} • Clicks: {campaign.click_count}
                    </div>
                    <div className="rounded-xl border border-white/10 overflow-hidden">
                        <div className="bg-white/5 px-4 py-2 text-white/70 text-2">Recent events</div>
                        <div className="divide-y divide-white/5 bg-white/2">
                            {events.map((e) => (
                                <div key={e.id} className="flex items-center justify-between px-4 py-2">
                                    <span className="text-white/80">{e.type}</span>
                                    <span className="text-white/40 text-2">{new Date(e.created_at).toLocaleString()}</span>
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


