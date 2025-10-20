"use client";

import AIPromptDialog from "@/components/email-builder/ui/AIPromptDialog";
import { useCampaignComposer } from "../CampaignComposerProvider";

export default function AIPromptDialogWrapper() {
    const { showAiDialog, setShowAiDialog, editor } = useCampaignComposer();
    if (!showAiDialog) return null;
    return (
        <AIPromptDialog
            onClose={() => setShowAiDialog(false)}
            onSubmit={async (p) => {
                if (!editor) return;
                // @ts-ignore - custom command provided by AICompose extension
                await editor.commands.aiCompose({ prompt: p, mode: "replace" });
                setShowAiDialog(false);
            }}
        />
    );
}


