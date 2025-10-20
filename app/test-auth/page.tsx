import { getAuthenticatedUser, isAuthenticated } from "@/lib/auth/whop-auth";
import { WhopLoginButton } from "@/components/auth/WhopLoginButton";
import { WhopLogoutButton } from "@/components/auth/WhopLogoutButton";

/**
 * Test page for Whop OAuth authentication
 * Visit this page at: http://localhost:3000/test-auth
 */
export default async function TestAuthPage() {
	// Check if user is authenticated
	const authenticated = await isAuthenticated();
	const user = authenticated ? await getAuthenticatedUser() : null;

	return (
		<div className="min-h-screen bg-gray-900 text-white p-8">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-2">Whop OAuth Test Page</h1>
					<p className="text-gray-400">
						Test your Whop authentication implementation
					</p>
				</div>

				{/* Authentication Status */}
				<div className="bg-gray-800 rounded-lg p-6 mb-6">
					<h2 className="text-2xl font-semibold mb-4">Authentication Status</h2>
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<span className="font-medium">Status:</span>
							<span
								className={`px-3 py-1 rounded-full text-sm font-medium ${
									authenticated
										? "bg-green-500/20 text-green-400"
										: "bg-red-500/20 text-red-400"
								}`}
							>
								{authenticated ? "✓ Authenticated" : "✗ Not Authenticated"}
							</span>
						</div>
					</div>
				</div>

				{/* User Information (if authenticated) */}
				{authenticated && user ? (
					<div className="bg-gray-800 rounded-lg p-6 mb-6">
						<h2 className="text-2xl font-semibold mb-4">User Information</h2>
						<div className="space-y-3">
							<div className="flex items-start gap-4">
								{user.profilePicture?.sourceUrl && (
									<img
										src={user.profilePicture.sourceUrl}
										alt={user.username}
										className="w-16 h-16 rounded-full"
									/>
								)}
								<div className="flex-1">
									<div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
										<span className="text-gray-400">User ID:</span>
										<span className="font-mono">{user.id}</span>

										<span className="text-gray-400">Username:</span>
										<span className="font-medium">{user.username}</span>

										{user.name && (
											<>
												<span className="text-gray-400">Name:</span>
												<span>{user.name}</span>
											</>
										)}

										{user.email && (
											<>
												<span className="text-gray-400">Email:</span>
												<span>{user.email}</span>
											</>
										)}

										{user.bio && (
											<>
												<span className="text-gray-400">Bio:</span>
												<span>{user.bio}</span>
											</>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				) : null}

				{/* Action Buttons */}
				<div className="bg-gray-800 rounded-lg p-6 mb-6">
					<h2 className="text-2xl font-semibold mb-4">Actions</h2>
					<div className="space-y-3">
						{authenticated ? (
							<>
								<WhopLogoutButton redirect="/test-auth" className="w-full" />
								<p className="text-sm text-gray-400">
									You can test logout and then login again.
								</p>
							</>
						) : (
							<>
								<WhopLoginButton next="/test-auth" className="w-full" />
								<p className="text-sm text-gray-400">
									Click the button above to start the OAuth flow.
								</p>
							</>
						)}
					</div>
				</div>

				{/* Instructions */}
				<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
					<h2 className="text-2xl font-semibold mb-4 text-blue-400">
						Testing Instructions
					</h2>
					<ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
						<li>
							Make sure your dev server is running on{" "}
							<code className="bg-gray-800 px-2 py-1 rounded">
								http://localhost:3000
							</code>
						</li>
						<li>
							Verify you added{" "}
							<code className="bg-gray-800 px-2 py-1 rounded">
								http://localhost:3000/api/oauth/callback
							</code>{" "}
							to your Whop app's OAuth redirect URIs
						</li>
						<li>Click the "Login with Whop" button above</li>
						<li>You'll be redirected to Whop to authorize the app</li>
						<li>After authorizing, you'll be redirected back here</li>
						<li>You should see your user information displayed above</li>
						<li>Test the logout button to complete the flow</li>
					</ol>
				</div>

				{/* Troubleshooting */}
				<div className="mt-6 bg-gray-800 rounded-lg p-6">
					<h3 className="text-xl font-semibold mb-3">Troubleshooting</h3>
					<div className="space-y-2 text-sm text-gray-300">
						<p>
							<strong>If you see errors:</strong>
						</p>
						<ul className="list-disc list-inside space-y-1 ml-4">
							<li>Check that your environment variables are set correctly</li>
							<li>
								Verify the redirect URI in Whop Dashboard matches exactly:{" "}
								<code className="bg-gray-700 px-2 py-1 rounded text-xs">
									http://localhost:3000/api/oauth/callback
								</code>
							</li>
							<li>Check the browser console for any JavaScript errors</li>
							<li>
								Check your server logs for any backend errors
							</li>
							<li>
								If you get a redirect error, visit{" "}
								<a
									href="/oauth/error"
									className="text-blue-400 hover:underline"
								>
									/oauth/error
								</a>{" "}
								to see the error details
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
