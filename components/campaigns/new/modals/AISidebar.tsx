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
        edit: { icon: Edit3, label: "Edit Selection", color: "text-blue-400" },
        insert: { icon: CornerDownRight, label: "Insert After", color: "text-purple-400" },
    };

    const config = modeConfig[mode];
    const Icon = config.icon;

    return (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color}`} />
            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white/60 mb-1">{config.label}</div>
                <div className="text-sm text-white/80 line-clamp-3 italic">"{selectedText}"</div>
            </div>
        </div>
    );
}

// Individual chat message bubble
function ChatMessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
            <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
                {/* Show context card if present */}
                {message.context && (
                    <AIContextCard selectedText={message.context.selectedText} mode={message.context.mode} />
                )}
                
                {/* Message bubble */}
                <div
                    className={`rounded-lg px-4 py-2.5 ${
                        isUser
                            ? "bg-[#FA4616] text-white"
                            : "bg-white/5 border border-white/10 text-white/90"
                    }`}
                >
                    {!isUser && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                            <Sparkles className="w-3.5 h-3.5 text-[#FA4616]" />
                            <span className="text-xs font-medium text-white/60">AI Assistant</span>
                        </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>

                {/* Timestamp */}
                <div className="text-xs text-white/40 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
            </div>
        </div>
    );
}

// Streaming indicator while AI is generating
function StreamingIndicator() {
    return (
        <div className="flex items-start gap-2 mb-4">
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                    <Sparkles className="w-3.5 h-3.5 text-[#FA4616] animate-pulse" />
                    <span className="text-xs font-medium text-white/60">AI Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FA4616]" />
                    <span className="text-sm text-white/70">Thinking...</span>
                </div>
            </div>
        </div>
    );
}

// Quick action buttons for common prompts
function QuickActions({ onSelect }: { onSelect: (prompt: string) => void }) {
    const actions = [
        { label: "Make it shorter", prompt: "Make this content more concise" },
        { label: "More casual", prompt: "Rewrite this in a more casual, friendly tone" },
        { label: "More professional", prompt: "Rewrite this in a more professional tone" },
        { label: "Add urgency", prompt: "Make this more urgent and compelling" },
        { label: "Simplify", prompt: "Simplify the language and make it easier to understand" },
        { label: "Add CTA", prompt: "Add a compelling call-to-action" },
    ];

    return (
        <div className="border-t border-white/10 p-3">
            <div className="text-xs font-medium text-white/50 mb-2">Quick Actions</div>
            <div className="flex flex-wrap gap-1.5">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        onClick={() => onSelect(action.prompt)}
                        className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10"
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
}: {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    onSendMessage: (prompt: string, context?: { selectedText: string; mode: AIMode }) => void;
    isStreaming: boolean;
    selectedText: string | null;
    mode: AIMode;
    onModeChange: (mode: AIMode) => void;
}) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

        onSendMessage(input.trim(), context);
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
        <div 
            data-ai-sidebar
            className="relative w-[480px] h-full bg-[#1a1a1a] border-l border-white/10 z-40 flex flex-col shadow-2xl pb-0 min-h-0 shrink-0"
        >
                {/* Close button - minimal header */}
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Mode selector - only show when text is selected */}
                {selectedText && (
                    <div className="p-3 pt-16 border-b border-white/10 bg-black/10">
                        <div className="text-xs font-medium text-white/50 mb-2">Action</div>
                        <div className="flex gap-2">
                            {[
                                { value: "generate" as const, label: "Generate", icon: Plus },
                                { value: "edit" as const, label: "Edit", icon: Edit3 },
                                { value: "insert" as const, label: "Insert", icon: CornerDownRight },
                            ].map((m) => (
                                <button
                                    key={m.value}
                                    onClick={() => onModeChange(m.value)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                        mode === m.value
                                            ? "bg-[#FA4616] text-white"
                                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <m.icon className="w-3.5 h-3.5" />
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className={`flex-1 min-h-0 overflow-y-auto p-4 pb-6 scrollbar-hide ${!selectedText ? 'pt-16' : ''}`}>
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FA4616]/20 to-purple-600/20 flex items-center justify-center mb-4">
                                <Wand2 className="w-8 h-8 text-[#FA4616]" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Start creating with AI
                            </h3>
                            <p className="text-sm text-white/60 mb-6">
                                Select text to edit it, or start a conversation to generate new content.
                                I'll help you refine your newsletter until it's perfect.
                            </p>
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="text-xs font-medium text-white/80 mb-1">💡 Tip</div>
                                    <div className="text-xs text-white/60">
                                        Highlight text and ask me to improve it
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="text-xs font-medium text-white/80 mb-1">✨ Pro</div>
                                    <div className="text-xs text-white/60">
                                        Use Cmd/Ctrl+Enter to send messages
                                    </div>
                                </div>
                            </div>
                        </div>
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
                <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
                    {/* Context indicator - shows when text is attached */}
                    {selectedText && (
                        <div className="mb-3 p-3 rounded-lg bg-[#FA4616]/10 border border-[#FA4616]/30">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-[#FA4616] flex-shrink-0" />
                                    <span className="text-xs font-medium text-[#FA4616]">Context attached</span>
                                </div>
                                <button
                                    onClick={() => {
                                        // Clear the attached context
                                        const event = new CustomEvent('clearAiContext');
                                        window.dispatchEvent(event);
                                    }}
                                    className="text-xs text-white/60 hover:text-white transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="text-xs text-white/70 line-clamp-2 italic">
                                "{selectedText}"
                            </div>
                        </div>
                    )}
                    
                    <div className="relative">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                selectedText
                                    ? `Ask me to ${mode} the selected text...`
                                    : "Ask me to write or improve your newsletter..."
                            }
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none pr-12 min-h-[80px]"
                            disabled={isStreaming}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isStreaming}
                            size="sm"
                            className="absolute bottom-2 right-2 bg-[#FA4616] hover:bg-[#FA4616]/90"
                        >
                            {isStreaming ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                    <div className="text-xs text-white/40 mt-2">
                        Press <kbd className="px-1.5 py-0.5 rounded bg-white/10">Cmd/Ctrl</kbd> +{" "}
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10">Enter</kbd> to send
                    </div>
                </div>
        </div>
    );
}
