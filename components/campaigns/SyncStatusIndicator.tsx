/**
 * Visual indicator for sync and draft save status
 * Shows real-time feedback for auto-save and collaboration sync
 */

"use client";

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, Check, Loader2, AlertCircle, Users } from 'lucide-react';
import type { DraftStatus } from '@/lib/hooks/useDraftAutoSave';
import type { AwarenessUser } from '@/lib/collaboration/RealtimeProvider';

export type SyncStatusIndicatorProps = {
  // Draft save status
  draftStatus: DraftStatus;
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
  
  // Collaboration status
  collaborationSynced?: boolean;
  collaborators?: AwarenessUser[];
  
  // Display options
  showCollaborators?: boolean;
  compact?: boolean;
};

/**
 * Component that displays sync status with icons and text
 */
export function SyncStatusIndicator({
  draftStatus,
  lastSaved,
  hasUnsavedChanges = false,
  collaborationSynced = false,
  collaborators = [],
  showCollaborators = true,
  compact = false,
}: SyncStatusIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Update time ago display
  useEffect(() => {
    if (!lastSaved) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = now.getTime() - lastSaved.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (seconds < 5) {
        setTimeAgo('just now');
      } else if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else if (minutes < 60) {
        setTimeAgo(`${minutes}m ago`);
      } else if (hours < 24) {
        setTimeAgo(`${hours}h ago`);
      } else {
        setTimeAgo(lastSaved.toLocaleDateString());
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [lastSaved]);

  // Determine status icon and color
  const getStatusDisplay = () => {
    switch (draftStatus) {
      case 'saving':
        return {
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
          text: 'Saving...',
          color: 'text-blue-400',
        };
      case 'saved':
        return {
          icon: <Check className="w-3.5 h-3.5" />,
          text: lastSaved ? `Saved ${timeAgo}` : 'Saved',
          color: 'text-green-400',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          text: 'Save failed',
          color: 'text-red-400',
        };
      default:
        if (hasUnsavedChanges) {
          return {
            icon: <Cloud className="w-3.5 h-3.5" />,
            text: 'Unsaved changes',
            color: 'text-yellow-400',
          };
        }
        return {
          icon: collaborationSynced ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />,
          text: lastSaved ? `Saved ${timeAgo}` : 'Ready',
          color: 'text-white/60',
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="flex items-center gap-3">
      {/* Save status */}
      <div className={`flex items-center gap-1.5 text-sm ${status.color}`}>
        {status.icon}
        {!compact && <span>{status.text}</span>}
      </div>

      {/* Collaboration indicator */}
      {showCollaborators && collaborators.length > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-white/60">
          <div className="w-px h-4 bg-white/10" />
          <Users className="w-3.5 h-3.5" />
          <span>{collaborators.length}</span>
          {!compact && (
            <div className="flex -space-x-2">
              {collaborators.slice(0, 3).map((user) => (
                <div
                  key={user.userId}
                  className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center text-xs font-medium"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {collaborators.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-xs">
                  +{collaborators.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sync indicator dot */}
      {collaborationSynced && (
        <div className="relative">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full opacity-50 animate-ping" />
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for toolbar/header
 */
export function CompactSyncStatus(props: SyncStatusIndicatorProps) {
  return <SyncStatusIndicator {...props} compact={true} />;
}
