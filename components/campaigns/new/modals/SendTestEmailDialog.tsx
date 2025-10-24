"use client";

import { useState } from "react";
import { Mail, X } from "lucide-react";
import { toast } from "sonner";
import { useCampaignComposer } from "@/components/campaigns/new/CampaignComposerProvider";
import { embedStylesInHTML } from "@/lib/email/render-with-styles";

/**
 * Dialog for sending a test email with the current campaign content
 * Allows user to input a test email address and send a preview
 */
export default function SendTestEmailDialog({
    show,
    onClose,
    subject,
}: {
    show: boolean;
    onClose: () => void;
    subject: string;
}) {
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    const { editor, emailStyles, companyId, senderIdentity, loadingSenderIdentity } = useCampaignComposer();

    // Handle send test email
    const handleSend = async () => {
        // Validate email
        if (!email.trim()) {
            toast.error("Please enter an email address");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        if (!subject.trim()) {
            toast.error("Please add a subject line first");
            return;
        }

        if (!senderIdentity.setupComplete) {
            toast.error("Complete sender setup before sending test emails");
            return;
        }

        const editorHtml = editor?.getHTML() ?? "";

        if (!editorHtml.trim()) {
            toast.error("Email content is empty");
            return;
        }

        const htmlWithStyles = embedStylesInHTML(editorHtml, emailStyles);

        setSending(true);

        // Debug: log the HTML content being sent
        console.log("HTML Content being sent (first 500 chars):", htmlWithStyles.substring(0, 500));
        console.log("HTML Content length:", htmlWithStyles.length);

        try {
            const response = await fetch("/api/test-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: email.trim(),
                    subject: subject.trim(),
                    html: htmlWithStyles,
                    companyId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Test email sent to ${email}!`);
                setEmail("");
                onClose();
            } else {
                toast.error(data.error || "Failed to send test email");
            }
        } catch (error) {
            console.error("Error sending test email:", error);
            toast.error("An error occurred while sending test email");
        } finally {
            setSending(false);
        }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !sending) {
            e.preventDefault();
            handleSend();
        }
        if (e.key === "Escape") {
            onClose();
        }
    };

    if (!show) return null;

    const setupBlocked = !senderIdentity.setupComplete;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#FA4616]/10 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-[#FA4616]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Send Test Email</h2>
                            <p className="text-sm text-white/50">Preview your campaign in your inbox</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="test-email" className="block text-sm font-medium text-white/70 mb-2">
                            Test Email Address
                        </label>
                        <input
                            id="test-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="you@example.com"
                            autoFocus
                            disabled={setupBlocked}
                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#FA4616] focus:border-transparent transition-all disabled:opacity-50"
                        />
                    </div>

                    {setupBlocked && !loadingSenderIdentity && (
                        <div className="text-xs text-[#ff6b6b]">
                            Finish sender setup before sending test emails.
                        </div>
                    )}

                    {subject && (
                        <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                            <div className="text-xs font-medium text-white/50 mb-1">Subject Preview</div>
                            <div className="text-sm text-white/80">[TEST] {subject}</div>
                        </div>
                    )}

                    <div className="text-xs text-white/40 flex items-start gap-2">
                        <div className="mt-0.5">ℹ️</div>
                        <div>
                            The email will be sent with a <span className="text-white/60 font-medium">[TEST]</span> prefix in the subject line. This is a preview and will not be sent to your actual audience.
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        disabled={sending}
                        className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || !email.trim() || setupBlocked}
                        className="px-4 py-2 text-sm font-medium bg-[#FA4616] hover:bg-[#FA4616]/90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {sending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="w-4 h-4" />
                                Send Test Email
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
