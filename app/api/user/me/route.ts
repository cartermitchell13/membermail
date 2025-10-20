import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/user/me
 * Returns the current authenticated user's information
 */
export async function GET() {
	try {
		// Get the user token from headers
		const headersList = await headers();
		
		// Verify the user token and get userId
		const { userId } = await whopSdk.verifyUserToken(headersList);
		
		// Fetch the user details from Whop
		const user = await whopSdk.users.getUser({ userId });
		
		// Return user information (using type assertion to handle Whop SDK types)
		const userData = user as any;
		return NextResponse.json({
			id: userData.id,
			name: userData.name || userData.username,
			username: userData.username,
			email: userData.email || null,
			profilePictureUrl: userData.profilePicture?.sourceUrl || null,
		});
	} catch (error) {
		console.error("Error fetching user:", error);
		return NextResponse.json(
			{ error: "Failed to fetch user information" },
			{ status: 500 }
		);
	}
}
