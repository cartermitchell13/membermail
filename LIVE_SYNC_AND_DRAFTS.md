# Live Sync and Draft Mode - Documentation

## Overview

This document describes the live sync and draft mode features implemented in the email/newsletter builder. These features provide:

- **Auto-saving drafts**: Automatically saves your work as you type with debouncing
- **Real-time collaboration**: Multiple users can edit the same document simultaneously
- **Sync indicators**: Visual feedback showing save status and connected collaborators
- **Draft recovery**: Automatically recover unsaved work

## Architecture

### Components

#### 1. Database Layer (`supabase/migrations/create_drafts.sql`)
- **Drafts table**: Stores draft states with user context
- **Automatic timestamps**: Tracks when drafts are created/updated
- **Row Level Security**: Ensures users can only access their own drafts
- **Yjs state storage**: Supports collaborative document state

#### 2. Real-time Sync Provider (`lib/collaboration/RealtimeProvider.ts`)
- Uses **Supabase Realtime** for WebSocket connections
- Implements **Yjs** document synchronization
- Provides **user awareness** (cursor positions, active users)
- Handles connection/disconnection gracefully

#### 3. Auto-save Hook (`lib/hooks/useDraftAutoSave.ts`)
- **Debounced saving**: Prevents excessive API calls (default: 2 seconds)
- **Status tracking**: `idle`, `saving`, `saved`, `error`
- **Unsaved changes warning**: Prompts before leaving page
- **Force save**: Can manually trigger immediate save

