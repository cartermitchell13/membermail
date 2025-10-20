"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCampaignComposer } from "../CampaignComposerProvider";

export default function SaveTemplateDialog() {
    const { showNameDialog, setShowNameDialog, templateName, setTemplateName, saveAsTemplate, savingTemplate } = useCampaignComposer();
    if (!showNameDialog) return null;
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-semibold text-white mb-4">Save as Template</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Template Name</label>
                        <Input
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="e.g., Weekly Newsletter"
                            className="bg-white/5 border-white/10 text-white"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") saveAsTemplate(); }}
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowNameDialog(false)}>Cancel</Button>
                        <Button onClick={saveAsTemplate} disabled={!templateName.trim() || savingTemplate}>
                            {savingTemplate ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


