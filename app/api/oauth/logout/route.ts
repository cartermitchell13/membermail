import { NextResponse } from "next/server";

/**
 * GET /api/oauth/logout
 * Logs out the user by clearing the access token cookie
 * 
 * Query Parameters:
 * - redirect: URL path to redirect to after logout (default: /)
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const redirectPath = url.searchParams.get("redirect") ?? "/";
		
		// Create response with redirect
		const response = NextResponse.redirect(new URL(redirectPath, url.origin));
		
		// Clear the access token cookie
		response.cookies.delete("whop_access_token");
		
		// Clear any remaining oauth state cookies
		// Note: We can't enumerate all cookies, but we clear the main token
		// State cookies will expire naturally after 1 hour
		
		return response;
	} catch (error) {
		console.error("Error during logout:", error);
		// Even if there's an error, try to redirect to home
		const response = NextResponse.redirect(new URL("/", request.url));
		response.cookies.delete("whop_access_token");
		return response;
	}
}

/**
 * POST /api/oauth/logout
 * Alternative POST method for logout (useful for forms)
 */
export async function POST(request: Request) {
	return GET(request);
}
