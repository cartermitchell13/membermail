# Campaign Personalization Variables

This document explains the personalization variable system for email campaigns.

## Overview

Users can now insert personalization variables into their email campaigns that will be automatically replaced with actual member data when emails are sent. Variables use the `{{variable_name}}` syntax.

## Available Variables

Based on the Whop member data structure:

| Variable | Syntax | Example Output | Description |
|----------|--------|----------------|-------------|
| **Member Name** | `{{name}}` | "John Doe" | Full name from member's Whop account |
| **Email Address** | `{{email}}` | "john@example.com" | Member's email address |
| **Username** | `{{username}}` | "@johndoe" | Whop username |
| **Company Name** | `{{company_name}}` | "Your Company" | Your company/experience name |

## How to Insert Variables

### Method 1: Toolbar Dropdown
1. Click the **variable tag icon** in the editor toolbar (with dropdown arrow)
2. Select the variable you want to insert from the dropdown menu
3. The variable will be inserted at your cursor position

### Method 2: Slash Command
1. Type `/` in the editor to open the slash command menu
2. Browse to the **Variables** category or search for the variable name
3. Click the variable to insert it

## Technical Implementation

### Files Created/Modified

**New Files:**
- `components/email-builder/extensions/Variable.ts` - TipTap extension for variable nodes
- `lib/email/variables.ts` - Utility functions for variable replacement
- `whop-docs/campaign-personalization.md` - This documentation

**Modified Files:**
- `components/campaigns/new/useCampaignEditor.ts` - Registered Variable extension
- `components/campaigns/new/steps/EditorToolbar.tsx` - Added variable dropdown UI
- `components/email-builder/extensions/SlashCommand.tsx` - Added variables to slash menu
- `app/globals.css` - Added variable styling

### Variable Display

Variables appear in the editor with:
- Orange accent color (`#FA4616`)
- Pill-shaped badge design
- Monospace font
- Hover effects for better UX
- Selected state highlighting

### Backend Integration

When sending campaigns, use the utility functions in `lib/email/variables.ts`:

```typescript
import { replaceVariables } from "@/lib/email/variables";

// Get member data from Whop API
const memberData = {
  name: member.user.name,
  email: member.user.email,
  username: member.user.username,
  company_name: "Your Company Name",
};

// Replace variables in email HTML
const personalizedHtml = replaceVariables(campaignHtml, memberData);

// Send email with personalized content
await sendEmail(memberData.email, subject, personalizedHtml);
```

### Additional Utilities

**Extract Variables:**
```typescript
import { extractVariables } from "@/lib/email/variables";

const variables = extractVariables(htmlContent);
// Returns: ["name", "email", "username"]
```

**Validate Variables:**
```typescript
import { validateVariables } from "@/lib/email/variables";

const result = validateVariables(htmlContent, memberData);
if (!result.valid) {
  console.error("Missing data for:", result.missing);
}
```

**Preview with Examples:**
```typescript
import { previewWithExamples } from "@/lib/email/variables";

const preview = previewWithExamples(htmlContent);
// Shows how the email will look with example data
```

## Data Source

Member data comes from the Whop API. Reference the official Whop documentation for the complete member object structure.

Key fields from Whop member response:
```typescript
{
  user: {
    id: "user_***",
    name: "John Doe",
    email: "john@example.com",
    username: "johndoe"
  }
}
```

## Future Enhancements

Potential additional variables to consider:
- `{{first_name}}` - Extract first name from full name
- `{{tier}}` - Member's membership tier
- `{{join_date}}` - Date member joined
- `{{renewal_date}}` - Next renewal date
- Custom fields defined by the company
