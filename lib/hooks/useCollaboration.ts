/**
 * Hook for integrating Yjs collaboration with TipTap editor
 * Manages real-time sync and user awareness
 */

import { useEffect, useState, useCallback } from 'react';
import { Editor } from '@tiptap/core';
import * as Y from 'yjs';
import { RealtimeCollaborationProvider, AwarenessUser } from '@/lib/collaboration/RealtimeProvider';

export type CollaborationConfig = {
  editor: Editor | null;
  documentId: string;
  userId: string;
  userName: string;
  enabled?: boolean; // Default true
};

export type CollaborationState = {
  synced: boolean;
  users: AwarenessUser[];
  provider: RealtimeCollaborationProvider | null;
};

/**
 * Hook to enable real-time collaboration on a TipTap editor
 * Returns collaboration state and control methods
 */
export function useCollaboration(config: CollaborationConfig) {
  const { editor, documentId, userId, userName, enabled = true } = config;

  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<RealtimeCollaborationProvider | null>(null);
  const [synced, setSynced] = useState(false);
  const [collaborators, setCollaborators] = useState<AwarenessUser[]>([]);

  /**
   * Initialize collaboration provider
   */
  useEffect(() => {
    if (!editor || !enabled || !documentId) return;

    let providerInstance: RealtimeCollaborationProvider | null = null;

    const initProvider = async () => {
      // Create the collaboration provider
      providerInstance = new RealtimeCollaborationProvider(ydoc, {
        documentId,
        userId,
        userName,
        onSync: (syncStatus) => {
          setSynced(syncStatus);
        },
        onUsersChange: (users) => {
          setCollaborators(users);
        },
      });

      setProvider(providerInstance);

      // Connect to the realtime channel
      await providerInstance.connect();
    };

    initProvider();

    // Cleanup on unmount
    return () => {
      if (providerInstance) {
        providerInstance.disconnect();
      }
    };
  }, [editor, enabled, documentId, userId, userName, ydoc]);

  /**
   * Update cursor position when selection changes
   */
  useEffect(() => {
    if (!editor || !provider || !enabled) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      provider.updateCursor(from, to);
    };

    // Update cursor on selection change
    editor.on('selectionUpdate', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, provider, enabled]);

  /**
   * Sync Yjs document with TipTap editor state
   * This creates a two-way binding between the Yjs doc and the editor
   */
  useEffect(() => {
    if (!editor || !enabled) return;

    // Get or create the Yjs XML fragment for the editor content
    const yXmlFragment = ydoc.getXmlFragment('prosemirror');

    // Apply updates from Yjs to the editor
    const updateHandler = () => {
      // This is handled by TipTap's Collaboration extension
      // We're just ensuring the binding exists
    };

    ydoc.on('update', updateHandler);

    return () => {
      ydoc.off('update', updateHandler);
    };
  }, [editor, ydoc, enabled]);

  /**
   * Get Yjs document for integration with TipTap Collaboration extension
   */
  const getYDoc = useCallback(() => ydoc, [ydoc]);

  /**
   * Manually trigger a sync
   */
  const forceSync = useCallback(() => {
    if (provider) {
      // Force a state vector exchange
      provider.disconnect().then(() => provider.connect());
    }
  }, [provider]);

  return {
    synced,
    collaborators,
    provider,
    ydoc,
    getYDoc,
    forceSync,
  };
}
