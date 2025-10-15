import { WhopServerSdk } from "@whop/api";

// Lazy initialization - only create SDK instance when needed, not at module load time
let sdkInstance: ReturnType<typeof WhopServerSdk> | null = null;

function getWhopSdk() {
	if (!sdkInstance) {
		sdkInstance = WhopServerSdk({
			// Add your app id here - this is required.
			// You can get this from the Whop dashboard after creating an app section.
			appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "app_placeholder",

			// Add your app api key here - this is required.
			// You can get this from the Whop dashboard after creating an app section.
			appApiKey: process.env.WHOP_API_KEY ?? "key_placeholder",

			// This will make api requests on behalf of this user.
			// This is optional, however most api requests need to be made on behalf of a user.
			// You can create an agent user for your app, and use their userId here.
			// You can also apply a different userId later with the `withUser` function.
			onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,

			// This is the companyId that will be used for the api requests.
			// When making api requests that query or mutate data about a company, you need to specify the companyId.
			// This is optional, however if not specified certain requests will fail.
			// This can also be applied later with the `withCompany` function.
			companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
		});
	}
	return sdkInstance;
}

export const whopSdk = new Proxy({} as ReturnType<typeof WhopServerSdk>, {
	get(_target, prop) {
		const sdk = getWhopSdk();
		return sdk[prop as keyof typeof sdk];
	},
});
