"use client";

import { EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import DragHandle from "@tiptap/extension-drag-handle-react";
import { offset } from "@floating-ui/dom";
import { useCampaignComposer } from "../CampaignComposerProvider";
import { toast } from "sonner";
import ColumnsMenu from "./ColumnsMenu";
import AISidebar from "../modals/AISidebar";
import { useEffect } from "react";

export default function EditorCanvas() {
    const {
        editor,
        showCtaLinkEditor,
        setShowCtaLinkEditor,
        ctaLinkValue,
        setCtaLinkValue,
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
        <div className="flex-1 min-h-0 flex overflow-hidden bg-[#111111]">
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide transition-all duration-300">
                <div className="relative mx-auto w-full max-w-3xl px-6 py-8">
                    <EditorContent editor={editor} />

                {/* CTA Bubble */}
                <BubbleMenu editor={editor} className="mm-bubble" shouldShow={() => editor.isActive('cta')}>
                    <div className="flex items-center gap-2">
                        {(() => {
                            const attrs = (editor.getAttributes('cta') as any) || {};
                            const currentAlign = String(attrs.align || 'left');
                            const currentVariant = String(attrs.variant || 'primary');
                            return (
                                <>
                                    {showCtaLinkEditor ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                className="bg-transparent text-white/80 text-xs w-56 outline-none border border-white/10 rounded px-2 py-1"
                                                placeholder="https://example.com"
                                                value={ctaLinkValue}
                                                onChange={(e) => setCtaLinkValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        editor.commands.setCTAUrl(ctaLinkValue.trim());
                                                        setShowCtaLinkEditor(false);
                                                    }
                                                    if (e.key === 'Escape') setShowCtaLinkEditor(false);
                                                }}
                                            />
                                            <button type="button" className="mm-bubble-btn is-active" title="Save" onMouseDown={(e) => e.preventDefault()} onClick={() => {
                                                editor.commands.setCTAUrl(ctaLinkValue.trim());
                                                setShowCtaLinkEditor(false);
                                            }}>
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z"/></svg>
                                            </button>
                                            <button type="button" className="mm-bubble-btn" title="Cancel" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowCtaLinkEditor(false)}>
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12"/></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="mm-bubble-btn"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                const current = (editor.getAttributes('cta') as any)?.href || '';
                                                setCtaLinkValue(current);
                                                setShowCtaLinkEditor(true);
                                            }}
                                            title="Set Link"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10.59 13.41a1.996 1.996 0 010-2.82l3.18-3.18a2 2 0 112.83 2.83l-1.06 1.06-.01.01-2.12 2.12a2 2 0 01-2.82-0.02z"/><path d="M13.41 10.59a1.996 1.996 0 010 2.82l-3.18 3.18a2 2 0 11-2.83-2.83l1.06-1.06.01-.01 2.12-2.12a2 2 0 012.82 0.02z"/></svg>
                                        </button>
                                    )}
                                    <div className="mm-bubble-sep" />
                                    <button type="button" className={`mm-bubble-btn ${currentAlign === 'left' ? 'is-active' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.commands.setCTAAlign('left')} title="Align Left">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 6h14v2H3V6zm0 4h10v2H3v-2zm0 4h14v2H3v-2zm0 4h10v2H3v-2z"/></svg>
                                    </button>
                                    <button type="button" className={`mm-bubble-btn ${currentAlign === 'center' ? 'is-active' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.commands.setCTAAlign('center')} title="Align Center">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 6h14v2H5V6zm3 4h8v2H8v-2zm-3 4h14v2H5v-2zm3 4h8v2H8v-2z"/></svg>
                                    </button>
                                    <button type="button" className={`mm-bubble-btn ${currentAlign === 'right' ? 'is-active' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.commands.setCTAAlign('right')} title="Align Right">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 6h14v2H7V6zm7 4h7v2h-7v-2zm-7 4h14v2H7v-2zm7 4h7v2h-7v-2z"/></svg>
                                    </button>
                                    <div className="mm-bubble-sep" />
                                    <button type="button" className={`mm-bubble-btn ${currentVariant === 'primary' ? 'is-active' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.commands.setCTAVariant('primary')} title="Primary">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="4" y="6" width="16" height="12" rx="2"/></svg>
                                    </button>
                                    <button type="button" className={`mm-bubble-btn ${currentVariant === 'secondary' ? 'is-active' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.commands.setCTAVariant('secondary')} title="Secondary">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="4" y="6" width="16" height="12" rx="2"/></svg>
                                    </button>
                                    <button type="button" className={`mm-bubble-btn ${currentVariant === 'outline' ? 'is-active' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.commands.setCTAVariant('outline')} title="Outline">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="7" width="14" height="10" rx="2"/></svg>
                                    </button>
                                    <div className="mm-bubble-sep" />
                                    <button type="button" className="mm-bubble-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.commands.removeCTA()} title="Remove CTA">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 7h12l-1 12H7L6 7zm3-3h6l1 2H8l1-2z"/></svg>
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                </BubbleMenu>

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
            {/* AI Sidebar */}
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
        </div>
    );
}


