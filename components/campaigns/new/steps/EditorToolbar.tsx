"use client";

import { Bold, Italic, List, ListOrdered, LinkIcon, ImageIcon, Undo, Redo, Minus, Sparkles, ChevronDown, Mail } from "lucide-react";
import { useCampaignComposer } from "../CampaignComposerProvider";
import { useState, useRef, useEffect } from "react";
import { VARIABLE_CONFIG, type VariableType } from "@/components/email-builder/extensions/Variable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

function ToolbarButton({ onClick, active, disabled, children, title }: { onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode; title: string; }) {
    return (
        <Button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            variant={active ? "default" : "ghost"}
            size="sm"
            className={cn(
                "p-2",
                active && "bg-[#FA4616] text-white",
                !active && "text-white/70 hover:text-white"
            )}
        >
            {children}
        </Button>
    );
}

// Subject/Preview dropdown component
function SubjectPreviewDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { subject, setSubject, previewText, setPreviewText } = useCampaignComposer();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                title="Email Subject & Preview"
                variant={subject ? "secondary" : "ghost"}
                size="sm"
                className="flex items-center gap-1.5"
            >
                <Mail className="w-4 h-4" />
                <span className="text-xs font-medium">
                    {subject || 'Subject'}
                </span>
                <ChevronDown className="w-3 h-3" />
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-96 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 p-4 space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-white/60 mb-1.5">Subject Line</label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="bg-white/5 border-white/10 text-white text-sm"
                            placeholder="Enter email subject..."
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-white/60 mb-1.5">
                            Preview Text <span className="text-white/40">(Optional)</span>
                        </label>
                        <Input
                            value={previewText}
                            onChange={(e) => setPreviewText(e.target.value)}
                            className="bg-white/5 border-white/10 text-white text-sm"
                            placeholder="Shown in inbox preview..."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Variable dropdown component for inserting personalization tags
function VariableDropdown({ editor }: { editor: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const insertVariable = (type: VariableType) => {
        editor.chain().focus().insertVariable(type).run();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                title="Insert Variable"
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <ChevronDown className="w-3 h-3" />
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-white/10 bg-white/5">
                        <div className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                            Personalization Variables
                        </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {Object.entries(VARIABLE_CONFIG).map(([type, config]) => (
                            <button
                                key={type}
                                onClick={() => insertVariable(type as VariableType)}
                                className="w-full text-left px-3 py-2.5 hover:bg-[#FA4616]/10 transition-colors border-b border-white/5 last:border-0"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 rounded bg-[#FA4616]/20 flex items-center justify-center mt-0.5">
                                        <span className="text-[#FA4616] text-xs font-bold">
                                            {type.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white">
                                            {config.label}
                                        </div>
                                        <div className="text-xs text-white/50 mt-0.5">
                                            {config.description}
                                        </div>
                                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/10">
                                            <span className="text-xs font-mono text-[#FA4616]">{`{{${type}}}`}</span>
                                            <span className="text-xs text-white/40">→</span>
                                            <span className="text-xs text-white/60">{config.example}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="p-2 border-t border-white/10 bg-white/5">
                        <div className="text-xs text-white/50">
                            Variables will be replaced with actual member data when emails are sent
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EditorToolbar() {
    const { 
        editor, 
        setAlign, 
        addLink, 
        addImage, 
        addYoutube, 
        setShowAiSidebar, 
        setAiSelectedText, 
        setShowTestEmailDialog,
        senderIdentity,
        subscriptionStatus,
        requireSubscriptionFeature,
    } = useCampaignComposer();
    
    // Handle AI button click - capture selection if any
    const handleAiClick = () => {
        if (!requireSubscriptionFeature("ai") || !editor) return;
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, " ");
        if (selectedText) {
            setAiSelectedText(selectedText);
        }
        setShowAiSidebar(true);
    };
    
    if (!editor) return null;
    return (
        <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-1 p-2 flex-wrap">
                <SubjectPreviewDropdown />
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ToolbarButton onClick={handleAiClick} title={subscriptionStatus.canUseAI ? "Ask AI (Cmd/Ctrl+K)" : "Upgrade to unlock AI copilots"}>
                    <Sparkles className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <VariableDropdown editor={editor} />
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ToolbarButton onClick={() => editor.chain().focus().insertCTA({}).run()} title="Insert CTA">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 5h16a1 1 0 011 1v4a1 1 0 01-1 1h-7l-3 3v-3H4a1 1 0 01-1-1V6a1 1 0 011-1z" /></svg>
                </ToolbarButton>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ToolbarButton onClick={() => editor.chain().focus().insertColumns({ count: 2 as any }).run()} title="Insert 2 Columns">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 5h7v14H4zM13 5h7v14h-7z"/></svg>
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().insertColumns({ count: 3 as any }).run()} title="Insert 3 Columns">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5h6v14H3zM9 5h6v14H9zM15 5h6v14h-6z"/></svg>
                </ToolbarButton>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Toggle Blockquote">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 7h6v6H7V7zm0 8h10v2H7v-2zm8-8h2v6h-2V7z" /></svg>
                </ToolbarButton>
                <ToolbarButton onClick={() => setAlign('left')} title="Align Left" active={editor.isActive({ textAlign: 'left' })}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 6h14v2H3V6zm0 4h10v2H3v-2zm0 4h14v2H3v-2zm0 4h10v2H3v-2z"/></svg>
                </ToolbarButton>
                <ToolbarButton onClick={() => setAlign('center')} title="Align Center" active={editor.isActive({ textAlign: 'center' })}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 6h14v2H5V6zm3 4h8v2H8v-2zm-3 4h14v2H5v-2zm3 4h8v2H8v-2z"/></svg>
                </ToolbarButton>
                <ToolbarButton onClick={() => setAlign('right')} title="Align Right" active={editor.isActive({ textAlign: 'right' })}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 6h14v2H7V6zm7 4h7v2h-7v-2zm-7 4h14v2H7v-2zm7 4h7v2h-7v-2z"/></svg>
                </ToolbarButton>
                <ToolbarButton onClick={() => setAlign('justify')} title="Justify" active={editor.isActive({ textAlign: 'justify' })}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 6h18v2H3V6zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/></svg>
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Add Link">
                    <LinkIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton 
                    onClick={() => editor.chain().focus().setImagePlaceholder({ 
                        alt: "Image", 
                        suggestedPrompt: "Describe what you want to see in this image" 
                    }).run()} 
                    title="Add Image"
                >
                    <ImageIcon className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ToolbarButton onClick={addYoutube} title="Insert YouTube Video">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 8l6 4-6 4V8z"></path></svg>
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={editor.isActive("horizontalRule")} title="Insert Horizontal Rule">
                    <Minus className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ToolbarButton
                    onClick={() => {
                        if (!senderIdentity.setupComplete) return;
                        if (!requireSubscriptionFeature("send")) return;
                        setShowTestEmailDialog(true);
                    }}
                    title={
                        senderIdentity.setupComplete
                            ? subscriptionStatus.canSend
                                ? "Send Test Email"
                                : "Upgrade to send test emails"
                            : "Complete sender settings to send tests"
                    }
                    disabled={!senderIdentity.setupComplete}
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                </ToolbarButton>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                    <Redo className="w-4 h-4" />
                </ToolbarButton>
            </div>
        </div>
    );
}


