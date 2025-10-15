import { Resend } from "resend";

function requireEnv(name: string): string {
	const v = process.env[name];
	if (!v) throw new Error(`Missing env: ${name}`);
	return v;
}

// Lazy initialization - only create Resend instance when needed, not at module load time
let resendInstance: Resend | null = null;
function getResend(): Resend {
	if (!resendInstance) {
		resendInstance = new Resend(requireEnv("RESEND_API_KEY"));
	}
	return resendInstance;
}

export async function sendEmail(options: { to: string; subject: string; html: string; from?: string }) {
	const from = options.from ?? process.env.EMAIL_FROM ?? "MemberMail <no-reply@example.com>";
	const resend = getResend();
	return resend.emails.send({ from, to: options.to, subject: options.subject, html: options.html });
}


