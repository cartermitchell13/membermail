"use client";

import { useCampaignComposer } from "../CampaignComposerProvider";
import { renderEmailFooterHtml } from "@/lib/email/footer";
import { renderEmailWithStyles } from "@/lib/email/render-with-styles";
import { EmailStylePanel } from "@/components/email-builder/ui/EmailStylePanel";
import { Palette } from "lucide-react";

export default function PreviewModal() {
    const { showPreview, setShowPreview, previewMode, setPreviewMode, subject, previewText, editor, emailStyles, setEmailStyles, showStylePanel, setShowStylePanel, senderIdentity, loadingSenderIdentity } = useCampaignComposer();
    if (!showPreview) return null;

    // Generate sender name and email from user data
    const senderName = senderIdentity.displayName || "Your Newsletter";
    const senderEmail = senderIdentity.mailUsername
        ? `${senderIdentity.mailUsername}@mail.membermail.app`
        : "username@mail.membermail.app";

    const emailHtml = (() => {
        const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
        const unsubscribeUrl = `${base}/api/unsubscribe?c=0&m=0&sig=demo`;
        const footer = renderEmailFooterHtml("MemberMail", unsubscribeUrl, null);
        const contentWithFooter = `${editor?.getHTML() ?? ""}${footer}`;
        // Apply custom email styles to the content
        return renderEmailWithStyles(contentWithFooter, emailStyles);
    })();

    return (
        <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-8"
            onClick={() => setShowPreview(false)}
        >
            <div
                className="bg-[#1a1a1a] rounded-xl w-full h-full overflow-hidden flex flex-col shadow-2xl border border-white/10 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#2a2a2a] border-b border-white/10 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-white/50 mr-2">Preview as:</span>
                            <button
                                onClick={() => setPreviewMode("desktop")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    previewMode === "desktop"
                                        ? "bg-[#FA4616] text-white"
                                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                Desktop
                            </button>
                            <button
                                onClick={() => setPreviewMode("mobile")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    previewMode === "mobile"
                                        ? "bg-[#FA4616] text-white"
                                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                Mobile
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-1" />
                            <button
                                onClick={() => setShowStylePanel(!showStylePanel)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    showStylePanel
                                        ? "bg-[#FA4616] text-white"
                                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                <Palette className="w-4 h-4" />
                                Styles
                            </button>
                        </div>
                        <button
                            onClick={() => setShowPreview(false)}
                            className="text-white/50 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main preview area */}
                <div className="flex-1 overflow-y-auto bg-[#111111] p-8">
                    <div
                        className={`mx-auto transition-all duration-300 ${
                            previewMode === "desktop" ? "max-w-3xl" : "max-w-[375px]"
                        } mt-8 mb-12`}
                    >
                        <div style={{ backgroundColor: "white", boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                            {previewMode === "desktop" && (
                                <div style={{ backgroundColor: "#e5e7eb", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ff5f57", border: "none", cursor: "pointer" }}
                                        title="Close"
                                    />
                                    <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
                                    <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#28ca42" }} />
                                </div>
                            )}

                            {/* Inbox-style header */}
                            <div style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "16px 20px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div style={{ display: "flex", gap: 16 }}>
                                        <span style={{ fontSize: 14, color: "#4b5563", fontWeight: 600, minWidth: 100 }}>From:</span>
                                        <span style={{ fontSize: 14, color: "#111827", flex: 1 }}>
                                            {loadingSenderIdentity ? "Loading..." : `${senderName} <${senderEmail}>`}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", gap: 16 }}>
                                        <span style={{ fontSize: 14, color: "#4b5563", fontWeight: 600, minWidth: 100 }}>Subject:</span>
                                        <span style={{ fontSize: 16, color: "#111827", fontWeight: 700, flex: 1 }}>
                                            {subject || "-"}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", gap: 16 }}>
                                        <span style={{ fontSize: 14, color: "#4b5563", fontWeight: 600, minWidth: 100 }}>Preview Text:</span>
                                        <span style={{ fontSize: 14, color: "#374151", flex: 1 }}>
                                            {previewText || "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Content - Render with custom styles applied */}
                            <div style={{ padding: 0, backgroundColor: emailStyles.outsideBackground }}>
                                <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Style panel popover - positioned absolute */}
                {showStylePanel && (
                    <>
                        {/* Backdrop to close popover */}
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowStylePanel(false)}
                        />
                        {/* Popover panel */}
                        <div 
                            className="absolute top-16 right-8 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <EmailStylePanel
                                editor={editor}
                                emailStyles={emailStyles}
                                onStyleChange={setEmailStyles}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}


