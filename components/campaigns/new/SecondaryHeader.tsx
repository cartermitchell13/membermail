"use client";

import { Button } from "@/components/ui/button";
import { useCampaignComposer } from "./CampaignComposerProvider";

export default function SecondaryHeader() {
    const { setShowPreview } = useCampaignComposer();
    return (
        <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm shrink-0">
            <div className="px-8 py-2.5 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-white">New Campaign</h1>
                    <p className="text-xs text-white/50">Create and send an email campaign</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" size="xs" onClick={() => setShowPreview(true)}>
                        Preview
                    </Button>
                </div>
            </div>
        </div>
    );
}