#### 4. Collaboration Hook (`lib/hooks/useCollaboration.ts`)
- Integrates Yjs with TipTap editor
- Manages user awareness (who's editing, cursor positions)
- Real-time cursor sync
- Conflict-free collaborative editing

#### 5. Sync Status Indicator (`components/campaigns/SyncStatusIndicator.tsx`)
- Visual indicator in toolbar showing:
  - Save status (saving, saved, error)
  - Last saved timestamp
  - Connected collaborators with avatars
  - Real-time sync pulse

#### 6. API Routes
- `POST /api/drafts`: Create a new draft
- `PUT /api/drafts`: Update existing draft
- `GET /api/drafts`: List all drafts for user
- `GET /api/drafts/[id]`: Get specific draft
- `DELETE /api/drafts/[id]`: Delete draft

## Usage

### Setup

#### 1. Run Database Migration

```powershell
# Apply the drafts table migration to your Supabase database
# You can run this SQL in the Supabase SQL Editor
```

Open the file `supabase/migrations/create_drafts.sql` and run it in your Supabase SQL editor.

#### 2. Update Supabase Types

After creating the `drafts` table, regenerate your TypeScript types:

```powershell
# This ensures TypeScript recognizes the new table
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
```

The types have already been manually added to `lib/supabase/types.ts` for you.

#### 3. Enable Supabase Realtime

In your Supabase dashboard:
1. Go to **Database** → **Replication**
2. Enable replication for the `drafts` table
3. This allows real-time updates via WebSocket

### How It Works

#### Auto-Save

Drafts are automatically saved as you type:

1. **Debouncing**: Changes are batched for 2 seconds before saving
2. **Status indicator**: Shows "Saving..." → "Saved" in the toolbar
3. **Recovery**: If you close the page, work is preserved
4. **Subject/Preview**: Both editor content and metadata are saved

```typescript
// The hook handles everything automatically
const {
  status,          // 'idle' | 'saving' | 'saved' | 'error'
  lastSaved,       // Date when last saved
  hasUnsavedChanges, // Boolean flag
  draftId,         // UUID of the draft
  saveDraft,       // Manually trigger save
} = useDraftAutoSave({
  editor,
  experienceId,
  subject,
  previewText,
  debounceMs: 2000,
  enabled: true,
});
```

#### Real-time Collaboration

Multiple users can edit simultaneously:

1. **Document sync**: Changes propagate in real-time via Yjs
2. **User awareness**: See who else is editing (avatars in toolbar)
3. **Cursor sync**: See where other users are typing
4. **Conflict resolution**: Yjs handles merges automatically

```typescript
// Collaboration is integrated automatically
const {
  synced,          // Boolean, true when connected
  collaborators,   // Array of active users
  provider,        // RealtimeProvider instance
} = useCollaboration({
  editor,
  documentId: `campaign:${experienceId}:new`,
  userId: user?.id || 'anonymous',
  userName: user?.name || 'Guest',
  enabled: true,
});
```

### Visual Indicators

The **SyncStatusIndicator** component in the toolbar shows:

#### Save Status
- **Cloud icon + "Saving..."** (blue): Currently saving
- **Checkmark + "Saved Xs ago"** (green): Successfully saved
- **Alert icon + "Save failed"** (red): Error occurred
- **Cloud + "Unsaved changes"** (yellow): Changes not yet saved

#### Collaboration Status
- **User count + avatars**: Shows connected collaborators
- **Green pulsing dot**: Real-time sync is active
- **User initials in colored circles**: Each collaborator has a unique color

### Configuration

#### Adjust Auto-save Frequency

In `CampaignComposerProvider.tsx`:

```typescript
useDraftAutoSave({
  // ... other options
  debounceMs: 2000, // Change to 1000 for faster saves, 5000 for slower
});
```

#### Enable/Disable Features

```typescript
// Disable auto-save
useDraftAutoSave({ enabled: false });

// Disable collaboration
useCollaboration({ enabled: false });
```

#### Customize Document ID

For different document types:

```typescript
useCollaboration({
  documentId: `campaign:${experienceId}:${campaignId}`, // Existing campaign
  // or
  documentId: `template:${templateId}`, // Template editing
});
```

## API Reference

### Draft Data Structure

```typescript
{
  id: string;                    // UUID
  campaign_id: number | null;    // Optional link to campaign
  user_id: string;               // Owner
  experience_id: string;         // Workspace/company ID
  subject: string | null;        // Email subject
  preview_text: string | null;   // Preview text
  html_content: string | null;   // Rendered HTML
  editor_json: JSON | null;      // TipTap JSON structure
  yjs_state: string | null;      // Yjs document state (base64)
  is_draft: boolean;             // Draft flag
  last_edited_by: string;        // Last editor
  created_at: timestamp;         // Creation time
  updated_at: timestamp;         // Last update time
}
```

### Hook Return Values

#### `useDraftAutoSave`

```typescript
{
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  draftId: string | undefined;
  hasUnsavedChanges: boolean;
  saveDraft: () => void;          // Force immediate save
  loadDraft: (id: string) => Promise<void>;
  deleteDraft: () => Promise<void>;
}
```

#### `useCollaboration`

```typescript
{
  synced: boolean;                // Connection status
  collaborators: AwarenessUser[]; // Active users
  provider: RealtimeProvider;     // Provider instance
  ydoc: Y.Doc;                    // Yjs document
  getYDoc: () => Y.Doc;           // Getter
  forceSync: () => void;          // Manual sync
}
```

## Troubleshooting

### Drafts Not Saving

1. **Check Supabase connection**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
2. **Verify table exists**: Run the migration SQL
3. **Check browser console**: Look for API errors
4. **RLS policies**: Ensure Row Level Security allows inserts/updates

### Real-time Not Working

1. **Enable Realtime**: Check Supabase Replication settings
2. **WebSocket connection**: Check browser DevTools → Network → WS
3. **Firewall**: Ensure WebSocket connections aren't blocked
4. **Document ID**: Verify unique document ID for each session

### Performance Issues

1. **Increase debounce**: Set `debounceMs` to 3000-5000ms
2. **Disable collaboration**: For single-user editing, set `enabled: false`
3. **Clean old drafts**: Delete drafts older than 30 days

## Advanced Features

### Manual Draft Management

```typescript
const { draftId, saveDraft, loadDraft, deleteDraft } = useDraftAutoSave({...});

// Force save immediately
await saveDraft();

// Load existing draft
await loadDraft('draft-uuid');

// Delete current draft
await deleteDraft();
```

### Access Collaborator Info

```typescript
const { collaborators } = useCollaboration({...});

collaborators.forEach(user => {
  console.log(user.userId);   // User ID
  console.log(user.name);     // Display name
  console.log(user.color);    // Assigned color
  console.log(user.cursor);   // { from, to } cursor position
});
```

### Customize Sync Indicator

```typescript
<SyncStatusIndicator
  draftStatus={draftStatus}
  lastSaved={lastSaved}
  hasUnsavedChanges={hasUnsavedChanges}
  collaborationSynced={collaborationSynced}
  collaborators={collaborators}
  showCollaborators={true}    // Show/hide collaborator avatars
  compact={false}             // Compact mode (icons only)
/>
```

## Best Practices

### 1. User Experience
- Always show save status to users
- Warn before navigating away with unsaved changes
- Provide manual save button for user control

### 2. Performance
- Use appropriate debounce times (2-3 seconds recommended)
- Clean up old drafts periodically
- Limit collaborator count for large documents

### 3. Data Management
- Store both HTML and JSON for flexibility
- Use Yjs state for collaboration support
- Link drafts to campaigns when created

### 4. Error Handling
- Show clear error messages
- Implement retry logic for failed saves
- Gracefully handle network disconnections

## Security Considerations

- **Row Level Security**: Users can only access their own drafts
- **Authentication**: All API routes verify user tokens
- **Realtime channels**: Scoped to specific documents
- **XSS prevention**: Sanitize HTML content before rendering

## Future Enhancements

Potential additions:
- Draft history/versioning
- Commenting system
- @mentions for collaborators
- Conflict resolution UI
- Draft templates library
- Scheduled auto-save intervals

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify Supabase connection and table setup
3. Review API route logs
4. Test with collaboration disabled to isolate issues

---

**Built with:**
- [TipTap](https://tiptap.dev/) - Rich text editor
- [Yjs](https://github.com/yjs/yjs) - CRDT for collaboration
- [Supabase Realtime](https://supabase.com/docs/guides/realtime) - WebSocket infrastructure
- [Next.js](https://nextjs.org/) - React framework
