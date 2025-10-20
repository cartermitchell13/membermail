import { whopSdk } from "@/lib/whop-sdk";
import { cookies } from "next/headers";

/**
 * Gets the authenticated user from the OAuth access token stored in cookies
 * 
 * @returns User object if authenticated, null otherwise
 * 
 * @example
 * ```typescript
 * import { getAuthenticatedUser } from "@/lib/auth/whop-auth";
 * 
 * export async function GET() {
 *   const user = await getAuthenticatedUser();
 *   
 *   if (!user) {
 *     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   }
 *   
 *   // Use user data
 *   return NextResponse.json({ userId: user.id, name: user.name });
 * }
 * ```
 */
export async function getAuthenticatedUser() {
	try {
		// Get the access token from the cookie
		const cookieStore = await cookies();
		const accessToken = cookieStore.get("whop_access_token");
		
		if (!accessToken?.value) {
			return null;
		}
		
		// Make an authenticated request to Whop API to get current user
		// Using the OAuth access token
		const response = await fetch('https://api.whop.com/api/v5/me', {
			headers: {
				'Authorization': `Bearer ${accessToken.value}`,
				'Content-Type': 'application/json',
			},
		});
		
		if (!response.ok) {
			console.error('Failed to fetch user from Whop API:', response.status, response.statusText);
			return null;
		}
		
		const user = await response.json();
		return user;
	} catch (error) {
		console.error("Error getting authenticated user:", error);
		return null;
	}
}

/**
 * Gets the access token from the cookie
 * 
 * @returns Access token string if present, null otherwise
 */
export async function getAccessToken(): Promise<string | null> {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get("whop_access_token");
		return accessToken?.value || null;
	} catch (error) {
		console.error("Error getting access token:", error);
		return null;
	}
}

/**
 * Checks if the user is authenticated
 * 
 * @returns True if user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
	const token = await getAccessToken();
	return token !== null;
}
