"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useCampaignComposer } from "../CampaignComposerProvider";

/**
 * Floating menu that appears when text is selected in the editor
 * Provides quick action to add selection to AI chat context
 */
export default function SelectionFloatingMenu() {
    const { editor, setShowAiSidebar, setAiSelectedText, showAiSidebar } = useCampaignComposer();
    const [show, setShow] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [selectedText, setSelectedText] = useState("");

    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            const { state } = editor;
            const { from, to } = state.selection;
            const text = state.doc.textBetween(from, to, " ");

            // Show menu if text is selected and not empty
            if (text.trim() && from !== to) {
                setSelectedText(text);
                
                // Get the coordinates of the selection
                const { view } = editor;
                const start = view.coordsAtPos(from);
                const end = view.coordsAtPos(to);
                
                // Position menu above and centered on selection
                setPosition({
                    top: start.top - 50, // 50px above selection
                    left: (start.left + end.right) / 2 - 75, // Center of selection, offset by half button width
                });
                setShow(true);
            } else {
                setShow(false);
                setSelectedText("");
            }
        };

        editor.on("selectionUpdate", handleUpdate);
        editor.on("update", handleUpdate);

        return () => {
            editor.off("selectionUpdate", handleUpdate);
            editor.off("update", handleUpdate);
        };
    }, [editor]);

    const handleAddToAI = () => {
        setAiSelectedText(selectedText);
        setShowAiSidebar(true);
        setShow(false); // Hide menu after clicking
    };

    if (!show || !selectedText) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex: 50,
            }}
            className="animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <button
                onClick={handleAddToAI}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FA4616] hover:bg-[#FA4616]/90 text-white text-sm font-medium shadow-lg transition-all hover:scale-105"
            >
                <Sparkles className="w-4 h-4" />
                Add to AI
            </button>
        </div>
    );
}
