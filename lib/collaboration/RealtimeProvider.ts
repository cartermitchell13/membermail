/**
 * Real-time collaboration provider using Supabase Realtime + Yjs
 * This enables live sync between multiple users editing the same document
 */

import * as Y from 'yjs';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

export type AwarenessUser = {
  userId: string;
  name: string;
  color: string;
  cursor?: { from: number; to: number };
};

export type CollaborationConfig = {
  documentId: string;
  userId: string;
  userName: string;
  onSync?: (synced: boolean) => void;
  onUsersChange?: (users: AwarenessUser[]) => void;
};

/**
 * Provider that syncs Yjs document state via Supabase Realtime
 * Uses broadcast for instant updates and presence for user awareness
 */
export class RealtimeCollaborationProvider {
  private doc: Y.Doc;
  private channel: RealtimeChannel | null = null;
  private config: CollaborationConfig;
  private userColor: string;
  private awareness: Map<string, AwarenessUser> = new Map();
  private isSynced = false;
  private updateHandler: ((update: Uint8Array, origin: any) => void) | null = null;

  constructor(doc: Y.Doc, config: CollaborationConfig) {
    this.doc = doc;
    this.config = config;
    // Generate a consistent color for this user
    this.userColor = this.generateColor(config.userId);
  }

  /**
   * Connect to the realtime channel and start syncing
   */
  async connect(): Promise<void> {
    const supabase = getBrowserSupabaseClient();
    const channelName = `collaboration:${this.config.documentId}`;

    // Create or join the realtime channel
    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: this.config.userId },
      },
    });

    // Handle incoming document updates from other clients
    this.channel.on('broadcast', { event: 'doc-update' }, (payload) => {
      if (payload.payload?.userId === this.config.userId) return; // Ignore own updates
      
      const updateArray = this.base64ToUint8Array(payload.payload.update);
      // Apply remote update to local document (origin set to 'remote' to avoid echo)
      Y.applyUpdate(this.doc, updateArray, 'remote');
    });

    // Handle sync requests (when a new user joins)
    this.channel.on('broadcast', { event: 'sync-request' }, async (payload) => {
      // Send current state to the requesting user
      const state = Y.encodeStateAsUpdate(this.doc);
      await this.channel?.send({
        type: 'broadcast',
        event: 'sync-response',
        payload: {
          update: this.uint8ArrayToBase64(state),
          userId: this.config.userId,
          targetUserId: payload.payload.userId,
        },
      });
    });

    // Handle sync responses
    this.channel.on('broadcast', { event: 'sync-response' }, (payload) => {
      // Only process if this response is for us
      if (payload.payload.targetUserId !== this.config.userId) return;
      
      const updateArray = this.base64ToUint8Array(payload.payload.update);
      Y.applyUpdate(this.doc, updateArray, 'remote');
      
      this.isSynced = true;
      this.config.onSync?.(true);
    });

    // Track user presence for awareness
    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel?.presenceState() || {};
      this.updateAwareness(state);
    });

    this.channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      this.updateAwareness(newPresences);
    });

    this.channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((presence: any) => {
        this.awareness.delete(presence.userId);
      });
      this.notifyAwarenessChange();
    });

    // Subscribe to the channel
    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track our presence
        await this.channel?.track({
          userId: this.config.userId,
          name: this.config.userName,
          color: this.userColor,
          online_at: new Date().toISOString(),
        });

        // Request initial sync from other clients
        await this.channel?.send({
          type: 'broadcast',
          event: 'sync-request',
          payload: { userId: this.config.userId },
        });

        // If no response after 2 seconds, consider ourselves synced
        setTimeout(() => {
          if (!this.isSynced) {
            this.isSynced = true;
            this.config.onSync?.(true);
          }
        }, 2000);
      }
    });

    // Listen to local document changes and broadcast them
    this.updateHandler = (update: Uint8Array, origin: any) => {
      // Only broadcast updates that originated locally (not from remote)
      if (origin === 'remote') return;

      this.channel?.send({
        type: 'broadcast',
        event: 'doc-update',
        payload: {
          update: this.uint8ArrayToBase64(update),
          userId: this.config.userId,
        },
      });
    };

    this.doc.on('update', this.updateHandler);
  }

  /**
   * Disconnect from the realtime channel
   */
  async disconnect(): Promise<void> {
    if (this.updateHandler) {
      this.doc.off('update', this.updateHandler);
      this.updateHandler = null;
    }

    if (this.channel) {
      await this.channel.untrack();
      await this.channel.unsubscribe();
      this.channel = null;
    }

    this.isSynced = false;
    this.config.onSync?.(false);
  }

  /**
   * Update cursor position in awareness
   */
  updateCursor(from: number, to: number): void {
    if (!this.channel) return;

    this.channel.track({
      userId: this.config.userId,
      name: this.config.userName,
      color: this.userColor,
      cursor: { from, to },
      online_at: new Date().toISOString(),
    });
  }

  /**
   * Get current awareness state (connected users)
   */
  getAwareness(): AwarenessUser[] {
    return Array.from(this.awareness.values());
  }

  // Private helper methods

  private updateAwareness(presences: any): void {
    // Clear existing awareness
    this.awareness.clear();
    
    // Supabase presence returns an object where each key is a presence key
    // and the value is an array of presence states
    Object.values(presences).forEach((presenceValue: any) => {
      // presenceValue might be an array or a single object
      const presenceArray = Array.isArray(presenceValue) ? presenceValue : [presenceValue];
      
      presenceArray.forEach((presence: any) => {
        if (!presence || presence.userId === this.config.userId) return; // Skip self

        this.awareness.set(presence.userId, {
          userId: presence.userId,
          name: presence.name || 'Unknown',
          color: presence.color || '#999999',
          cursor: presence.cursor,
        });
      });
    });

    this.notifyAwarenessChange();
  }

  private notifyAwarenessChange(): void {
    this.config.onUsersChange?.(this.getAwareness());
  }

  private generateColor(userId: string): string {
    // Generate a consistent color based on userId
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  private uint8ArrayToBase64(uint8Array: Uint8Array): string {
    // Convert Uint8Array to base64 string for transmission
    const binary = String.fromCharCode(...uint8Array);
    return btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    // Convert base64 string back to Uint8Array
    const binary = atob(base64);
    const uint8Array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      uint8Array[i] = binary.charCodeAt(i);
    }
    return uint8Array;
  }
}
