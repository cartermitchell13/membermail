import crypto from "node:crypto";

function getSecret(): string {
	return process.env.TRACKING_HMAC_SECRET || "dev_secret_change_me";
}

export function createSignature(payload: string): string {
	const hmac = crypto.createHmac("sha256", getSecret());
	hmac.update(payload);
	return hmac.digest("hex");
}

export function verifySignature(payload: string, signature: string | null | undefined): boolean {
	if (!signature) return false;
	const expected = createSignature(payload);
	try {
		return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
	} catch {
		return false;
	}
}

export function buildOpenPayload(campaignId: string, memberId: string): string {
	return `open|c=${campaignId}&m=${memberId}`;
}

export function buildClickPayload(campaignId: string, memberId: string, url: string): string {
	return `click|c=${campaignId}&m=${memberId}&u=${url}`;
}


