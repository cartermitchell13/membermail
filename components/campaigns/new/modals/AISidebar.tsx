"use client";

import { useState, useRef, useEffect } from "react";
import { X, Sparkles, Send, Loader2, Plus, Wand2, Edit3, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Type definitions for chat messages
export type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    context?: {
        selectedText: string;
        mode: "generate" | "edit" | "insert";
    };
};

// Type for AI operation mode
export type AIMode = "generate" | "edit" | "insert";

// Context card showing selected text that AI will work with
function AIContextCard({ selectedText, mode }: { selectedText: string; mode: AIMode }) {
    const modeConfig = {
        generate: { icon: Plus, label: "Generate", color: "text-green-400" },
        edit: { icon: Edit3, label: "Edit", color: "text-blue-400" },
        insert: { icon: CornerDownRight, label: "Insert", color: "text-purple-400" },
    };

    const config = modeConfig[mode];
    const Icon = config.icon;

    return (
        <div className="flex items-start gap-1.5 p-2 rounded bg-white/5 border border-white/10">
            <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${config.color}`} />
            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-white/50 mb-0.5">{config.label}</div>
                <div className="text-xs text-white/70 line-clamp-2 italic">"{selectedText}"</div>
            </div>
        </div>
    );
}

// Individual chat message bubble
function ChatMessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
            <div className={`max-w-[90%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
                {/* Show context card if present */}
                {message.context && (
                    <AIContextCard selectedText={message.context.selectedText} mode={message.context.mode} />
                )}
                
                {/* Message bubble */}
                <div
                    className={`rounded-lg px-3 py-2 ${
                        isUser
                            ? "bg-[#FA4616] text-white"
                            : "bg-white/5 border border-white/10 text-white/90"
                    }`}
                >
                    {!isUser && (
                        <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-white/10">
                            <Sparkles className="w-3 h-3 text-[#FA4616]" />
                            <span className="text-[10px] font-medium text-white/50">AI</span>
                        </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
            </div>
        </div>
    );
}

// Streaming indicator while AI is generating
function StreamingIndicator() {
    return (
        <div className="flex items-start gap-2 mb-3">
            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-white/10">
                    <Sparkles className="w-3 h-3 text-[#FA4616] animate-pulse" />
                    <span className="text-[10px] font-medium text-white/50">AI</span>
                </div>
                <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FA4616]" />
                    <span className="text-sm text-white/70">Thinking...</span>
                </div>
            </div>
        </div>
    );
}

// Quick action buttons for common prompts
function QuickActions({ onSelect }: { onSelect: (prompt: string) => void }) {
    const actions = [
        { label: "Shorter", prompt: "Make this content more concise" },
        { label: "Casual", prompt: "Rewrite this in a more casual, friendly tone" },
        { label: "Professional", prompt: "Rewrite this in a more professional tone" },
        { label: "Add CTA", prompt: "Add a compelling call-to-action" },
    ];

    return (
        <div className="border-t border-white/10 px-3 py-2">
            <div className="flex flex-wrap gap-1.5">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        onClick={() => onSelect(action.prompt)}
                        className="text-[11px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/10"
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Main AI Sidebar Component
export default function AISidebar({
    isOpen,
    onClose,
    messages,
    onSendMessage,
    isStreaming,
    selectedText,
    mode,
    onModeChange,
    initialPrompt,
}: {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    onSendMessage: (prompt: string, context?: { selectedText: string; mode: AIMode }) => Promise<void>;
    isStreaming: boolean;
    selectedText: string | null;
    mode: AIMode;
    onModeChange: (mode: AIMode) => void;
    initialPrompt?: string;
}) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasPrefilledRef = useRef(false);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isStreaming]);

    // Focus textarea when sidebar opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            hasPrefilledRef.current = false;
            return;
        }
        if (!initialPrompt) return;
        if (messages.length > 0) return;
        if (hasPrefilledRef.current) return;

        setInput(initialPrompt);
        hasPrefilledRef.current = true;
        requestAnimationFrame(() => {
            const textarea = textareaRef.current;
            if (textarea) {
                textarea.style.height = "auto";
                textarea.style.height = `${textarea.scrollHeight}px`;
                textarea.focus();
            }
        });
    }, [isOpen, initialPrompt, messages.length]);

    // Auto-set mode to "edit" when text is selected
    useEffect(() => {
        if (selectedText && mode === "generate") {
            onModeChange("edit");
        }
    }, [selectedText, mode, onModeChange]);

    // ESC to close sidebar (only when focused in sidebar)
    useEffect(() => {
        if (!isOpen) return;
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                // Only close if the focus is within the sidebar
                const target = e.target as HTMLElement;
                if (target.closest('[data-ai-sidebar]')) {
                    onClose();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Handle send message
    const handleSend = () => {
        if (!input.trim() || isStreaming) return;

        const context = selectedText
            ? { selectedText, mode }
            : undefined;

        void onSendMessage(input.trim(), context);
        setInput("");
        
        // Clear attached context immediately after sending
        if (selectedText) {
            const event = new CustomEvent('clearAiContext');
            window.dispatchEvent(event);
        }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        // The root container intentionally avoids a fixed width so that when this
        // component is placed inside a react-resizable-panels <Panel>, the panel
        // can control the width. We enforce a reasonable minimum width to prevent
        // the sidebar from collapsing too small to be usable.
        <div 
            data-ai-sidebar
            className="relative w-full min-w-[280px] h-full bg-[#1a1a1a] border-l border-white/10 z-40 flex flex-col shadow-2xl pb-0 min-h-0 shrink-0"
        >
                {/* Close button - minimal header */}
                <div className="absolute top-3 right-3 z-50">
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Mode selector - only show when text is selected */}
                {selectedText && (
                    <div className="p-2 pt-12 border-b border-white/10 bg-black/10">
                        <div className="flex gap-1.5">
                            {[
                                { value: "generate" as const, label: "Generate", icon: Plus },
                                { value: "edit" as const, label: "Edit", icon: Edit3 },
                                { value: "insert" as const, label: "Insert", icon: CornerDownRight },
                            ].map((m) => (
                                <button
                                    key={m.value}
                                    onClick={() => onModeChange(m.value)}
                                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[11px] font-medium transition-all ${
                                        mode === m.value
                                            ? "bg-[#FA4616] text-white"
                                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <m.icon className="w-3 h-3" />
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className={`flex-1 min-h-0 overflow-y-auto p-3 pb-4 scrollbar-hide ${!selectedText ? 'pt-12' : ''}`}>
                    {messages.length === 0 ? (
                        initialPrompt ? (
                            <div className="flex h-full flex-col gap-3 overflow-y-auto px-4 py-6 text-sm text-white/70">
                                <div>
                                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary/70">
                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                        Blueprint prompt ready
                                    </div>
                                    <p className="mt-2 text-xs text-white/60">
                                        We preloaded a campaign brief based on the automation you picked. Replace the bracketed sections with your details before you hit send.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                                    <div className="mb-2 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-white/40">
                                        <span>Prompt draft</span>
                                        <span className="text-white/50">Editable below</span>
                                    </div>
                                    <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-white/80">
{initialPrompt}
                                    </pre>
                                </div>
                                <div className="text-xs text-white/50">
                                    You can keep editing this prompt in the input field or switch to an edit/insert mode after selecting text in your email.
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center px-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FA4616]/20 to-purple-600/20 flex items-center justify-center mb-3">
                                    <Wand2 className="w-6 h-6 text-[#FA4616]" />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">
                                    Start creating with AI
                                </h3>
                                <p className="text-sm text-white/60 max-w-[280px]">
                                    Select text to edit it, or ask me to generate new content.
                                </p>
                            </div>
                        )
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <ChatMessageBubble key={msg.id} message={msg} />
                            ))}
                            {isStreaming && <StreamingIndicator />}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Quick Actions */}
                {messages.length > 0 && !isStreaming && <div className="shrink-0"><QuickActions onSelect={setInput} /></div>}

                {/* Input Area */}
                <div className="p-3 border-t border-white/10 bg-black/20 shrink-0">
                    {/* Context indicator - shows when text is attached */}
                    {selectedText && (
                        <div className="mb-2 p-2 rounded bg-[#FA4616]/10 border border-[#FA4616]/30">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-[#FA4616] flex-shrink-0" />
                                    <span className="text-[10px] font-medium text-[#FA4616]">Context</span>
                                </div>
                                <button
                                    onClick={() => {
                                        // Clear the attached context
                                        const event = new CustomEvent('clearAiContext');
                                        window.dispatchEvent(event);
                                    }}
                                    className="text-[10px] text-white/60 hover:text-white transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="text-xs text-white/70 line-clamp-1 italic">
                                "{selectedText}"
                            </div>
                        </div>
                    )}
                    
                    <div className="relative">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                // Auto-resize the textarea to fit all content
                                const textarea = e.target as HTMLTextAreaElement;
                                textarea.style.height = 'auto';
                                textarea.style.height = `${textarea.scrollHeight}px`;
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me to improve your newsletter..."
                            className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/40 resize-none pr-10 min-h-[40px] overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                            style={{ height: 'auto' }}
                            disabled={isStreaming}
                            rows={1}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isStreaming}
                            size="sm"
                            className="absolute bottom-1.5 right-1.5 h-7 w-7 p-0 bg-[#FA4616] hover:bg-[#FA4616]/90"
                        >
                            {isStreaming ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Send className="w-3.5 h-3.5" />
                            )}
                        </Button>
                    </div>
                    <div className="text-[10px] text-white/40 mt-1.5">
                        <kbd className="px-1 py-0.5 rounded bg-white/10">⌘</kbd> + <kbd className="px-1 py-0.5 rounded bg-white/10">Enter</kbd> to send
                    </div>
                </div>
        </div>
    );
}
