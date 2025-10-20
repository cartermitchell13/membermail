# Live Sync & Draft Mode - Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Run Database Migration

1. Open [Supabase SQL Editor](https://app.supabase.com/project/_/sql)
2. Copy the contents of `supabase/migrations/create_drafts.sql`
3. Paste and run the SQL script
4. Verify the `drafts` table was created

### Step 2: Enable Realtime

1. In Supabase Dashboard → **Database** → **Replication**
2. Find the `drafts` table
3. Toggle **Replication** to ON
4. Click **Save**

### Step 3: Verify Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 4: Test the Features

1. Start your dev server: `npm run dev`
2. Navigate to "Create Campaign"
3. Start typing - you should see "Saving..." then "Saved" in the toolbar
4. Open the same campaign in another browser/tab to test collaboration

## ✅ Verification Checklist

- [ ] `drafts` table exists in Supabase
- [ ] Realtime replication enabled for `drafts` table
- [ ] Environment variables configured
- [ ] No TypeScript errors in console
- [ ] Auto-save indicator shows in toolbar
- [ ] Drafts appear in Supabase table after typing

## 🎯 Features Available

### Auto-Save
- ✅ Debounced saving (2 second delay)
- ✅ Visual status indicator
- ✅ Unsaved changes warning
- ✅ Subject and preview text saved
- ✅ Editor content and JSON saved

### Real-time Collaboration
- ✅ Multiple users can edit simultaneously
- ✅ Live cursor positions
- ✅ Collaborator avatars in toolbar
- ✅ Conflict-free merging (Yjs CRDT)
- ✅ Connection status indicator

### Draft Management
- ✅ Auto-save every change
- ✅ Manual force save
- ✅ Draft recovery on page reload
- ✅ Delete drafts via API
- ✅ List all user drafts

## 🔧 Configuration Options

### Adjust Auto-save Speed

In `CampaignComposerProvider.tsx`, line ~270:

```typescript
useDraftAutoSave({
  // ...
  debounceMs: 2000, // ← Change this (in milliseconds)
});
```

- **1000ms**: Fast (saves every 1 second)
- **2000ms**: Default (saves every 2 seconds)
- **5000ms**: Slow (saves every 5 seconds)

### Disable Features Temporarily

```typescript
// Disable auto-save
useDraftAutoSave({ enabled: false });

// Disable collaboration
useCollaboration({ enabled: false });
```

## 🐛 Common Issues

### "Drafts not saving"
**Solution**: Check Supabase table exists and RLS policies are correct

### "Realtime not working"
**Solution**: Enable replication in Supabase Dashboard

### "TypeScript errors about 'drafts'"
**Solution**: The types are already added to `lib/supabase/types.ts`

### "Collaborators not showing"
**Solution**: Ensure Realtime is enabled and WebSocket isn't blocked

## 📊 How to View Saved Drafts

### In Supabase
1. Go to **Table Editor**
2. Select `drafts` table
3. View all saved drafts with timestamps

### Via API
```typescript
// Get all drafts for current user
const response = await fetch('/api/drafts?experienceId=YOUR_ID');
const { drafts } = await response.json();
```

## 🎨 UI Components

### Toolbar Indicator
Located in the top-right of the editor toolbar:
- Shows save status with icons
- Displays "Saved 2m ago" timestamp
- Shows connected collaborators

### Status Icons
- 🔵 **Spinning loader**: Saving in progress
- ✅ **Green checkmark**: Successfully saved
- ⚠️ **Alert icon**: Save failed
- ☁️ **Cloud icon**: Ready/idle state

## 📝 Testing Collaboration

### Single Machine Test
1. Open campaign editor in Chrome
2. Open same campaign in Firefox (or Incognito)
3. Type in one browser
4. Watch changes appear in other browser
5. See user avatars in toolbar

### Multi-User Test
1. Share campaign URL with teammate
2. Both edit simultaneously
3. Observe real-time sync
4. Check no conflicts occur

## 🚨 Troubleshooting Steps

If something isn't working:

1. **Check browser console** for errors
2. **Verify Supabase connection** (try other Supabase features)
3. **Check Network tab** for failed API calls
4. **Confirm RLS policies** in Supabase
5. **Try disabling browser extensions** (ad blockers can block WebSockets)

## 📚 Full Documentation

See `LIVE_SYNC_AND_DRAFTS.md` for:
- Complete API reference
- Advanced configuration
- Architecture details
- Performance tuning
- Security considerations

## 🎉 You're Done!

Your email builder now has:
- ✨ Auto-saving drafts
- 👥 Real-time collaboration
- 💾 Draft recovery
- 🔄 Live sync indicators

Start creating campaigns and enjoy the new features!
