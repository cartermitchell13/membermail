/**
 * Hook for auto-saving drafts with debouncing
 * Automatically saves editor content to Supabase at regular intervals
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@tiptap/core';
import { toast } from 'sonner';
import type { EmailStyles } from '@/components/email-builder/ui/EmailStylePanel';

export type DraftData = {
  subject: string;
  previewText: string;
  htmlContent: string;
  editorJson: any;
  emailStyles?: EmailStyles;
};

export type DraftAutoSaveConfig = {
  editor: Editor | null;
  draftId?: string;
  campaignId?: string;
  companyId: string;
  subject: string;
  previewText: string;
  emailStyles?: EmailStyles;
  debounceMs?: number; // Default 2000ms (2 seconds)
  enabled?: boolean; // Default true
  canAutoSave?: boolean; // Optional: gate auto-save until user interacts
  onSaveSuccess?: (draftId: string) => void;
  onSaveError?: (error: Error) => void;
};

export type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useDraftAutoSave(config: DraftAutoSaveConfig) {
  const {
    editor,
    draftId: initialDraftId,
    campaignId,
    companyId,
    subject,
    previewText,
    emailStyles,
    debounceMs = 2000,
    enabled = true,
    canAutoSave = true,
    onSaveSuccess,
    onSaveError,
  } = config;

  // State for tracking save status
  const [status, setStatus] = useState<DraftStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>(initialDraftId);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs for debouncing and latest values
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  const isLoadingDraft = useRef(false);
  const latestValuesRef = useRef({ subject, previewText, draftId, campaignId, emailStyles });
  
  // Update ref with latest values
  useEffect(() => {
    latestValuesRef.current = { subject, previewText, draftId, campaignId, emailStyles };
  }, [subject, previewText, draftId, campaignId, emailStyles]);

  /**
   * Save draft to the server
   */
  const saveDraft = useCallback(async () => {
    if (!editor || !enabled) return;

    try {
      setStatus('saving');
      
      const { subject: currentSubject, previewText: currentPreviewText, draftId: currentDraftId, campaignId: currentCampaignId, emailStyles: currentEmailStyles } = latestValuesRef.current;
      
      const draftData: DraftData = {
        subject: currentSubject,
        previewText: currentPreviewText,
        htmlContent: editor.getHTML(),
        editorJson: editor.getJSON(),
        emailStyles: currentEmailStyles,
      };

      const response = await fetch('/api/drafts', {
        method: currentDraftId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDraftId,
          campaignId: currentCampaignId,
          companyId,
          ...draftData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      const result = await response.json();
      const savedDraftId = result.draft?.id;

      if (savedDraftId && !currentDraftId) {
        setDraftId(savedDraftId);
        onSaveSuccess?.(savedDraftId);
      }

      setStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      // Reset to idle after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Draft save error:', error);
      setStatus('error');
      onSaveError?.(error as Error);
      
      // Reset to idle after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    }
  }, [editor, enabled, companyId, onSaveSuccess, onSaveError]);

  /**
   * Schedule a debounced save
   */
  const scheduleSave = useCallback(() => {
    if (!enabled || !canAutoSave) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setHasUnsavedChanges(true);

    // Schedule new save
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, debounceMs);
  }, [enabled, debounceMs, saveDraft]);

  /**
   * Force immediate save (bypass debounce)
   */
  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveDraft();
  }, [saveDraft]);

  /**
   * Load existing draft
   */
  const loadDraft = useCallback(async (id: string) => {
    try {
      isLoadingDraft.current = true;
      const response = await fetch(`/api/drafts/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load draft');
      }

      const result = await response.json();
      const draft = result.draft;

      if (draft && editor) {
        // Load content into editor
        if (draft.editor_json) {
          editor.commands.setContent(draft.editor_json);
        }

        // Caller should handle subject/preview text
        setDraftId(draft.id);
        setLastSaved(new Date(draft.updated_at));
        setHasUnsavedChanges(false);
        setStatus('idle');
      }
      
      // Reset loading flag after a short delay to ignore the update event from setContent
      setTimeout(() => {
        isLoadingDraft.current = false;
        isFirstRender.current = false; // Also reset first render flag so edits are tracked
      }, 100);
    } catch (error) {
      console.error('Draft load error:', error);
      toast.error('Failed to load draft');
      isLoadingDraft.current = false;
    }
  }, [editor]);

  /**
   * Delete draft
   */
  const deleteDraft = useCallback(async () => {
    if (!draftId) return;

    try {
      const response = await fetch(`/api/drafts/${draftId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete draft');
      }

      setDraftId(undefined);
      setLastSaved(null);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Draft delete error:', error);
      toast.error('Failed to delete draft');
    }
  }, [draftId]);

  // Auto-save when content changes
  useEffect(() => {
    if (!editor || !enabled) return;

    const handleUpdate = () => {
      // Ignore updates while loading a draft
      if (isLoadingDraft.current) {
        return;
      }
      
      // Skip auto-save on first render
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      if (!canAutoSave) {
        setHasUnsavedChanges(true);
        return;
      }
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      setHasUnsavedChanges(true);
      saveTimeoutRef.current = setTimeout(() => saveDraft(), debounceMs);
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, enabled, canAutoSave, debounceMs, saveDraft]);

  // Auto-save when subject or preview text changes
  useEffect(() => {
    if (isFirstRender.current || !enabled || !canAutoSave) return;
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, previewText]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Save before leaving page if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && enabled) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        // Do not save here to avoid silent saves; let caller handle route-change prompts
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, enabled]);

  return {
    status,
    lastSaved,
    draftId,
    hasUnsavedChanges,
    saveDraft: forceSave,
    loadDraft,
    deleteDraft,
  };
}
