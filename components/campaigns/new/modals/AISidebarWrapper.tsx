"use client";

import { useEffect } from "react";
import AISidebar from "./AISidebar";
import { useCampaignComposer } from "../CampaignComposerProvider";

/**
 * Wrapper component that connects the AISidebar to the campaign composer context
 */
export default function AISidebarWrapper() {
    const {
        showAiSidebar,
        setShowAiSidebar,
        aiMessages,
        aiStreaming,
        aiSelectedText,
        setAiSelectedText,
        aiMode,
        setAiMode,
        sendAiMessage,
    } = useCampaignComposer();

    // Listen for clear context event
    useEffect(() => {
        const handleClearContext = () => {
            setAiSelectedText(null);
        };

        window.addEventListener('clearAiContext', handleClearContext);
        return () => window.removeEventListener('clearAiContext', handleClearContext);
    }, [setAiSelectedText]);

    return (
        <AISidebar
            isOpen={showAiSidebar}
            onClose={() => setShowAiSidebar(false)}
            messages={aiMessages}
            onSendMessage={sendAiMessage}
            isStreaming={aiStreaming}
            selectedText={aiSelectedText}
            mode={aiMode}
            onModeChange={setAiMode}
        />
    );
}
