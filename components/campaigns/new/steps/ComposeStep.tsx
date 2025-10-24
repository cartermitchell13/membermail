"use client";

import { useEffect } from "react";
import EditorToolbar from "@/components/campaigns/new/steps/EditorToolbar";
import EditorCanvas from "@/components/campaigns/new/steps/EditorCanvas";
import YoutubeDialog from "@/components/campaigns/new/steps/YoutubeDialog";
import ImageDialog from "@/components/campaigns/new/steps/ImageDialog";
import SelectionFloatingMenu from "@/components/campaigns/new/steps/SelectionFloatingMenu";
import SendTestEmailDialog from "@/components/campaigns/new/modals/SendTestEmailDialog";
import { useCampaignComposer, type AutomationBlueprintPrefill } from "@/components/campaigns/new/CampaignComposerProvider";
import { Button } from "@/components/ui/button";

export default function ComposeStep() {
    const {
        currentStep,
        editor,
        setShowAiSidebar,
        setAiSelectedText,
        showAiSidebar,
        showTestEmailDialog,
        setShowTestEmailDialog,
        subject,
        automationBlueprint,
        showAutomationBanner,
        dismissAutomationBanner,
        senderIdentity,
        loadingSenderIdentity,
        companyId,
    } = useCampaignComposer();
    
    // Keyboard shortcuts for AI sidebar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl+K to open AI sidebar
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                if (!editor) return;
                
                // Capture selection if any
                const { from, to } = editor.state.selection;
                const selectedText = editor.state.doc.textBetween(from, to, " ");
                if (selectedText) {
                    setAiSelectedText(selectedText);
                }
                setShowAiSidebar(true);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [editor, setShowAiSidebar, setAiSelectedText]);
    
    if (currentStep !== 0) return null;
    
    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-x-hidden">
            {automationBlueprint && showAutomationBanner && (
                <AutomationBlueprintBanner
                    blueprint={automationBlueprint}
                    onDismiss={dismissAutomationBanner}
                />
            )}
            {!loadingSenderIdentity && !senderIdentity.setupComplete && (
                <div className="border border-yellow-500/30 bg-yellow-500/10 text-yellow-100 rounded-md px-4 py-3 mb-3 flex items-center justify-between gap-4">
                    <div>
                        <p className="font-medium">Finish your sender setup</p>
                        <p className="text-xs opacity-80">Set your sender name, username, and reply-to address before sending tests or campaigns.</p>
                    </div>
                    <Button
                        variant="outline"
                        className="border-yellow-500/40 text-yellow-100 hover:bg-yellow-500/20"
                        onClick={() => window.location.assign(`/dashboard/${companyId}/settings`)}
                    >
                        Go to Settings
                    </Button>
                </div>
            )}
            <EditorToolbar />
            <EditorCanvas />
            <YoutubeDialog />
            <ImageDialog />
            <SelectionFloatingMenu />
            <SendTestEmailDialog 
                show={showTestEmailDialog} 
                onClose={() => setShowTestEmailDialog(false)} 
                subject={subject}
            />
        </div>
    );
}

function AutomationBlueprintBanner({
    blueprint,
    onDismiss,
}: {
    blueprint: AutomationBlueprintPrefill;
    onDismiss: () => void;
}) {
    return (
        <div className="border border-primary/30 bg-primary/5 text-white/80 rounded-md p-4 mb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="text-[11px] uppercase tracking-wide text-primary/70">Automation blueprint</div>
                    <div className="text-sm font-semibold text-white">{blueprint.title}</div>
                    <p className="mt-1 text-xs text-white/60">
                        This email uses the lifecycle recipe you selected. Replace the bracketed placeholders with your details or use the AI prompt we preloaded before moving on to Audience and Safeguards.
                    </p>
                    <div className="mt-2 grid gap-2 text-xs text-white/60 sm:grid-cols-2">
                        {blueprint.prefillSubject && (
                            <div>
                                <div className="uppercase tracking-wide text-[10px] text-white/40">Subject starter</div>
                                <code className="mt-1 inline-block rounded bg-white/10 px-2 py-1 text-[11px] text-white/80">
                                    {blueprint.prefillSubject}
                                </code>
                            </div>
                        )}
                        {blueprint.prefillPreview && (
                            <div>
                                <div className="uppercase tracking-wide text-[10px] text-white/40">Preview line</div>
                                <code className="mt-1 inline-block rounded bg-white/10 px-2 py-1 text-[11px] text-white/80">
                                    {blueprint.prefillPreview}
                                </code>
                            </div>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="self-start rounded border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
                >
                    Dismiss
                </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                    <div className="text-[11px] uppercase tracking-wide text-white/40">Goals</div>
                    <ul className="mt-2 space-y-1 text-xs text-white/70">
                        {blueprint.goals.map((goal) => (
                            <li key={goal} className="flex gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60" />
                                <span>{goal}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <div className="text-[11px] uppercase tracking-wide text-white/40">Cadence</div>
                    <ul className="mt-2 space-y-1 text-xs text-white/70">
                        {blueprint.schedule.map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/40" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}


