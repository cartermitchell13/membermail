# Whop OAuth Implementation Guide

This project now includes a complete Whop OAuth implementation for user authentication.

## 📋 Setup Instructions

### 1. Configure Your Whop App

1. Go to the [Whop Dashboard](https://whop.com/dashboard/developer/)
2. Create a new app or select your existing app
3. Navigate to OAuth settings
4. Add redirect URIs:
   - For local development: `http://localhost:3000/api/oauth/callback`
   - For production: `https://yourdomain.com/api/oauth/callback`

### 2. Environment Variables

Make sure your `.env.local` file includes these variables (they should already be set):

```env
NEXT_PUBLIC_WHOP_APP_ID=your-app-id
WHOP_API_KEY=your-api-key
```

**Important:** 
- `NEXT_PUBLIC_WHOP_APP_ID` is public and can be exposed to the client
- `WHOP_API_KEY` is secret and should never be exposed to the client

### 3. Update Redirect URIs for Production

When deploying to production, update the redirect URIs in both:
- Your Whop app settings (add your production domain)
- The OAuth routes (`/app/api/oauth/init/route.ts` and `/app/api/oauth/callback/route.ts`)

## 🚀 Usage

### Basic Login Flow

1. **Add a login button to your page:**

```tsx
import { WhopLoginButton } from "@/components/auth/WhopLoginButton";

export default function HomePage() {
  return (
    <div>
      <h1>Welcome to MemberMail</h1>
      <WhopLoginButton next="/dashboard" />
    </div>
  );
}
```

2. **Or use a custom link:**

```tsx
<a href="/api/oauth/init?next=/dashboard">Login with Whop</a>
```

### Protecting API Routes

Use the authentication utilities to protect your API routes:

```typescript
import { getAuthenticatedUser } from "@/lib/auth/whop-auth";
import { NextResponse } from "next/server";

export async function GET() {
  // Get the authenticated user
  const user = await getAuthenticatedUser();
  
  // Check if user is authenticated
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  // User is authenticated, proceed with your logic
  return NextResponse.json({
    message: "Success",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}
```

### Protecting Pages

Use the authentication utilities in Server Components:

```tsx
import { getAuthenticatedUser } from "@/lib/auth/whop-auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect("/api/oauth/init?next=/dashboard");
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

### Logout

Use the logout button component to log users out:

```tsx
import { WhopLogoutButton } from "@/components/auth/WhopLogoutButton";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <WhopLogoutButton redirect="/" />
    </div>
  );
}
```

Or use a custom link:

```tsx
<a href="/api/oauth/logout?redirect=/">Logout</a>
```

### Check Authentication Status

```typescript
import { isAuthenticated } from "@/lib/auth/whop-auth";
import { WhopLoginButton } from "@/components/auth/WhopLoginButton";
import { WhopLogoutButton } from "@/components/auth/WhopLogoutButton";

export default async function Header() {
  const authenticated = await isAuthenticated();
  
  return (
    <header>
      {authenticated ? (
        <>
          <a href="/dashboard">Dashboard</a>
          <WhopLogoutButton />
        </>
      ) : (
        <WhopLoginButton />
      )}
    </header>
  );
}
```

## 📁 Files Created

### API Routes
- `/app/api/oauth/init/route.ts` - Initiates the OAuth flow
- `/app/api/oauth/callback/route.ts` - Handles the OAuth callback
- `/app/api/oauth/logout/route.ts` - Logs out the user

### Pages
- `/app/oauth/error/page.tsx` - Displays OAuth error messages

### Utilities
- `/lib/auth/whop-auth.ts` - Authentication helper functions

### Components
- `/components/auth/WhopLoginButton.tsx` - Reusable login button component
- `/components/auth/WhopLogoutButton.tsx` - Reusable logout button component

## 🔐 Security Notes

1. **Access Token Storage**: The current implementation stores access tokens in httpOnly cookies. This is secure for most use cases, but for production applications, consider:
   - Implementing refresh tokens
   - Using a session management system
   - Storing tokens in a secure database
   - Implementing token rotation

2. **State Parameter**: The state parameter is stored in a cookie for CSRF protection. This is a basic implementation suitable for most use cases.

3. **HTTPS**: Always use HTTPS in production to protect tokens in transit.

4. **Token Expiration**: The access token cookie is set to expire in 7 days. Adjust this based on your security requirements.

## 🔄 OAuth Flow

1. User clicks login button → `/api/oauth/init`
2. App redirects to Whop authorization page
3. User authorizes the app
4. Whop redirects back to `/api/oauth/callback?code=...&state=...`
5. App exchanges code for access token
6. App stores token in cookie and redirects to the intended page

## 🛠️ Available Scopes

The current implementation requests the `read_user` scope. You can request additional scopes:

- `read_user` - Read user profile information
- `read_membership` - Read user's membership information
- `write_user` - Modify user profile

Update the scope in `/app/api/oauth/init/route.ts`:

```typescript
scope: ["read_user", "read_membership"],
```

For a complete list of available scopes, see the [Whop API documentation](https://docs.whop.com/api-reference/graphql/scopes).

## 🐛 Error Handling

All OAuth errors are handled gracefully and redirect to `/oauth/error` with an error code:

- `missing_code` - Authorization code not provided
- `missing_state` - State parameter missing
- `invalid_state` - State parameter invalid or expired
- `code_exchange_failed` - Failed to exchange code for token
- `init_failed` - Failed to initialize OAuth flow
- `callback_failed` - Error during callback processing

## 📚 Additional Resources

- [Whop OAuth Documentation](https://docs.whop.com/apps/features/oauth-guide)
- [Whop API Reference](https://docs.whop.com/api-reference)
- [Whop SDK Documentation](https://github.com/whopio/whop-sdk-ts)
