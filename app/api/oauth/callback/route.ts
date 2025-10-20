import { whopSdk } from "@/lib/whop-sdk";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/oauth/callback
 * Handles the OAuth callback from Whop after user authorization
 * Exchanges the authorization code for an access token
 * 
 * Query Parameters:
 * - code: Authorization code from Whop
 * - state: State parameter for CSRF protection
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const code = url.searchParams.get("code");
		const state = url.searchParams.get("state");
		
		// Validate that we received the required parameters
		if (!code) {
			return NextResponse.redirect(
				new URL("/oauth/error?error=missing_code", request.url)
			);
		}
		
		if (!state) {
			return NextResponse.redirect(
				new URL("/oauth/error?error=missing_state", request.url)
			);
		}
		
		// Retrieve the state cookie to validate the request and get the 'next' URL
		const cookieStore = await cookies();
		const stateCookie = cookieStore.get(`oauth-state.${state}`);
		
		if (!stateCookie) {
			return NextResponse.redirect(
				new URL("/oauth/error?error=invalid_state", request.url)
			);
		}
		
		// Exchange the authorization code for an access token
		// Use the same redirect URI as in the init route
		const redirectUri = process.env.NODE_ENV === 'production'
			? `${url.origin}/api/oauth/callback`
			: 'http://localhost:3000/api/oauth/callback';
		
		console.log("🔍 OAuth Callback - Redirect URI being sent:", redirectUri);
		
		const authResponse = await whopSdk.oauth.exchangeCode({
			code,
			redirectUri,
		});
		
		if (!authResponse.ok) {
			console.error("Failed to exchange code:", authResponse);
			return NextResponse.redirect(
				new URL("/oauth/error?error=code_exchange_failed", request.url)
			);
		}
		
		const { access_token } = authResponse.tokens;
		
		// Restore the 'next' parameter from the state cookie
		const next = decodeURIComponent(stateCookie.value);
		const nextUrl = new URL(next, url.origin);
		
		// Create the response with the redirect
		const response = NextResponse.redirect(nextUrl);
		
		// Store the access token in a secure, httpOnly cookie
		// IMPORTANT: This is a basic implementation
		// For production, consider:
		// - Using a proper session management system
		// - Storing tokens in a secure database
		// - Implementing token refresh logic
		// - Using shorter expiration times with refresh tokens
		response.cookies.set("whop_access_token", access_token, {
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 7, // 7 days
		});
		
		// Clean up the state cookie
		response.cookies.delete(`oauth-state.${state}`);
		
		return response;
	} catch (error) {
		console.error("Error in OAuth callback:", error);
		return NextResponse.redirect(
			new URL("/oauth/error?error=callback_failed", request.url)
		);
	}
}
