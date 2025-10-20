"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { Editor } from "@tiptap/core";
import { useCampaignEditor } from "./useCampaignEditor";
import type { ChatMessage, AIMode } from "./modals/AISidebar";
import { useDraftAutoSave, type DraftStatus } from "@/lib/hooks/useDraftAutoSave";
import { useCollaboration } from "@/lib/hooks/useCollaboration";
import type { AwarenessUser } from "@/lib/collaboration/RealtimeProvider";

type AudienceMode = "all_active" | "tiers" | "active_recent";

type AudienceCounts = {
    activeCount: number | null;
    recentActiveCount: number | null;
    tierActiveCounts: Record<string, number>;
};

// User information type
type UserInfo = {
    id: string;
    name: string;
    username: string;
    email: string | null;
    profilePictureUrl: string | null;
} | null;

export type CampaignComposerContextValue = {
    experienceId: string;
    router: ReturnType<typeof useRouter>;
    editor: Editor | null;

    // User
    user: UserInfo;
    loadingUser: boolean;

    // Steps
    steps: { key: string; label: string }[];
    currentStep: number;
    setCurrentStep: (n: number) => void;

    // Compose
    subject: string;
    setSubject: (s: string) => void;
    previewText: string;
    setPreviewText: (s: string) => void;

    // Draft & Sync
    draftStatus: DraftStatus;
    lastSaved: Date | null;
    hasUnsavedChanges: boolean;
    draftId: string | undefined;
    saveDraft: () => void;
    collaborationSynced: boolean;
    collaborators: AwarenessUser[];

    // Modals / dialogs
    showPreview: boolean;
    setShowPreview: (v: boolean) => void;
    previewMode: "desktop" | "mobile";
    setPreviewMode: (m: "desktop" | "mobile") => void;
    showNameDialog: boolean;
    setShowNameDialog: (v: boolean) => void;
    templateName: string;
    setTemplateName: (s: string) => void;
    savingTemplate: boolean;
    setSavingTemplate: (v: boolean) => void;
    showTemplatePicker: boolean;
    setShowTemplatePicker: (v: boolean) => void;
    templates: any[];
    setTemplates: (t: any[]) => void;
    loadingTemplates: boolean;
    setLoadingTemplates: (v: boolean) => void;
    categoryFilter: string;
    setCategoryFilter: (s: string) => void;
    previewTemplateHtml: string | null;
    setPreviewTemplateHtml: (s: string | null) => void;
    showAiDialog: boolean;
    setShowAiDialog: (v: boolean) => void;
    showTestEmailDialog: boolean;
    setShowTestEmailDialog: (v: boolean) => void;

    // AI Sidebar (new Cursor-style interface)
    showAiSidebar: boolean;
    setShowAiSidebar: (v: boolean) => void;
    aiMessages: ChatMessage[];
    aiSelectedText: string | null;
    setAiSelectedText: (text: string | null) => void;
    aiMode: AIMode;
    setAiMode: (mode: AIMode) => void;
    aiStreaming: boolean;
    sendAiMessage: (prompt: string, context?: { selectedText: string; mode: AIMode }) => Promise<void>;

    // Image/Youtube dialogs
    showYoutubeInput: boolean;
    setShowYoutubeInput: (v: boolean) => void;
    youtubeUrl: string;
    setYoutubeUrl: (s: string) => void;
    ytRef: React.MutableRefObject<HTMLInputElement | null>;
    showImageInput: boolean;
    setShowImageInput: (v: boolean) => void;
    imageUrlInput: string;
    setImageUrlInput: (s: string) => void;
    uploadingImage: boolean;
    setUploadingImage: (v: boolean) => void;
    draggingImage: boolean;
    setDraggingImage: (v: boolean) => void;
    imageFileInputRef: React.MutableRefObject<HTMLInputElement | null>;

    // CTA bubble state
    showCtaLinkEditor: boolean;
    setShowCtaLinkEditor: (v: boolean) => void;
    ctaLinkValue: string;
    setCtaLinkValue: (s: string) => void;

    // Drag handle
    showHandleMenu: boolean;
    setShowHandleMenu: React.Dispatch<React.SetStateAction<boolean>>;
    handleAnchorPos: number | null;
    setHandleAnchorPos: (n: number | null) => void;

    // Audience
    audienceMode: AudienceMode;
    setAudienceMode: (m: AudienceMode) => void;
    availableTiers: string[];
    setAvailableTiers: (t: string[]) => void;
    counts: AudienceCounts;
    setCounts: React.Dispatch<React.SetStateAction<AudienceCounts>>;
    selectedTiers: string[];
    setSelectedTiers: (t: string[]) => void;
    loadingAudience: boolean;
    setLoadingAudience: (v: boolean) => void;

    // Settings
    trackOpens: boolean;
    setTrackOpens: (b: boolean) => void;
    trackClicks: boolean;
    setTrackClicks: (b: boolean) => void;
    utmTemplate: string;
    setUtmTemplate: (s: string) => void;
    timezone: string;
    setTimezone: (s: string) => void;
    quietHoursEnabled: boolean;
    setQuietHoursEnabled: (b: boolean) => void;

    // Actions
    create: () => Promise<void>;
    saveAsTemplate: () => Promise<void>;
    addLink: () => void;
    addImage: () => void;
    uploadImageFile: (file: File) => Promise<void>;
    onPickImageFile: () => void;
    onImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDropImage: (e: React.DragEvent<HTMLDivElement>) => void;
    insertImageFromUrl: () => void;
    addYoutube: () => void;
    confirmYoutube: () => void;
    setAlign: (align: "left" | "center" | "right" | "justify") => void;
    deleteNearestBlock: () => void;
};

