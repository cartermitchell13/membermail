"use client";

import { useEffect } from "react";
import EditorToolbar from "@/components/campaigns/new/steps/EditorToolbar";
import EditorCanvas from "@/components/campaigns/new/steps/EditorCanvas";
import YoutubeDialog from "@/components/campaigns/new/steps/YoutubeDialog";
import ImageDialog from "@/components/campaigns/new/steps/ImageDialog";
import SelectionFloatingMenu from "@/components/campaigns/new/steps/SelectionFloatingMenu";
import SendTestEmailDialog from "@/components/campaigns/new/modals/SendTestEmailDialog";
import { useCampaignComposer } from "@/components/campaigns/new/CampaignComposerProvider";

export default function ComposeStep() {
    const { currentStep, editor, setShowAiSidebar, setAiSelectedText, showAiSidebar, showTestEmailDialog, setShowTestEmailDialog, subject } = useCampaignComposer();
    
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
            <EditorToolbar />
            <EditorCanvas />
            <YoutubeDialog />
            <ImageDialog />
            <SelectionFloatingMenu />
            <SendTestEmailDialog 
                show={showTestEmailDialog} 
                onClose={() => setShowTestEmailDialog(false)} 
                subject={subject}
                htmlContent={editor?.getHTML() ?? ""}
            />
        </div>
    );
}


