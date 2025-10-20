import { whopSdk } from "@/lib/whop-sdk";
import { NextResponse } from "next/server";

/**
 * GET /api/oauth/init
 * Initiates the OAuth flow by redirecting the user to Whop's authorization page
 * 
 * Query Parameters:
 * - next: The URL path to redirect to after successful authentication (default: /dashboard)
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const next = url.searchParams.get("next") ?? "/dashboard";
		
		// Construct the redirect URI
		// Use localhost:3000 for development (whop-proxy port)
		// In production, use the actual origin
		const redirectUri = process.env.NODE_ENV === 'production' 
			? `${url.origin}/api/oauth/callback`
			: 'http://localhost:3000/api/oauth/callback';
		
		// Debug: Log the redirect URI being used
		console.log("🔍 OAuth Init - Redirect URI being sent:", redirectUri);
		console.log("🔍 OAuth Init - Origin:", url.origin);
		
		// Get the authorization URL from Whop SDK
		const { url: authUrl, state } = whopSdk.oauth.getAuthorizationUrl({
			// The redirect URI must match one configured in your Whop app settings
			redirectUri,
			// Request permissions to read user information
			scope: ["read_user"],
		});
		
		// Store the 'next' parameter in a cookie using the state as the key
		// This allows us to redirect the user to their intended destination after authentication
		// NOTE: This is a simple implementation for demonstration
		// In production, consider using encrypted session storage
		const response = NextResponse.redirect(authUrl);
		response.cookies.set(`oauth-state.${state}`, encodeURIComponent(next), {
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 3600, // 1 hour
		});
		
		return response;
	} catch (error) {
		console.error("Error initiating OAuth flow:", error);
		return NextResponse.redirect(new URL("/oauth/error?error=init_failed", request.url));
	}
}
