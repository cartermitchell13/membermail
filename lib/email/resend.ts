import { Resend } from "resend";

function requireEnv(name: string): string {
	const v = process.env[name];
	if (!v) throw new Error(`Missing env: ${name}`);
	return v;
}

export const resend = new Resend(requireEnv("RESEND_API_KEY"));

export async function sendEmail(options: { to: string; subject: string; html: string; from?: string }) {
	const from = options.from ?? process.env.EMAIL_FROM ?? "MemberMail <no-reply@example.com>";
	return resend.emails.send({ from, to: options.to, subject: options.subject, html: options.html });
}


