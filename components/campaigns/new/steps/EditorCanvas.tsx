"use client";

import { EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import DragHandle from "@tiptap/extension-drag-handle-react";
import { offset } from "@floating-ui/dom";
import { useCampaignComposer } from "../CampaignComposerProvider";
import { toast } from "sonner";
import ColumnsMenu from "./ColumnsMenu";
import AISidebar from "../modals/AISidebar";
import { EmailStylePanel } from "@/components/email-builder/ui/EmailStylePanel";
import { useEffect } from "react";
// Import resizable panels primitives to create a horizontal resizable split
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

export default function EditorCanvas() {
    const {
        editor,
        setShowImageInput,
        setShowHandleMenu,
        showHandleMenu,
        handleAnchorPos,
        setHandleAnchorPos,
        deleteNearestBlock,
        showAiSidebar,
        setShowAiSidebar,
        aiMessages,
        aiStreaming,
        aiSelectedText,
        setAiSelectedText,
        aiMode,
        setAiMode,
        sendAiMessage,
        showStylePanel,
        setShowStylePanel,
        emailStyles,
        setEmailStyles,
    } = useCampaignComposer();

    // Listen for clear context event
    useEffect(() => {
        const handleClearContext = () => {
            setAiSelectedText(null);
        };

        window.addEventListener('clearAiContext', handleClearContext);
        return () => window.removeEventListener('clearAiContext', handleClearContext);
    }, [setAiSelectedText]);

    if (!editor) return null;

    return (
        // Use a horizontal PanelGroup to allow the main editor and the AI sidebar/style panel
        // to be resized by the user. Ensure it fills the available height so inner
        // overflow containers can scroll correctly.
        <PanelGroup direction="horizontal" className="h-full flex-1 min-h-0 flex overflow-hidden bg-[#111111]">
            {/*
              Left panel: main editor area. We give it a defaultSize that depends on
              whether a sidebar is open. When both are closed, this panel takes 100% width.
              When one is open, it starts at 70%.
            */}
            <Panel defaultSize={(showAiSidebar || showStylePanel) ? 70 : 100} minSize={20} order={1}>
                {/*
                  This wrapper must have a concrete height to enable vertical scrolling.
                  Using h-full (instead of flex-1) inside the Panel ensures the browser
                  can compute overflow and allow scrolling for tall editor content.
                */}
                <div className="h-full min-h-0 overflow-y-auto scrollbar-hide transition-all duration-300">
                    <div className="relative mx-auto w-full max-w-3xl px-6 py-8">
                    <EditorContent editor={editor} />

                {/* Image bubble */}
                <BubbleMenu editor={editor} className="mm-bubble" shouldShow={() => editor.isActive('image')}>
                    <div className="flex items-center gap-2">
                        <button 
                            type="button" 
                            className="mm-bubble-btn" 
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={() => {
                                // Trigger file input directly
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = "image/*";
                                input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (!file) return;

                                    const formData = new FormData();
                                    formData.append("file", file);

                                    const loadingToast = toast.loading("Uploading image...");

                                    try {
                                        const response = await fetch("/api/upload-image", {
                                            method: "POST",
                                            body: formData,
                                        });

                                        if (!response.ok) throw new Error("Upload failed");

                                        const data = await response.json();
                                        
                                        // Update the current image node
                                        editor.chain().focus().updateAttributes('image', {
                                            src: data.url,
                                        }).run();
                                        
                                        toast.success("Image replaced!", { id: loadingToast });
                                    } catch (error) {
                                        toast.error("Failed to upload image", { id: loadingToast });
                                        console.error(error);
                                    }
                                };
                                input.click();
                            }} 
                            title="Replace image"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 5v2a5 5 0 1 1-4.546 2.914l1.789.894A3 3 0 1 0 12 9V7l4 3-4 3V11a5 5 0 1 1-4.472 2.763l-1.789-.894A7 7 0 1 0 12 5z"/></svg>
                        </button>
                    </div>
                </BubbleMenu>

                {/* Columns menu - positioned at top-center of columns element */}
                <ColumnsMenu editor={editor} />

                {/* Drag handle and quick delete */}
                <DragHandle
                    editor={editor}
                    computePositionConfig={{ placement: "left", strategy: "fixed", middleware: [offset(12)] }}
                    className="custom-drag-handle relative"
                    onNodeChange={({ node, pos }) => {
                        // Store the position of the node that the drag handle is attached to
                        // Only update if the menu is not open and position is valid
                        if (!showHandleMenu && pos >= 0) {
                            setHandleAnchorPos(pos);
                        }
                    }}
                >
                    <button
                        type="button"
                        className="absolute inset-0 z-10"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowHandleMenu((v) => !v);
                        }}
                        title="Block actions"
                    />
                    {showHandleMenu && (
                        <div className="absolute right-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-[#1f1f1f] text-white border border-white/10 rounded-md shadow-lg z-20">
                            <button
                                type="button"
                                className="px-2 py-1 text-xs hover:bg-white/10 rounded-md whitespace-nowrap"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    deleteNearestBlock();
                                }}
                                title="Delete block"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </DragHandle>
                    </div>
                </div>
            </Panel>

            {/*
              Only render the resize handle and right panel when a sidebar is open.
              This keeps the layout identical to before when sidebars are closed.
            */}
            {(showAiSidebar || showStylePanel) && (
                <>
                    {/* Thin draggable bar between panels */}
                    <PanelResizeHandle className="w-1 bg-white/10 hover:bg-white/20 transition-colors cursor-col-resize" />
                    {/* Right panel: AI Sidebar or Style Panel */}
                    <Panel defaultSize={30} minSize={20} order={2}>
                        {showAiSidebar && (
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
                        )}
                        {showStylePanel && (
                            <div className="h-full overflow-y-auto bg-[#111111] p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-white">Email Styles</h2>
                                    <button
                                        onClick={() => setShowStylePanel(false)}
                                        className="text-white/60 hover:text-white transition-colors"
                                        title="Close"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <EmailStylePanel
                                    editor={editor}
                                    emailStyles={emailStyles}
                                    onStyleChange={setEmailStyles}
                                />
                            </div>
                        )}
                    </Panel>
                </>
            )}
        </PanelGroup>
    );
}


