"use client";

import { useCampaignComposer } from "../CampaignComposerProvider";
import { toast } from "sonner";

export default function TemplatePicker() {
    const { showTemplatePicker, setShowTemplatePicker, templates, loadingTemplates, categoryFilter, setCategoryFilter, setPreviewTemplateHtml, applyPrefillHtml } = useCampaignComposer();
    if (!showTemplatePicker) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex" onClick={() => setShowTemplatePicker(false)}>
            <div className="m-auto w-full max-w-5xl max-h-[85vh] bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">Choose a Template</h3>
                        <div className="flex gap-2 ml-4">
                            <button className={`px-2 py-1 text-2 rounded ${categoryFilter === "" ? "bg-white/10" : "hover:bg-white/5"}`} onClick={() => setCategoryFilter("")}>All</button>
                            {Array.from(new Set(templates.map((t) => t.category || "General"))).map((cat) => (
                                <button key={String(cat)} className={`px-2 py-1 text-2 rounded ${categoryFilter === String(cat) ? "bg-white/10" : "hover:bg-white/5"}`} onClick={() => setCategoryFilter(String(cat))}>{String(cat)}</button>
                            ))}
                        </div>
                    </div>
                    <button className="text-white/60 hover:text-white" onClick={() => setShowTemplatePicker(false)}>Close</button>
                </div>
                <div className="p-5 overflow-auto">
                    {loadingTemplates ? (
                        <div className="text-white/60">Loading templates...</div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates
                                .filter((t) => !categoryFilter || (t.category || "General") === categoryFilter)
                                .map((t) => (
                                    <div key={t.id} className="border border-white/10 rounded-lg overflow-hidden bg-white/5">
                                        {t.thumbnail ? (
                                            <div className="h-28 overflow-hidden border-b border-white/10">
                                                <img src={t.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                            </div>
                                        ) : null}
                                        <div className="p-3 space-y-2">
                                            <div className="text-sm text-white/70">{t.category || "General"}</div>
                                            <div className="font-medium truncate">{t.name}</div>
                                            <div className="flex gap-2">
                                                <button className="px-3 py-1 rounded bg-[#FA4616] text-white hover:bg-[#E23F14] text-sm" onClick={() => {
                                                    applyPrefillHtml(String(t.html_content || ""));
                                                    toast.success("Template applied");
                                                    setShowTemplatePicker(false);
                                                }}>Use</button>
                                                <button className="px-3 py-1 rounded border border-white/20 text-white hover:bg-white/10 text-sm" onClick={() => setPreviewTemplateHtml(String(t.html_content || ""))}>Preview</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


