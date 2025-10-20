"use client";

import { useCampaignComposer } from "../CampaignComposerProvider";
import { sanitizeEmailHtml } from "@/lib/html/sanitize";

export default function TemplatePreviewModal() {
    const { previewTemplateHtml, setPreviewTemplateHtml } = useCampaignComposer();
    if (previewTemplateHtml === null) return null;
    return (
        <div className="fixed inset-0 z-[60] bg-black/90 flex" onClick={() => setPreviewTemplateHtml(null)}>
            <div className="m-auto w-full max-w-3xl max-h-[85vh] bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="font-semibold">Template Preview</div>
                    <button className="text-white/60 hover:text-white" onClick={() => setPreviewTemplateHtml(null)}>Close</button>
                </div>
                <div className="bg-[#0b0b0b]" style={{ overflow: "hidden" }}>
                    <iframe
                        title="Template preview"
                        className="w-full border-none block"
                        scrolling="no"
                        style={{ height: 800, overflow: "hidden" }}
                        srcDoc={`<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><meta name=\"color-scheme\" content=\"light dark\"></head><body style=\"margin:0; padding:0; background:#0b0b0b; width:100%; overflow-x:hidden;\">${sanitizeEmailHtml(previewTemplateHtml || "")} </body></html>`}
                    />
                </div>
            </div>
        </div>
    );
}


