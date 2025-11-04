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
import { type EmailStyles, defaultEmailStyles } from "@/components/email-builder/ui/EmailStylePanel";
import { embedStylesInHTML, extractEmailStyles } from "@/lib/email/render-with-styles";
import { isCourseAutomationEvent, type AutomationTriggerEvent } from "@/lib/automations/events";
import type { CourseStepMetadata } from "@/lib/automations/course/types";

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

type SenderIdentityState = {
    displayName: string | null;
    mailUsername: string | null;
    setupComplete: boolean;
};

type SubscriptionStatusState = {
    tier: "free" | "pro" | "enterprise";
    canUseAI: boolean;
    canSend: boolean;
    isCompanyMember: boolean;
    loading: boolean;
    error: string | null;
    authorizedUsersCount: number | null;
};

export type AutomationBlueprintPrefill = {
    sequenceId: string;
    title: string;
    schedule: string[];
    goals: string[];
    prefillSubject?: string;
    prefillPreview?: string;
    prefillHtml?: string;
    aiPromptTemplate?: string;
};

export type CampaignComposerContextValue = {
    companyId: string;
    router: ReturnType<typeof useRouter>;
    editor: Editor | null;

    // User
    user: UserInfo;
    loadingUser: boolean;
    subscriptionStatus: SubscriptionStatusState;
    refreshSubscriptionStatus: () => Promise<void>;
    requireSubscriptionFeature: (feature: "ai" | "send") => boolean;
    paywallReason: "ai" | "send" | null;
    setPaywallReason: (reason: "ai" | "send" | null) => void;

    // Steps
    steps: { key: string; label: string }[];
    currentStep: number;
    setCurrentStep: (n: number) => void;

    // Compose
    subject: string;
    setSubject: (s: string) => void;
    previewText: string;
    setPreviewText: (s: string) => void;
    automationBlueprint: AutomationBlueprintPrefill | null;
    showAutomationBanner: boolean;
    dismissAutomationBanner: () => void;
    sendMode: "manual" | "automation";
    setSendMode: (mode: "manual" | "automation") => void;
    triggerEvent: string | null;
    setTriggerEvent: (event: string | null) => void;
    triggerDelayValue: number;
    setTriggerDelayValue: (value: number) => void;
    triggerDelayUnit: "minutes" | "hours" | "days";
    setTriggerDelayUnit: (unit: "minutes" | "hours" | "days") => void;
    automationStatus: "draft" | "active" | "paused" | "archived";
    setAutomationStatus: (status: "draft" | "active" | "paused" | "archived") => void;
    automationSequenceId: number | null;
    setAutomationSequenceId: (value: number | null) => void;
    automationEditor: boolean;
    automationReturnTo: string | null;
    automationTriggerMetadata: CourseStepMetadata | null;
    setAutomationTriggerMetadata: React.Dispatch<React.SetStateAction<CourseStepMetadata | null>>;

    // Draft & Sync
    draftStatus: DraftStatus;
    lastSaved: Date | null;
    hasUnsavedChanges: boolean;
    draftId: string | undefined;
    saveDraft: () => void;
    openDraftById: (id: string) => Promise<void>;
    deleteDraftById: (id: string) => Promise<void>;
    // Editing existing campaign
    isEditingExistingCampaign: boolean;
    editingCampaignId: number | null;
    saveChanges: () => Promise<void>;
    createDraftCampaign: () => Promise<number | null>;
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

    // Start/Drafts modals
    showStartSourceModal: boolean;
    setShowStartSourceModal: (v: boolean) => void;
    showDraftsModal: boolean;
    setShowDraftsModal: (v: boolean) => void;

    // Prefill helper for templates/automation
    applyPrefillHtml: (html: string, opts?: { subject?: string; preview?: string }) => void;

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

    // Email Styles
    showStylePanel: boolean;
    setShowStylePanel: (v: boolean) => void;
    emailStyles: EmailStyles;
    setEmailStyles: (styles: EmailStyles) => void;

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

    // Sender identity
    senderIdentity: SenderIdentityState;
    loadingSenderIdentity: boolean;
    refreshSenderIdentity: () => Promise<void>;

    // Actions
    create: () => Promise<void>;
    // Save template remains
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
    companyId,
    children,
}: {
    companyId: string;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editor = useCampaignEditor();
    const automationEditor = useMemo(() => {
        const flag = searchParams.get("automationEditor");
        if (flag && (flag === "1" || flag.toLowerCase() === "true")) {
            return true;
        }
        return Boolean(searchParams.get("automationSequenceId") && searchParams.get("returnTo"));
    }, [searchParams]);
    const [senderIdentity, setSenderIdentity] = useState<SenderIdentityState>({
        displayName: null,
        mailUsername: null,
        setupComplete: false,
    });
    const [loadingSenderIdentity, setLoadingSenderIdentity] = useState<boolean>(true);

    // Steps
    const steps = useMemo(
        () =>
            automationEditor
                ? [{ key: "compose", label: "Compose" }]
                : [
                      { key: "compose", label: "Compose" },
                      { key: "audience", label: "Audience" },
                      { key: "settings", label: "Settings" },
                      { key: "automation", label: "Automation" },
                      { key: "review", label: "Review" },
                  ],
        [automationEditor]
    );
    const [currentStep, setCurrentStep] = useState<number>(0);

    // User state
    const [user, setUser] = useState<UserInfo>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusState>({
        tier: "free",
        canUseAI: false,
        canSend: false,
        isCompanyMember: false,
        loading: true,
        error: null,
        authorizedUsersCount: null,
    });
    const [paywallReason, setPaywallReason] = useState<"ai" | "send" | null>(null);

    const refreshSubscriptionStatus = useCallback(async () => {
        setSubscriptionStatus((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : "";
            const response = await fetch(`/api/subscription/status${query}`, { cache: "no-store" });
            const data = await response.json().catch(() => null);

            if (!response.ok || !data) {
                throw new Error(data?.error || "Failed to fetch subscription status");
            }

            setSubscriptionStatus({
                tier: data.tier ?? "free",
                canUseAI: Boolean(data.canUseAI),
                canSend: Boolean(data.canSend),
                isCompanyMember: Boolean(data.isCompanyMember),
                loading: false,
                error: null,
                authorizedUsersCount:
                    typeof data.authorizedUsersCount === "number" ? data.authorizedUsersCount : null,
            });
        } catch (error) {
            console.error("[CampaignComposer] Unable to load subscription status", error);
            setSubscriptionStatus((prev) => ({
                ...prev,
                loading: false,
                error: "Unable to load subscription status",
            }));
        }
    }, [companyId]);

    useEffect(() => {
        void refreshSubscriptionStatus();
    }, [refreshSubscriptionStatus]);

    // Keep paywall open until the user explicitly closes it
    // or until onRefresh() in the PaywallGate succeeds and closes it.
    // Do not auto-close on subscription state changes to avoid flicker.

    const requireSubscriptionFeature = useCallback(
        (feature: "ai" | "send") => {
            const allowed = feature === "ai" ? subscriptionStatus.canUseAI : subscriptionStatus.canSend;
            if (!allowed) {
                setPaywallReason(feature);
                return false;
            }
            return true;
        },
        [subscriptionStatus],
    );

    // Compose state
    const refreshSenderIdentity = useCallback(async () => {
        try {
            setLoadingSenderIdentity(true);
            // Ensure the community exists and is linked to the correct user (self-heal)
            try {
                await fetch(`/api/communities/resolve?companyId=${companyId}`, { cache: "no-store" });
            } catch {}
            const res = await fetch(`/api/sender-identity?companyId=${companyId}`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setSenderIdentity({
                    displayName: data.display_name ?? null,
                    mailUsername: data.mail_username ?? null,
                    setupComplete: Boolean(data.setupComplete),
                });
            }
        } finally {
            setLoadingSenderIdentity(false);
        }
    }, [companyId]);

    // Optimistic seed from localStorage to avoid false banners before API returns
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem(`mm:settings:${companyId}`);
            if (!raw) return;
            const saved = JSON.parse(raw) as Record<string, unknown>;
            const displayName = typeof saved.displayName === "string" && saved.displayName.length > 0 ? saved.displayName : null;
            const username = typeof saved.username === "string" && saved.username.length > 0 ? saved.username : null;
            if (displayName && username) {
                setSenderIdentity({ displayName, mailUsername: username, setupComplete: true });
            }
        } catch {}
    }, [companyId]);

    useEffect(() => {
        void refreshSenderIdentity();
    }, [refreshSenderIdentity]);

    // Refresh sender identity when page becomes visible (e.g., returning from settings)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void refreshSenderIdentity();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [refreshSenderIdentity]);

    const [subject, setSubjectState] = useState("");
    const [previewText, setPreviewTextState] = useState("");
    const [automationBlueprint, setAutomationBlueprint] = useState<AutomationBlueprintPrefill | null>(null);
    const [showAutomationBanner, setShowAutomationBanner] = useState(false);
    const dismissAutomationBanner = useCallback(() => setShowAutomationBanner(false), []);
    const [sendMode, setSendMode] = useState<"manual" | "automation">("manual");
    const [triggerEvent, setTriggerEvent] = useState<string | null>(null);
    const [triggerDelayValue, setTriggerDelayValue] = useState<number>(0);
    const [triggerDelayUnit, setTriggerDelayUnit] = useState<"minutes" | "hours" | "days">("minutes");
    const [automationStatus, setAutomationStatus] = useState<"draft" | "active" | "paused" | "archived">("draft");
    const [automationSequenceId, setAutomationSequenceId] = useState<number | null>(null);
    const [automationTriggerMetadata, setAutomationTriggerMetadata] = useState<CourseStepMetadata | null>(null);
    const [automationReturnTo, setAutomationReturnTo] = useState<string | null>(null);

    // Start flow / drafts modals
    const [showStartSourceModal, setShowStartSourceModal] = useState<boolean>(false);
    const [showDraftsModal, setShowDraftsModal] = useState<boolean>(false);

    // Autosave gating
    const [userInteracted, setUserInteracted] = useState<boolean>(false);
    const prefillActiveRef = useRef<boolean>(false);
    const automationPrefillAppliedRef = useRef<boolean>(false);
    const [showLeavePrompt, setShowLeavePrompt] = useState<boolean>(false);
    const pendingHrefRef = useRef<string | null>(null);

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

    // Email Styles state
    const [showStylePanel, setShowStylePanel] = useState(false);
    const [emailStyles, setEmailStyles] = useState<EmailStyles>(defaultEmailStyles);

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

    // Existing campaign editing state (must be defined before autosave hook)
    const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);
    const isEditingExistingCampaign = editingCampaignId !== null;

    // Draft auto-save integration
    const {
        status: draftStatus,
        lastSaved,
        hasUnsavedChanges,
        draftId,
        saveDraft,
        loadDraft,
        deleteDraft,
    } = useDraftAutoSave({
        editor,
        companyId,
        subject,
        previewText,
        emailStyles,
        debounceMs: 2000,
        enabled: !isEditingExistingCampaign,
        canAutoSave: userInteracted,
    });

    // Load most recent draft on mount — removed (we now require explicit draft selection)

    // Collaboration integration
    const {
        synced: collaborationSynced,
        collaborators,
    } = useCollaboration({
        editor,
        documentId: `campaign:${companyId}:new`,
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

    // Effects: load automation blueprint context from session storage
    useEffect(() => {
        if (typeof window === "undefined") return;
        const raw = sessionStorage.getItem("automation_blueprint_prefill");
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as AutomationBlueprintPrefill;
            sessionStorage.removeItem("automation_blueprint_prefill");
            setAutomationBlueprint(parsed);
            setShowAutomationBanner(true);
            setSendMode("automation");
            setAutomationStatus("active");
            if (!subject && parsed.prefillSubject) {
                setSubjectState(parsed.prefillSubject);
            }
            if (!previewText && parsed.prefillPreview) {
                setPreviewTextState(parsed.prefillPreview);
            }
            prefillActiveRef.current = true;
        } catch (error) {
            console.error("Failed to parse automation blueprint prefill:", error);
            sessionStorage.removeItem("automation_blueprint_prefill");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subject, previewText]);

    // Effects: editor content prefill from draft or template
    // Also support Automations presets: when navigating from the Automations page,
    // the URL may include `prefillSubject` and/or `prefillPreview`. We set them once
    // here so they appear immediately in the editor. This also prevents the draft
    // autoload effect (below) from overriding, since it only runs when subject is empty.
    useEffect(() => {
        // Only apply if fields are empty to avoid clobbering user edits
        const s = searchParams.get("prefillSubject");
        const p = searchParams.get("prefillPreview");
        const seq = searchParams.get("automationSequenceId");
        if (s && !subject) setSubjectState(s);
        if (p && !previewText) setPreviewTextState(p);
        if (seq) {
            const parsed = Number(seq);
            if (!Number.isNaN(parsed)) {
                setAutomationSequenceId(parsed);
                setSendMode("automation");
                setAutomationStatus("active");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    useEffect(() => {
        if (!automationEditor) return;
        if (automationPrefillAppliedRef.current) return;

        const seq = searchParams.get("automationSequenceId");
        if (seq) {
            const parsed = Number(seq);
            if (!Number.isNaN(parsed)) {
                setAutomationSequenceId(parsed);
                setSendMode("automation");
                setAutomationStatus("active");
            }
        }

        const returnToParam = searchParams.get("returnTo");
        if (returnToParam) {
            setAutomationReturnTo(returnToParam);
        }

        const delayValueParam = searchParams.get("stepDelayValue");
        if (delayValueParam !== null) {
            const parsedDelay = Number.parseInt(delayValueParam, 10);
            if (!Number.isNaN(parsedDelay)) {
                setTriggerDelayValue(Math.max(0, parsedDelay));
            }
        }

        const delayUnitParam = searchParams.get("stepDelayUnit");
        if (delayUnitParam && ["minutes", "hours", "days"].includes(delayUnitParam)) {
            setTriggerDelayUnit(delayUnitParam as "minutes" | "hours" | "days");
        }

        setShowStartSourceModal(false);
        setShowDraftsModal(false);
        automationPrefillAppliedRef.current = true;
    }, [automationEditor, searchParams, setAutomationSequenceId, setAutomationStatus, setSendMode, setTriggerDelayUnit, setTriggerDelayValue]);

    // Effects: editor content prefill from draft or template
    useEffect(() => {
        if (!editor) return;
        const draftContent = sessionStorage.getItem("draft_email_content");
        if (draftContent) {
            prefillActiveRef.current = true;
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
                        prefillActiveRef.current = true;
                        editor.commands.setContent(t.html_content);
                    }
                })
                .catch(() => {});
        }
    }, [editor, searchParams]);

    // Load existing campaign for editing when campaignId is present
    useEffect(() => {
        const cid = searchParams.get("campaignId");
        if (!cid) return;
        const parsed = Number(cid);
        if (!Number.isFinite(parsed)) return;
        if (!editor) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/campaigns/${parsed}`);
                if (!res.ok) return;
                const data = await res.json();
                const c = data.campaign as any;
                if (!c) return;
                prefillActiveRef.current = true;
                setEditingCampaignId(parsed);
                if (typeof c.subject === 'string') setSubjectState(c.subject);
                if (typeof c.preview_text === 'string') setPreviewTextState(c.preview_text);
                if (typeof c.html_content === 'string') {
                    editor.commands.setContent(c.html_content);
                    const extractedStyles = extractEmailStyles(c.html_content);
                    if (extractedStyles) setEmailStyles(extractedStyles);
                }
                const sm = c.send_mode === 'automation' ? 'automation' : 'manual';
                setSendMode(sm);
                if (sm === 'automation') {
                    setTriggerEvent(c.trigger_event ?? null);
                    if (typeof c.trigger_delay_value === 'number') setTriggerDelayValue(Math.max(0, Math.floor(c.trigger_delay_value)));
                    if (typeof c.trigger_delay_unit === 'string' && ["minutes","hours","days"].includes(c.trigger_delay_unit)) setTriggerDelayUnit(c.trigger_delay_unit);
                    if (typeof c.automation_status === 'string') setAutomationStatus(c.automation_status);
                    if (typeof c.automation_sequence_id === 'number') setAutomationSequenceId(c.automation_sequence_id);
                }
            } finally {
                setTimeout(() => { prefillActiveRef.current = false; }, 100);
            }
        })();
        return () => { cancelled = true; };
    }, [searchParams, editor]);

    useEffect(() => {
        if (!automationEditor) return;
        if (!automationSequenceId) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/automations/sequences/${automationSequenceId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                const eventCode = data?.sequence?.trigger_event;
                if (typeof eventCode === "string" && eventCode.length > 0) {
                    setTriggerEvent(eventCode);
                }
            } catch (err) {
                console.error("Failed to load automation sequence", err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [automationEditor, automationSequenceId]);

    useEffect(() => {
        if (!triggerEvent) {
            setAutomationTriggerMetadata(null);
            return;
        }
        if (!isCourseAutomationEvent(triggerEvent)) {
            setAutomationTriggerMetadata(null);
        }
    }, [triggerEvent]);

    // Start source modal logic and deep-link handlers
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (automationEditor) {
            setShowStartSourceModal(false);
            setShowDraftsModal(false);
            return;
        }
        // If editing an existing campaign, skip start/drafts selection
        if (searchParams.get("campaignId")) {
            setShowStartSourceModal(false);
            setShowDraftsModal(false);
            return;
        }
        const source = searchParams.get("source");
        const directDraftId = searchParams.get("draftId");
        const hasSessionPrefill = Boolean(sessionStorage.getItem("draft_email_content"));
        const hasQueryPrefill = Boolean(searchParams.get("prefillSubject") || searchParams.get("prefillPreview") || searchParams.get("templateId"));

        if (directDraftId) {
            void (async () => {
                await openDraftById(directDraftId);
                setShowStartSourceModal(false);
            })();
            return;
        }
        if (source === "blank") {
            setShowStartSourceModal(false);
            return;
        }
        if (source === "drafts") {
            setShowDraftsModal(true);
            setShowStartSourceModal(false);
            return;
        }
        if (hasSessionPrefill || hasQueryPrefill) {
            setShowStartSourceModal(false);
            return;
        }
        setShowStartSourceModal(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [automationEditor, searchParams]);

    // Open a draft by id (helper for modal and deep-link)
    const openDraftById = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/drafts/${id}?companyId=${companyId}`);
            if (!res.ok) return;
            const data = await res.json();
            const d = data.draft as { id: string; subject?: string; preview_text?: string; html_content?: string };
            prefillActiveRef.current = true;
            await loadDraft(id);
            if (d.subject) setSubjectState(d.subject);
            if (d.preview_text) setPreviewTextState(d.preview_text);
            if (d.html_content) {
                const extractedStyles = extractEmailStyles(d.html_content);
                if (extractedStyles) setEmailStyles(extractedStyles);
            }
            setTimeout(() => { prefillActiveRef.current = false; }, 100);
        } catch (e) {
            console.error('Failed to open draft', e);
        }
    }, [companyId, loadDraft, setEmailStyles]);

    const deleteDraftById = useCallback(async (id: string) => {
        try {
            await fetch(`/api/drafts/${id}?companyId=${companyId}`, { method: 'DELETE' });
        } catch (e) {
            console.error('Failed to delete draft', e);
        }
    }, [companyId]);

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

    // Wrap setters to mark interaction after prefill
    const setSubject = useCallback((s: string) => {
        setSubjectState(s);
        if (!prefillActiveRef.current) setUserInteracted(true);
    }, []);
    const setPreviewText = useCallback((s: string) => {
        setPreviewTextState(s);
        if (!prefillActiveRef.current) setUserInteracted(true);
    }, []);

    // Helper for applying prefill HTML (templates/automation)
    const applyPrefillHtml = useCallback((html: string, opts?: { subject?: string; preview?: string }) => {
        if (!editor) return;
        prefillActiveRef.current = true;
        editor.commands.setContent(html || "");
        if (opts?.subject !== undefined) setSubjectState(opts.subject);
        if (opts?.preview !== undefined) setPreviewTextState(opts.preview);
        setTimeout(() => { prefillActiveRef.current = false; }, 0);
    }, [editor]);

    // Consider any editor update (outside prefill) as interaction
    useEffect(() => {
        if (!editor) return;
        const onUpdate = () => {
            if (!prefillActiveRef.current) setUserInteracted(true);
        };
        editor.on('update', onUpdate);
        return () => { editor.off('update', onUpdate); };
    }, [editor]);

    // Intercept anchor navigations to show leave prompt when there are changes
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;
            const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
            if (!anchor) return;
            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('#') || anchor.target === '_blank') return;
            // Determine if we should prompt
            const shouldPrompt = (userInteracted || hasUnsavedChanges);
            if (!shouldPrompt) return;
            // Prevent navigation and show prompt
            e.preventDefault();
            pendingHrefRef.current = anchor.href;
            setShowLeavePrompt(true);
        };
        document.addEventListener('click', handler, true);
        return () => document.removeEventListener('click', handler, true);
    }, [userInteracted, hasUnsavedChanges]);

    // Leave prompt modal component (inline)
    function LeavePromptModal() {
        if (!showLeavePrompt) return null;
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex" onClick={() => setShowLeavePrompt(false)}>
                <div className="m-auto w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="px-5 py-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold">Save as draft?</h3>
                        <p className="text-sm text-white/60 mt-1">You have unsaved changes. Save this as a draft before leaving?</p>
                    </div>
                    <div className="p-4 flex items-center justify-end gap-2">
                        <button
                            className="px-3 py-1.5 rounded border border-white/20 text-white hover:bg-white/10 text-sm"
                            onClick={() => setShowLeavePrompt(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-3 py-1.5 rounded text-white bg-red-600/80 hover:bg-red-600 text-sm"
                            onClick={async () => {
                                try {
                                    if (draftId) {
                                        await deleteDraft();
                                    }
                                } catch {}
                                const href = pendingHrefRef.current;
                                setShowLeavePrompt(false);
                                pendingHrefRef.current = null;
                                if (href) window.location.href = href;
                            }}
                        >
                            Discard
                        </button>
                        <button
                            className="px-3 py-1.5 rounded text-white bg-[#FA4616] hover:bg-[#E23F14] text-sm"
                            onClick={async () => {
                                // Persist as campaign draft so it appears in Campaigns and Drafts modal
                                if (isEditingExistingCampaign) {
                                    await saveChanges();
                                } else {
                                    await createDraftCampaign();
                                }
                                const href = pendingHrefRef.current;
                                setShowLeavePrompt(false);
                                pendingHrefRef.current = null;
                                if (href) window.location.href = href;
                            }}
                        >
                            Save as draft
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Audience summary + counts
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                setLoadingAudience(true);
                const res = await fetch(`/api/members?companyId=${companyId}&limit=1`);
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
    }, [companyId]);

    // Fetch 30d active when needed
    useEffect(() => {
        let ignore = false;
        (async () => {
            if (audienceMode !== "active_recent") return;
            try {
                const res = await fetch(`/api/members?companyId=${companyId}&status=active&lastActiveDays=30&limit=1`);
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
    }, [audienceMode, companyId]);

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
                            `/api/members?companyId=${companyId}&status=active&tier=${encodeURIComponent(t)}&limit=1`
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
    }, [audienceMode, selectedTiers, companyId, counts.tierActiveCounts]);

    // Actions
    const create = useCallback(async () => {
        if (!subject.trim()) {
            toast.error("Please add a subject line");
            return;
        }
        if (sendMode === "automation" && !triggerEvent) {
            toast.error("Select an automation trigger event");
            return;
        }
        let courseMetadata: CourseStepMetadata | null = null;
        if (sendMode === "automation" && triggerEvent && isCourseAutomationEvent(triggerEvent)) {
            const meta = automationTriggerMetadata;
            if (!meta || !meta.courseId) {
                toast.error("Select a course for this trigger");
                return;
            }
            const eventCode = triggerEvent as CourseStepMetadata["triggerKind"];
            const requiresLesson =
                eventCode === "course_lesson_started" ||
                eventCode === "course_lesson_completed" ||
                eventCode === "course_lesson_not_started_after_x_days";
            const requiresChapter = requiresLesson || eventCode === "course_chapter_completed";
            if (requiresChapter && !meta.chapterId) {
                toast.error("Select a chapter for this course trigger");
                return;
            }
            if (requiresLesson && !meta.lessonId) {
                toast.error("Select a lesson for this course trigger");
                return;
            }
            if (eventCode === "course_lesson_not_started_after_x_days") {
                if (!meta.waitDays || meta.waitDays <= 0) {
                    toast.error("Set the number of days before triggering");
                    return;
                }
            }
            courseMetadata = { ...meta, triggerKind: eventCode };
        }
        try {
            const resolveRes = await fetch(`/api/communities/resolve?companyId=${companyId}`);
            const { id: community_id } = resolveRes.ok ? await resolveRes.json() : { id: 1 };
            const audiencePayload = (() => {
                if (audienceMode === "all_active") return { type: "all_active" } as const;
                if (audienceMode === "active_recent") return { type: "active_recent", days: 30 } as const;
                return { type: "tiers", tiers: selectedTiers } as const;
            })();
            // Embed styles in HTML before saving
            let htmlContent = editor?.getHTML() ?? "";
            if (!htmlContent || htmlContent.trim().length === 0) {
                htmlContent = "<p></p>";
            }
            const htmlWithStyles = embedStylesInHTML(htmlContent, emailStyles);
            const normalizedDelayValue =
                sendMode === "automation" ? Math.max(0, Math.floor(triggerDelayValue ?? 0)) : null;

            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    preview_text: previewText,
                    html_content: htmlWithStyles,
                    community_id,
                    audience: audiencePayload,
                    send_mode: sendMode,
                    trigger_event: triggerEvent,
                    trigger_delay_value: normalizedDelayValue,
                    trigger_delay_unit: sendMode === "automation" ? triggerDelayUnit : null,
                    automation_status: automationStatus,
                    quiet_hours_enabled: quietHoursEnabled,
                    quiet_hours_start: 9,
                    quiet_hours_end: 20,
                    automation_sequence_id: sendMode === "automation" ? automationSequenceId : null,
                    automation_trigger_metadata: courseMetadata,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                // If created from a draft, delete the draft to avoid clutter
                try {
                    if (draftId) {
                        await fetch(`/api/drafts/${draftId}?companyId=${companyId}`, { method: 'DELETE' });
                    }
                } catch {}
                if (sendMode === "automation" && automationSequenceId) {
                    try {
                        await fetch(`/api/automations/sequences/${automationSequenceId}/steps`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                campaignId: data.campaign.id,
                                delayValue: normalizedDelayValue,
                                delayUnit: triggerDelayUnit,
                                metadata: courseMetadata,
                            }),
                        });
                    } catch (stepError) {
                        console.error("Failed to attach campaign to automation sequence:", stepError);
                    }
                }
                toast.success("Campaign created successfully!");
                if (automationEditor && automationReturnTo) {
                    router.push(automationReturnTo);
                } else {
                    router.push(`/dashboard/${companyId}/campaigns/${data.campaign.id}`);
                }
            } else {
                toast.error("Failed to create campaign");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    }, [
        companyId,
        audienceMode,
        selectedTiers,
        subject,
        previewText,
        editor,
        router,
        emailStyles,
        sendMode,
        triggerEvent,
        triggerDelayValue,
        triggerDelayUnit,
        automationStatus,
        automationSequenceId,
        quietHoursEnabled,
        draftId,
        automationTriggerMetadata,
        automationEditor,
        automationReturnTo,
    ]);

    // Create a draft campaign record (no navigation)
    const createDraftCampaign = useCallback(async (): Promise<number | null> => {
        try {
            const resolveRes = await fetch(`/api/communities/resolve?companyId=${companyId}`);
            const { id: community_id } = resolveRes.ok ? await resolveRes.json() : { id: 1 };

            const htmlContent = editor?.getHTML() ?? "";
            const htmlWithStyles = embedStylesInHTML(htmlContent, emailStyles);
            const normalizedDelayValue =
                sendMode === "automation" ? Math.max(0, Math.floor(triggerDelayValue ?? 0)) : null;
            const effectiveSubject = subject?.trim() ? subject : "Untitled";

            const body: any = {
                subject: effectiveSubject,
                preview_text: previewText ?? "",
                html_content: htmlWithStyles,
                community_id,
                audience: { type: "all_active" },
                send_mode: sendMode,
                trigger_event: sendMode === 'automation' ? (triggerEvent ?? null) : null,
                trigger_delay_value: normalizedDelayValue,
                trigger_delay_unit: sendMode === 'automation' ? triggerDelayUnit : null,
                automation_status: sendMode === 'automation' ? automationStatus : null,
                quiet_hours_enabled: quietHoursEnabled,
                quiet_hours_start: 9,
                quiet_hours_end: 20,
                automation_sequence_id: sendMode === 'automation' ? (automationSequenceId ?? null) : null,
            };

            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) return null;
            const data = await res.json();
            const newId = Number(data?.campaign?.id ?? 0) || null;
            try {
                if (draftId) {
                    await fetch(`/api/drafts/${draftId}?companyId=${companyId}`, { method: 'DELETE' });
                }
            } catch {}
            if (newId) {
                toast.success('Draft saved');
            } else {
                toast.error('Failed to save draft');
            }
            return newId;
        } catch {
            toast.error('Error saving draft');
            return null;
        }
    }, [companyId, subject, previewText, editor, emailStyles, sendMode, triggerEvent, triggerDelayValue, triggerDelayUnit, automationStatus, automationSequenceId, quietHoursEnabled, draftId]);

    const saveChanges = useCallback(async () => {
        if (!isEditingExistingCampaign || !editingCampaignId) return;
        if (!subject.trim()) {
            toast.error("Please add a subject line");
            return;
        }
        try {
            // Embed styles in HTML before saving
            const htmlContent = editor?.getHTML() ?? "";
            const htmlWithStyles = embedStylesInHTML(htmlContent, emailStyles);

            const body: any = {
                subject,
                preview_text: previewText,
                html_content: htmlWithStyles,
                send_mode: sendMode,
            };
            if (sendMode === 'automation') {
                body.trigger_event = triggerEvent;
                body.trigger_delay_value = Math.max(0, Math.floor(triggerDelayValue ?? 0));
                body.trigger_delay_unit = triggerDelayUnit;
                body.automation_status = automationStatus;
                body.automation_sequence_id = automationSequenceId ?? null;
            }
            const res = await fetch(`/api/campaigns/${editingCampaignId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                toast.success('Draft saved');
            } else {
                toast.error('Failed to save draft');
            }
        } catch {
            toast.error('Error saving draft');
        }
    }, [isEditingExistingCampaign, editingCampaignId, subject, previewText, editor, emailStyles, sendMode, triggerEvent, triggerDelayValue, triggerDelayUnit, automationStatus, automationSequenceId]);

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

    /**
     * Insert a link placeholder into the editor
     */
    const addLink = useCallback(() => {
        if (!editor) return;
        
        // Get selected text if any to use as suggested text
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');
        
        // Insert link placeholder node
        editor.chain().focus().setLinkPlaceholder({ 
            suggestedText: selectedText || '' 
        }).run();
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
            if (!requireSubscriptionFeature("ai")) return;

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
                    body: JSON.stringify({ ...requestBody, companyId }),
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
            companyId,
            router,
            editor: (editor as any) ?? null,
            user,
            loadingUser,
            subscriptionStatus,
            refreshSubscriptionStatus,
            requireSubscriptionFeature,
            paywallReason,
            setPaywallReason,
            steps,
            currentStep,
            setCurrentStep,
            subject,
            setSubject,
            previewText,
            setPreviewText,
            automationBlueprint,
            showAutomationBanner,
            dismissAutomationBanner,
            sendMode,
            setSendMode,
            triggerEvent,
            setTriggerEvent,
            triggerDelayValue,
            setTriggerDelayValue,
            triggerDelayUnit,
            setTriggerDelayUnit,
            automationStatus,
            setAutomationStatus,
            automationSequenceId,
            setAutomationSequenceId,
            automationEditor,
            automationReturnTo,
            automationTriggerMetadata,
            setAutomationTriggerMetadata,
            draftStatus,
            lastSaved,
            hasUnsavedChanges,
            draftId,
            saveDraft,
            openDraftById,
            deleteDraftById,
            isEditingExistingCampaign,
            editingCampaignId,
            saveChanges,
            createDraftCampaign,
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
            showStartSourceModal,
            setShowStartSourceModal,
            showDraftsModal,
            setShowDraftsModal,
            applyPrefillHtml,
            showAiSidebar,
            setShowAiSidebar,
            aiMessages,
            aiSelectedText,
            setAiSelectedText,
            aiMode,
            setAiMode,
            aiStreaming,
            sendAiMessage,
            showStylePanel,
            setShowStylePanel,
            emailStyles,
            setEmailStyles,
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
            senderIdentity,
            loadingSenderIdentity,
            refreshSenderIdentity,
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
            companyId,
            router,
            editor,
            user,
            loadingUser,
            subscriptionStatus,
            refreshSubscriptionStatus,
            requireSubscriptionFeature,
            paywallReason,
            setPaywallReason,
            steps,
            currentStep,
            subject,
            previewText,
            automationBlueprint,
            showAutomationBanner,
            dismissAutomationBanner,
            sendMode,
            setSendMode,
            triggerEvent,
            setTriggerEvent,
            triggerDelayValue,
            setTriggerDelayValue,
            triggerDelayUnit,
            setTriggerDelayUnit,
            automationStatus,
            automationSequenceId,
            setAutomationStatus,
            setAutomationSequenceId,
            automationEditor,
            automationReturnTo,
            draftStatus,
            lastSaved,
            hasUnsavedChanges,
            draftId,
            saveDraft,
            openDraftById,
            deleteDraftById,
            isEditingExistingCampaign,
            editingCampaignId,
            saveChanges,
            createDraftCampaign,
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
            showStartSourceModal,
            showDraftsModal,
            applyPrefillHtml,
            showTestEmailDialog,
            showAiSidebar,
            aiMessages,
            aiSelectedText,
            aiMode,
            aiStreaming,
            sendAiMessage,
            showStylePanel,
            emailStyles,
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
            senderIdentity,
            loadingSenderIdentity,
            refreshSenderIdentity,
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

    return (
        <ComposerContext.Provider value={value}>
            {children}
            {/* Inline modal for leave prompt */}
            { /* eslint-disable-next-line react/jsx-no-undef */}
            <LeavePromptModal />
        </ComposerContext.Provider>
    );
}

export function useCampaignComposer() {
    const ctx = useContext(ComposerContext);
    if (!ctx) throw new Error("useCampaignComposer must be used within CampaignComposerProvider");
    return ctx;
}
