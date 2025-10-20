"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

/**
 * OAuth Error Page Content Component
 * Separated to allow Suspense boundary wrapping
 */
function OAuthErrorContent() {
	const searchParams = useSearchParams();
	const error = searchParams.get("error") || "unknown_error";
	
	// Map error codes to user-friendly messages
	const errorMessages: Record<string, { title: string; description: string }> = {
		missing_code: {
			title: "Missing Authorization Code",
			description: "The authorization code was not provided. Please try signing in again.",
		},
		missing_state: {
			title: "Missing State Parameter",
			description: "The security state parameter is missing. Please try signing in again.",
		},
		invalid_state: {
			title: "Invalid State",
			description: "The security state parameter is invalid or expired. Please try signing in again.",
		},
		code_exchange_failed: {
			title: "Authorization Failed",
			description: "Failed to complete the authorization process. Please try again.",
		},
		init_failed: {
			title: "Initialization Failed",
			description: "Failed to start the authentication process. Please check your configuration.",
		},
		callback_failed: {
			title: "Callback Failed",
			description: "An error occurred during the authentication callback. Please try again.",
		},
		unknown_error: {
			title: "Authentication Error",
			description: "An unknown error occurred during authentication. Please try again.",
		},
	};
	
	const errorInfo = errorMessages[error] || errorMessages.unknown_error;
	
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
			<Card className="max-w-md w-full p-8 space-y-6">
				{/* Error Icon */}
				<div className="flex justify-center">
					<div className="rounded-full bg-red-100 p-3">
						<AlertCircle className="h-8 w-8 text-red-600" />
					</div>
				</div>
				
				{/* Error Title */}
				<div className="text-center space-y-2">
					<h1 className="text-2xl font-bold text-gray-900">
						{errorInfo.title}
					</h1>
					<p className="text-gray-600">
						{errorInfo.description}
					</p>
				</div>
				
				{/* Error Code (for debugging) */}
				<div className="bg-gray-100 rounded-lg p-3 text-center">
					<p className="text-sm text-gray-500">
						Error code: <span className="font-mono font-medium">{error}</span>
					</p>
				</div>
				
				{/* Action Buttons */}
				<div className="space-y-3">
					<Link href="/api/oauth/init" className="w-full">
						<Button className="w-full">
							Try Again
						</Button>
					</Link>
					
					<Link href="/" className="w-full">
						<Button variant="outline" className="w-full">
							Go to Home
						</Button>
					</Link>
				</div>
				
				{/* Help Text */}
				<p className="text-xs text-center text-gray-500">
					If this problem persists, please contact support.
				</p>
			</Card>
		</div>
	);
}

/**
 * OAuth Error Page
 * Displays error messages when OAuth authentication fails
 */
export default function OAuthErrorPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-gray-50">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
						<p className="mt-4 text-gray-600">Loading...</p>
					</div>
				</div>
			}
		>
			<OAuthErrorContent />
		</Suspense>
	);
}
