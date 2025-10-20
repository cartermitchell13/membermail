# Whop OAuth Examples

This file contains practical examples of how to use the Whop OAuth implementation in your application.

## Example 1: Simple Login Page

```tsx
// app/login/page.tsx
import { WhopLoginButton } from "@/components/auth/WhopLoginButton";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-white">
          Welcome to MemberMail
        </h1>
        <p className="text-gray-400">
          Sign in with your Whop account to continue
        </p>
        <WhopLoginButton next="/dashboard" className="w-64" />
      </div>
    </div>
  );
}
```

## Example 2: Protected Dashboard Page

```tsx
// app/dashboard/page.tsx
import { getAuthenticatedUser } from "@/lib/auth/whop-auth";
import { redirect } from "next/navigation";
import { WhopLogoutButton } from "@/components/auth/WhopLogoutButton";

export default async function DashboardPage() {
  // Get the authenticated user
  const user = await getAuthenticatedUser();
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/api/oauth/init?next=/dashboard");
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user.username}!</h1>
          <p className="text-gray-600">Email: {user.email || "Not provided"}</p>
        </div>
        <WhopLogoutButton />
      </div>
      
      <div className="grid gap-4">
        {/* Your dashboard content */}
      </div>
    </div>
  );
}
```

## Example 3: Protected API Route

```tsx
// app/api/protected-data/route.ts
import { getAuthenticatedUser } from "@/lib/auth/whop-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized - Please sign in" },
      { status: 401 }
    );
  }
  
  // User is authenticated, proceed with your logic
  return NextResponse.json({
    message: "Success",
    data: {
      userId: user.id,
      username: user.username,
      // ... your protected data
    },
  });
}
```

## Example 4: Conditional Header Component

```tsx
// components/Header.tsx
import { isAuthenticated, getAuthenticatedUser } from "@/lib/auth/whop-auth";
import { WhopLoginButton } from "@/components/auth/WhopLoginButton";
import { WhopLogoutButton } from "@/components/auth/WhopLogoutButton";
import Link from "next/link";

export default async function Header() {
  const authenticated = await isAuthenticated();
  const user = authenticated ? await getAuthenticatedUser() : null;
  
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-white">
          MemberMail
        </Link>
        
        <nav className="flex items-center gap-4">
          {authenticated && user ? (
            <>
              <span className="text-gray-400">
                Hi, {user.username}
              </span>
              <Link href="/dashboard" className="text-white hover:text-gray-300">
                Dashboard
              </Link>
              <WhopLogoutButton variant="ghost" />
            </>
          ) : (
            <>
              <Link href="/about" className="text-white hover:text-gray-300">
                About
              </Link>
              <WhopLoginButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
```

## Example 5: Client-Side Authentication Check

For client-side components, create an API route to check authentication:

```tsx
// app/api/auth/check/route.ts
import { getAuthenticatedUser } from "@/lib/auth/whop-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getAuthenticatedUser();
  
  return NextResponse.json({
    authenticated: !!user,
    user: user ? {
      id: user.id,
      username: user.username,
      email: user.email,
      profilePictureUrl: user.profilePicture?.sourceUrl || null,
    } : null,
  });
}
```

Then use it in a client component:

```tsx
// components/UserProfile.tsx
"use client";

import { useEffect, useState } from "react";
import { WhopLoginButton } from "@/components/auth/WhopLoginButton";
import { WhopLogoutButton } from "@/components/auth/WhopLogoutButton";

interface User {
  id: string;
  username: string;
  email?: string;
  profilePictureUrl?: string | null;
}

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch("/api/auth/check")
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <WhopLoginButton />;
  }
  
  return (
    <div className="flex items-center gap-4">
      {user.profilePictureUrl && (
        <img 
          src={user.profilePictureUrl} 
          alt={user.username}
          className="w-10 h-10 rounded-full"
        />
      )}
      <div>
        <p className="font-medium">{user.username}</p>
        {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
      </div>
      <WhopLogoutButton />
    </div>
  );
}
```

## Example 6: Role-Based Access Control

```tsx
// app/admin/page.tsx
import { getAuthenticatedUser } from "@/lib/auth/whop-auth";
import { redirect } from "next/navigation";
import { whopSdk } from "@/lib/whop-sdk";

export default async function AdminPage() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect("/api/oauth/init?next=/admin");
  }
  
  // Check if user has admin access to your company
  // You'll need to implement your own role-checking logic
  // This is just an example
  try {
    const companies = await whopSdk.companies.listUserCompanies({
      userId: user.id,
    });
    
    // Check if user is admin of any company
    const isAdmin = companies.data.some(company => 
      company.role === "admin"
    );
    
    if (!isAdmin) {
      redirect("/dashboard?error=unauthorized");
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    redirect("/dashboard?error=check_failed");
  }
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      {/* Admin-only content */}
    </div>
  );
}
```

## Example 7: Middleware for Route Protection (Optional)

If you want to protect multiple routes at once, you can create middleware:

```tsx
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check for the access token cookie
  const accessToken = request.cookies.get("whop_access_token");
  
  // List of protected routes
  const protectedRoutes = ["/dashboard", "/settings", "/admin"];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL("/api/oauth/init", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/admin/:path*"],
};
```

## Example 8: Custom Login Page with Redirect

```tsx
// app/signin/page.tsx
"use client";

import { WhopLoginButton } from "@/components/auth/WhopLoginButton";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const error = searchParams.get("error");
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-gray-400">
            Continue with your Whop account
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded p-3">
            <p className="text-red-500 text-sm">
              Authentication failed. Please try again.
            </p>
          </div>
        )}
        
        <div className="mt-8">
          <WhopLoginButton 
            next={next}
            className="w-full"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
              Continue with Whop
            </div>
          </WhopLoginButton>
        </div>
        
        <p className="text-center text-xs text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
```

## Tips and Best Practices

1. **Always handle null user**: The `getAuthenticatedUser()` function returns `null` if the user is not authenticated or if there's an error.

2. **Use redirects for server components**: When protecting server component pages, use Next.js's `redirect()` function to send unauthenticated users to the login page.

3. **Use error responses for API routes**: For API routes, return proper HTTP status codes (401 for unauthorized, 403 for forbidden).

4. **Store minimal data in cookies**: Only store the access token in cookies, fetch user data as needed from the Whop API.

5. **Handle token expiration**: The access token will expire. Consider implementing refresh token logic or requiring users to re-authenticate periodically.

6. **Test your auth flow**: Make sure to test the complete flow:
   - Login → Redirect → Callback → Protected page
   - Logout → Clear cookies → Login page
   - Error cases → Error page with helpful messages

7. **Use environment-specific redirect URIs**: Update your redirect URIs for different environments (local, staging, production).
