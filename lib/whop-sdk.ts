import { WhopServerSdk } from "@whop/api";

// Lazy initialization - only create SDK instance when needed, not at module load time
let sdkInstance: ReturnType<typeof WhopServerSdk> | null = null;

function getWhopSdk() {
	if (!sdkInstance) {
		// Only initialize if we have valid credentials
		const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
		const apiKey = process.env.WHOP_API_KEY;
		
		// If no credentials, return null (will be handled by Proxy)
		if (!appId || !apiKey || appId === 'fallback' || apiKey === 'fallback') {
			return null;
		}
		
		sdkInstance = WhopServerSdk({
			appId,
			appApiKey: apiKey,
			onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
			companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
		});
	}
	return sdkInstance;
}

// Create a deep Proxy that returns mock objects for build time
function createMockProxy(path: string[] = []): any {
	return new Proxy(() => {}, {
		get(_target, prop) {
			// Return another mock proxy for nested access
			return createMockProxy([...path, String(prop)]);
		},
		apply() {
			// If actually called, throw a descriptive error
			throw new Error(
				`Whop SDK not initialized. Attempted to call: ${path.join('.')}. ` +
				`Make sure NEXT_PUBLIC_WHOP_APP_ID and WHOP_API_KEY environment variables are set.`
			);
		},
	});
}

// Create a Proxy that handles both build-time and runtime scenarios
export const whopSdk = new Proxy({} as ReturnType<typeof WhopServerSdk>, {
	get(_target, prop) {
		const sdk = getWhopSdk();
		// If SDK is null (build time or missing env vars), return a mock proxy
		if (!sdk) {
			return createMockProxy([String(prop)]);
		}
		return sdk[prop as keyof typeof sdk];
	},
});