const ComposerContext = createContext<CampaignComposerContextValue | null>(null);

export function CampaignComposerProvider({
    experienceId,
    children,
}: {
    experienceId: string;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editor = useCampaignEditor();

    // Steps
    const steps = useMemo(
        () => [
            { key: "compose", label: "Compose" },
            { key: "audience", label: "Audience" },
            { key: "settings", label: "Settings" },
            { key: "review", label: "Review" },
        ],
        []
    );
    const [currentStep, setCurrentStep] = useState<number>(0);

    // User state
    const [user, setUser] = useState<UserInfo>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // Compose state
    const [subject, setSubject] = useState("");
    const [previewText, setPreviewText] = useState("");

    // Modals / dialogs
    const [showPreview, setShowPreview] = useState(false);
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const [showNameDialog, setShowNameDialog] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [previewTemplateHtml, setPreviewTemplateHtml] = useState<string | null>(null);
    const [showAiDialog, setShowAiDialog] = useState(false);
    const [showTestEmailDialog, setShowTestEmailDialog] = useState(false);

    // AI Sidebar state (new Cursor-style interface)
    const [showAiSidebar, setShowAiSidebar] = useState(false);
    const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
    const [aiSelectedText, setAiSelectedText] = useState<string | null>(null);
    const [aiMode, setAiMode] = useState<AIMode>("generate");
    const [aiStreaming, setAiStreaming] = useState(false);

    // Image/Youtube dialogs
    const [showYoutubeInput, setShowYoutubeInput] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const ytRef = useRef<HTMLInputElement | null>(null);
    const [showImageInput, setShowImageInput] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [draggingImage, setDraggingImage] = useState(false);
    const imageFileInputRef = useRef<HTMLInputElement | null>(null);

    // CTA bubble state
    const [showCtaLinkEditor, setShowCtaLinkEditor] = useState(false);
    const [ctaLinkValue, setCtaLinkValue] = useState("");

    // Drag handle
    const [showHandleMenu, setShowHandleMenu] = useState(false);
    const [handleAnchorPos, setHandleAnchorPos] = useState<number | null>(null);

    // Audience state
    const [audienceMode, setAudienceMode] = useState<AudienceMode>("all_active");
    const [availableTiers, setAvailableTiers] = useState<string[]>([]);
    const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
    const [loadingAudience, setLoadingAudience] = useState<boolean>(false);
    const [counts, setCounts] = useState<AudienceCounts>({
        activeCount: null,
        recentActiveCount: null,
        tierActiveCounts: {},
    });

    // Settings
    const [trackOpens, setTrackOpens] = useState<boolean>(true);
    const [trackClicks, setTrackClicks] = useState<boolean>(true);
    const [utmTemplate, setUtmTemplate] = useState<string>(
        "utm_source=membermail&utm_medium=email&utm_campaign={{slug}}"
    );
    const defaultTz = useMemo(() => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        } catch {
            return "UTC";
        }
    }, []);
    const [timezone, setTimezone] = useState<string>(defaultTz);
    const [quietHoursEnabled, setQuietHoursEnabled] = useState<boolean>(false);

    // Draft auto-save integration
    const {
        status: draftStatus,
        lastSaved,
        hasUnsavedChanges,
        draftId,
        saveDraft,
        loadDraft,
    } = useDraftAutoSave({
        editor,
        experienceId,
        subject,
        previewText,
        debounceMs: 2000,
        enabled: true,
    });

    // Load most recent draft on mount
    const hasLoadedDraft = useRef(false);
    useEffect(() => {
        async function loadMostRecentDraft() {
            if (!editor || hasLoadedDraft.current) return;

            try {
                const response = await fetch(`/api/drafts?experienceId=${experienceId}`);
                if (!response.ok) return;

                const { drafts } = await response.json();
                
                // Get the most recent draft
                if (drafts && drafts.length > 0) {
                    const mostRecent = drafts[0]; // API returns sorted by updated_at DESC
                    
                    // Only auto-load if editor is empty
                    const currentContent = editor.getText().trim();
                    const hasContent = currentContent !== '' || subject !== '';
                    
                    if (!hasContent) {
                        // Load the draft content
                        if (mostRecent.editor_json) {
                            editor.commands.setContent(mostRecent.editor_json);
                        }
                        if (mostRecent.subject) {
                            setSubject(mostRecent.subject);
                        }
                        if (mostRecent.preview_text) {
                            setPreviewText(mostRecent.preview_text);
                        }
                        
                        hasLoadedDraft.current = true;
                        console.log('✅ Loaded most recent draft:', mostRecent.id);
                    }
                }
            } catch (error) {
                console.error('Failed to load draft:', error);
            }
        }

        // Wait a bit for editor to be ready
        const timeout = setTimeout(loadMostRecentDraft, 500);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor, experienceId]); // Only run once when editor is ready

    // Collaboration integration
    const {
        synced: collaborationSynced,
        collaborators,
    } = useCollaboration({
        editor,
        documentId: `campaign:${experienceId}:new`,
        userId: user?.id || 'anonymous',
        userName: user?.name || 'Guest',
        enabled: true,
    });

    // Effects: Fetch current user information
    useEffect(() => {
        async function fetchUser() {
            try {
                const response = await fetch("/api/user/me");
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
            } finally {
                setLoadingUser(false);
            }
        }
        fetchUser();
    }, []);

    // Effects: editor content prefill from draft or template
    useEffect(() => {
        if (!editor) return;
        const draftContent = sessionStorage.getItem("draft_email_content");
        if (draftContent) {
            editor.commands.setContent(draftContent);
            sessionStorage.removeItem("draft_email_content");
            return;
        }
        const tid = searchParams.get("templateId");
        if (tid) {
            fetch(`/api/templates/${tid}`)
                .then((r) => r.json())
                .then((t) => {
                    if (t?.html_content) {
                        editor.commands.setContent(t.html_content);
                    }
                })
                .catch(() => {});
        }
    }, [editor, searchParams]);

    // Load templates on open
    useEffect(() => {
        if (!showTemplatePicker || templates.length > 0 || loadingTemplates) return;
        setLoadingTemplates(true);
        (async () => {
            try {
                const res = await fetch(`/api/templates`, { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setTemplates(Array.isArray(data.templates) ? data.templates : []);
                }
            } finally {
                setLoadingTemplates(false);
            }
        })();
    }, [showTemplatePicker, templates.length, loadingTemplates]);

    // Focus YT input when opened
    useEffect(() => {
        if (showYoutubeInput) {
            requestAnimationFrame(() => ytRef.current?.focus());
        }
    }, [showYoutubeInput]);

    // ESC closes preview
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && showPreview) setShowPreview(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showPreview]);

    // Audience summary + counts
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                setLoadingAudience(true);
                const res = await fetch(`/api/members?companyId=${experienceId}&limit=1`);
                if (!res.ok) return;
                const data = await res.json();
                if (ignore) return;
                const active = Number(data?.breakdown?.status?.active ?? 0);
                const tiersObj = data?.breakdown?.tiers ?? {};
                const keys = Object.keys(tiersObj || {}).filter(Boolean);
                setCounts((prev) => ({ ...prev, activeCount: Number.isFinite(active) ? active : 0 }));
                setAvailableTiers(keys);
            } finally {
                setLoadingAudience(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [experienceId]);

    // Fetch 30d active when needed
    useEffect(() => {
        let ignore = false;
        (async () => {
            if (audienceMode !== "active_recent") return;
            try {
                const res = await fetch(`/api/members?companyId=${experienceId}&status=active&lastActiveDays=30&limit=1`);
                if (!res.ok) return;
                const data = await res.json();
                if (ignore) return;
                const count = Number(data?.pagination?.count ?? 0);
                setCounts((prev) => ({ ...prev, recentActiveCount: Number.isFinite(count) ? count : 0 }));
            } catch {}
        })();
        return () => {
            ignore = true;
        };
    }, [audienceMode, experienceId]);

    // Per-tier counts when selecting tiers
    useEffect(() => {
        let ignore = false;
        (async () => {
            if (audienceMode !== "tiers") return;
            const missing = selectedTiers.filter((t) => counts.tierActiveCounts[t] === undefined);
            if (missing.length === 0) return;
            try {
                const results = await Promise.all(
                    missing.map(async (t) => {
                        const r = await fetch(
                            `/api/members?companyId=${experienceId}&status=active&tier=${encodeURIComponent(t)}&limit=1`
                        );
                        if (!r.ok) return [t, 0] as const;
                        const d = await r.json();
                        const c = Number(d?.pagination?.count ?? 0);
                        return [t, Number.isFinite(c) ? c : 0] as const;
                    })
                );
                if (ignore) return;
                setCounts((prev) => {
                    const next = { ...prev, tierActiveCounts: { ...prev.tierActiveCounts } };
                    for (const [k, v] of results) next.tierActiveCounts[k] = v;
                    return next;
                });
            } catch {}
        })();
        return () => {
            ignore = true;
        };
    }, [audienceMode, selectedTiers, experienceId, counts.tierActiveCounts]);

    // Actions
    const create = useCallback(async () => {
        if (!subject.trim()) {
            toast.error("Please add a subject line");
        }
        try {
            const resolveRes = await fetch(`/api/communities/resolve?companyId=${experienceId}`);
            const { id: community_id } = resolveRes.ok ? await resolveRes.json() : { id: 1 };
            const audiencePayload = (() => {
                if (audienceMode === "all_active") return { type: "all_active" } as const;
                if (audienceMode === "active_recent") return { type: "active_recent", days: 30 } as const;
                return { type: "tiers", tiers: selectedTiers } as const;
            })();
            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    preview_text: previewText,
                    html_content: editor?.getHTML() ?? "",
                    community_id,
                    audience: audiencePayload,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                toast.success("Campaign created successfully!");
                router.push(`/experiences/${experienceId}/campaigns/${data.campaign.id}`);
            } else {
                toast.error("Failed to create campaign");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    }, [experienceId, audienceMode, selectedTiers, subject, previewText, editor, router]);

    const saveAsTemplate = useCallback(async () => {
        if (!editor) return;
        if (!templateName.trim()) {
            setShowNameDialog(true);
            return;
        }
        setSavingTemplate(true);
        try {
            const res = await fetch("/api/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: templateName.trim(), html_content: editor.getHTML(), category: "Custom" }),
            });
            if (res.ok) {
                toast.success("Template saved");
                setShowNameDialog(false);
                setTemplateName("");
            } else {
                toast.error("Failed to save template");
            }
        } catch {
            toast.error("Error saving template");
        } finally {
            setSavingTemplate(false);
        }
    }, [editor, templateName]);

    const addLink = useCallback(() => {
        if (!editor) return;
        const url = window.prompt("Enter URL");
        if (url) editor.chain().focus().setLink({ href: url }).run();
    }, [editor]);

    const addImage = useCallback(() => {
        setImageUrlInput("");
        setShowImageInput(true);
    }, []);

    const uploadImageFile = useCallback(
        async (file: File) => {
            if (!file) return;
            try {
                setUploadingImage(true);
                const form = new FormData();
                form.append("file", file);
                const res = await fetch("/api/uploads/image", { method: "POST", body: form });
                if (!res.ok) {
                    const t = await res.text().catch(() => "Upload failed");
                    throw new Error(t || "Upload failed");
                }
                const data = (await res.json()) as { url: string };
                if (!data?.url) throw new Error("No URL returned");
                editor?.chain().focus().setImage({ src: data.url }).run();
                setShowImageInput(false);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Upload failed");
            } finally {
                setUploadingImage(false);
            }
        },
        [editor]
    );

    const onPickImageFile = useCallback(() => {
        imageFileInputRef.current?.click();
    }, []);

    const onImageFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) uploadImageFile(file);
            e.target.value = "";
        },
        [uploadImageFile]
    );

    const onDropImage = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDraggingImage(false);
            const file = e.dataTransfer.files?.[0];
            if (file) uploadImageFile(file);
        },
        [uploadImageFile]
    );

    const insertImageFromUrl = useCallback(() => {
        if (!editor) return;
        const url = imageUrlInput.trim();
        if (!url) return;
        editor.chain().focus().setImage({ src: url }).run();
        setShowImageInput(false);
    }, [editor, imageUrlInput]);

    const addYoutube = useCallback(() => {
        setYoutubeUrl("");
        setShowYoutubeInput(true);
    }, []);

    const confirmYoutube = useCallback(() => {
        if (!editor) return;
        const url = youtubeUrl.trim();
        if (!url) {
            setShowYoutubeInput(false);
            return;
        }
        try {
            editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run();
            setShowYoutubeInput(false);
            setYoutubeUrl("");
        } catch {
            toast.error("Invalid YouTube URL");
        }
    }, [editor, youtubeUrl]);

    const setAlign = useCallback(
        (alignment: "left" | "center" | "right" | "justify") => {
            if (!editor) return;
            // @ts-ignore runtime check
            if (editor.commands && typeof (editor.commands as any).setTextAlign === "function") {
                // @ts-ignore
                editor.chain().focus().setTextAlign(alignment).run();
                return;
            }
            editor
                .chain()
                .focus()
                .updateAttributes("paragraph", { textAlign: alignment })
                .updateAttributes("heading", { textAlign: alignment })
                .run();
        },
        [editor]
    );

    const deleteNearestBlock = useCallback(() => {
        if (!editor) {
            return;
        }
        const { state } = editor;
        const basePos = handleAnchorPos ?? state.selection.from;
        
        // Resolve the position - this gives us the context of where we are in the document
        let $pos = state.doc.resolve(basePos);
        
        // If depth is 0, we might be at the document level, try to find the node at this position
        if ($pos.depth === 0) {
            // Find the node at or after this position
            const nodeAtPos = state.doc.nodeAt(basePos);
            
            // Try to find the block node by checking the parent of the current position
            state.doc.nodesBetween(basePos, basePos + 1, (node, pos) => {
                if (node.isBlock && pos === basePos) {
                    const tr = state.tr.delete(pos, pos + node.nodeSize);
                    editor.view.dispatch(tr);
                    setShowHandleMenu(false);
                    return false; // Stop iteration
                }
            });
            
            // If we found and deleted something, return
            if (!showHandleMenu) return;
        }
        
        // First, check for columns specifically
        for (let depth = $pos.depth; depth > 0; depth--) {
            const node = $pos.node(depth);
            if (node.type.name === "columns") {
                const pos = $pos.before(depth);
                const tr = state.tr.delete(pos, pos + node.nodeSize);
                editor.view.dispatch(tr);
                setShowHandleMenu(false);
                return;
            }
        }
        
        // Then check for other preferred block types
        const preferred = [
            "columns",
            "cta",
            "image",
            "blockquote",
            "orderedList",
            "bulletList",
            "heading",
            "paragraph",
            "horizontalRule",
        ];
        for (let depth = $pos.depth; depth > 0; depth--) {
            const node = $pos.node(depth);
            const name = node.type.name;
            if (preferred.includes(name)) {
                const pos = $pos.before(depth);
                const tr = state.tr.delete(pos, pos + node.nodeSize);
                editor.view.dispatch(tr);
                setShowHandleMenu(false);
                return;
            }
        }
        
        // Fallback to deleting current selection
        editor.commands.deleteSelection();
        setShowHandleMenu(false);
    }, [editor, handleAnchorPos, showHandleMenu]);

    // AI message handler with streaming support
    const sendAiMessage = useCallback(
        async (prompt: string, context?: { selectedText: string; mode: AIMode }) => {
            if (!editor) return;

            // Store current selection position for edit mode
            const selectionRange = context?.mode === "edit" 
                ? { from: editor.state.selection.from, to: editor.state.selection.to }
                : null;

            // Add user message to chat
            const userMessage: ChatMessage = {
                id: Date.now().toString(),
                role: "user",
                content: prompt,
                timestamp: new Date(),
                context,
            };
            setAiMessages((prev) => [...prev, userMessage]);
            setAiStreaming(true);

            try {
                // Prepare the request based on mode
                // Include conversation history (last 6 messages = 3 exchanges)
                const conversationHistory = aiMessages.slice(-6).map(msg => ({
                    role: msg.role,
                    content: msg.content,
                }));

                let requestBody: any = {
                    prompt,
                    currentContent: editor.getHTML(),
                    editorJson: editor.getJSON(), // Send structured Tiptap JSON for surgical edits
                    conversationHistory,
                };

                if (context) {
                    requestBody.selectedText = context.selectedText;
                    requestBody.mode = context.mode;
                }

                // Make streaming request
                const res = await fetch("/api/ai/newsletter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                });

                if (!res.ok) {
                    throw new Error("AI request failed");
                }

                const data = await res.json();

                // Add AI response to chat with specific explanation
                const aiMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: data.explanation || "I've updated your newsletter based on your request.",
                    timestamp: new Date(),
                };
                setAiMessages((prev) => [...prev, aiMessage]);

                // Apply changes to editor based on response type
                if (data.structuredEdits && Array.isArray(data.structuredEdits)) {
                    // Cursor-style structured edits: AI identified specific nodes to edit
                    const currentDoc = editor.getJSON();
                    
                    // Apply each edit to the document
                    for (const edit of data.structuredEdits) {
                        const { nodePath, action, newNode } = edit;
                        
                        if (action === "replace") {
                            // Navigate to the node using the path and replace it
                            let targetNode: any = currentDoc;
                            let parentNode: any = null;
                            let lastIndex = 0;
                            
                            for (let i = 0; i < nodePath.length; i++) {
                                const index = nodePath[i];
                                if (i === nodePath.length - 1) {
                                    lastIndex = index;
                                    parentNode = targetNode;
                                } else {
                                    targetNode = targetNode.content?.[index];
                                }
                            }
                            
                            if (parentNode && parentNode.content) {
                                parentNode.content[lastIndex] = newNode;
                            }
                        } else if (action === "delete") {
                            // Navigate and delete the node
                            let targetNode: any = currentDoc;
                            let parentNode: any = null;
                            let lastIndex = 0;
                            
                            for (let i = 0; i < nodePath.length; i++) {
                                const index = nodePath[i];
                                if (i === nodePath.length - 1) {
                                    lastIndex = index;
                                    parentNode = targetNode;
                                } else {
                                    targetNode = targetNode.content?.[index];
                                }
                            }
                            
                            if (parentNode && parentNode.content) {
                                parentNode.content.splice(lastIndex, 1);
                            }
                        } else if (action === "insertAfter") {
                            // Navigate and insert after the node
                            let targetNode: any = currentDoc;
                            let parentNode: any = null;
                            let lastIndex = 0;
                            
                            for (let i = 0; i < nodePath.length; i++) {
                                const index = nodePath[i];
                                if (i === nodePath.length - 1) {
                                    lastIndex = index;
                                    parentNode = targetNode;
                                } else {
                                    targetNode = targetNode.content?.[index];
                                }
                            }
                            
                            if (parentNode && parentNode.content) {
                                parentNode.content.splice(lastIndex + 1, 0, newNode);
                            }
                        }
                    }
                    
                    // Apply the modified document
                    editor.commands.setContent(currentDoc);
                    toast.success("Content updated precisely");
                } else if (context?.mode === "edit" && selectionRange && data.editedContent) {
                    // Edit mode: Replace only the selected portion with AI's edited version
                    const { from, to } = selectionRange;
                    editor.chain()
                        .focus()
                        .setTextSelection({ from, to })
                        .deleteSelection()
                        .insertContent(data.editedContent)
                        .run();
                    toast.success("Selection updated");
                } else if (data?.doc) {
                    // Generate mode or fallback: Replace entire content
                    editor.commands.setContent(data.doc);
                    toast.success("Content updated");
                } else {
                    throw new Error("Invalid response format");
                }
            } catch (error) {
                const errorMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "Sorry, I encountered an error. Please try again.",
                    timestamp: new Date(),
                };
                setAiMessages((prev) => [...prev, errorMessage]);
                toast.error("Failed to generate content");
            } finally {
                setAiStreaming(false);
            }
        },
        [editor]
    );

    const value = useMemo<CampaignComposerContextValue>(
        () => ({
            experienceId,
            router,
            editor: (editor as any) ?? null,
            user,
            loadingUser,
            steps,
            currentStep,
            setCurrentStep,
            subject,
            setSubject,
            previewText,
            setPreviewText,
            draftStatus,
            lastSaved,
            hasUnsavedChanges,
            draftId,
            saveDraft,
            collaborationSynced,
            collaborators,
            showPreview,
            setShowPreview,
            previewMode,
            setPreviewMode,
            showNameDialog,
            setShowNameDialog,
            templateName,
            setTemplateName,
            savingTemplate,
            setSavingTemplate,
            showTemplatePicker,
            setShowTemplatePicker,
            templates,
            setTemplates,
            loadingTemplates,
            setLoadingTemplates,
            categoryFilter,
            setCategoryFilter,
            previewTemplateHtml,
            setPreviewTemplateHtml,
            showAiDialog,
            setShowAiDialog,
            showTestEmailDialog,
            setShowTestEmailDialog,
            showAiSidebar,
            setShowAiSidebar,
            aiMessages,
            aiSelectedText,
            setAiSelectedText,
            aiMode,
            setAiMode,
            aiStreaming,
            sendAiMessage,
            showYoutubeInput,
            setShowYoutubeInput,
            youtubeUrl,
            setYoutubeUrl,
            ytRef,
            showImageInput,
            setShowImageInput,
            imageUrlInput,
            setImageUrlInput,
            uploadingImage,
            setUploadingImage,
            draggingImage,
            setDraggingImage,
            imageFileInputRef,
            showCtaLinkEditor,
            setShowCtaLinkEditor,
            ctaLinkValue,
            setCtaLinkValue,
            showHandleMenu,
            setShowHandleMenu,
            handleAnchorPos,
            setHandleAnchorPos,
            audienceMode,
            setAudienceMode,
            availableTiers,
            setAvailableTiers,
            counts,
            setCounts,
            selectedTiers,
            setSelectedTiers,
            loadingAudience,
            setLoadingAudience,
            trackOpens,
            setTrackOpens,
            trackClicks,
            setTrackClicks,
            utmTemplate,
            setUtmTemplate,
            timezone,
            setTimezone,
            quietHoursEnabled,
            setQuietHoursEnabled,
            create,
            saveAsTemplate,
            addLink,
            addImage,
            uploadImageFile,
            onPickImageFile,
            onImageFileChange,
            onDropImage,
            insertImageFromUrl,
            addYoutube,
            confirmYoutube,
            setAlign,
            deleteNearestBlock,
        }),
        [
            experienceId,
            router,
            editor,
            user,
            loadingUser,
            steps,
            currentStep,
            subject,
            previewText,
            draftStatus,
            lastSaved,
            hasUnsavedChanges,
            draftId,
            saveDraft,
            collaborationSynced,
            collaborators,
            showPreview,
            previewMode,
            showNameDialog,
            templateName,
            savingTemplate,
            showTemplatePicker,
            templates,
            loadingTemplates,
            categoryFilter,
            previewTemplateHtml,
            showAiDialog,
            showTestEmailDialog,
            showAiSidebar,
            aiMessages,
            aiSelectedText,
            aiMode,
            aiStreaming,
            sendAiMessage,
            showYoutubeInput,
            youtubeUrl,
            showImageInput,
            imageUrlInput,
            uploadingImage,
            draggingImage,
            showCtaLinkEditor,
            ctaLinkValue,
            showHandleMenu,
            handleAnchorPos,
            audienceMode,
            availableTiers,
            counts,
            selectedTiers,
            loadingAudience,
            trackOpens,
            trackClicks,
            utmTemplate,
            timezone,
            quietHoursEnabled,
            create,
            saveAsTemplate,
            addLink,
            addImage,
            uploadImageFile,
            onPickImageFile,
            onImageFileChange,
            onDropImage,
            insertImageFromUrl,
            addYoutube,
            confirmYoutube,
            setAlign,
            deleteNearestBlock,
        ]
    );

    return <ComposerContext.Provider value={value}>{children}</ComposerContext.Provider>;
}

export function useCampaignComposer() {
    const ctx = useContext(ComposerContext);
    if (!ctx) throw new Error("useCampaignComposer must be used within CampaignComposerProvider");
    return ctx;
}


