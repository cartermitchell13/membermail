"use client";

import { Input } from "@/components/ui/input";
import { useCampaignComposer } from "../CampaignComposerProvider";

export default function SubjectPreheaderForm() {
    const { subject, setSubject, previewText, setPreviewText } = useCampaignComposer();
    return (
        <div className="border-b border-white/10 bg-black/20 px-6 py-3 space-y-3 shrink-0">
            <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/60">Subject Line</label>
                <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Enter email subject..."
                />
            </div>
            <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/60">
                    Preview Text <span className="text-white/40">(Optional)</span>
                </label>
                <Input
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Shown in inbox preview..."
                />
            </div>
        </div>
    );
}


