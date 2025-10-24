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

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
};

export async function sendEmail(options: SendEmailOptions) {
  const from = options.from ?? process.env.EMAIL_FROM ?? "MemberMail <no-reply@mail.membermail.app>";
  const resend = getResend();
  const payload: {
    from: string;
    to: string;
    subject: string;
    html: string;
    reply_to?: string;
  } = {
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  if (options.replyTo) {
    payload.reply_to = options.replyTo;
  }

  return resend.emails.send(payload);
}


