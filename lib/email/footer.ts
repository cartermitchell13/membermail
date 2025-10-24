export function renderEmailFooterHtml(brand: string, unsubscribeUrl: string, footerText?: string | null): string {
	const safeBrand = brand || "MemberMail";
	const custom = footerText
		? `<p class="email-footer__note" style="margin:16px 0 0;color:#a1a1aa;font-size:12px;line-height:1.5;">${escapeHtml(footerText)}</p>`
		: "";

	return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-footer" style="margin-top:48px;border-top:1px solid #e4e4e7;">
	<tr>
		<td align="center" class="email-footer__cell" style="padding:0;">
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-footer__content" style="max-width:600px;">
				<tr>
					<td class="email-footer__inner" style="padding:40px 32px;text-align:center;">
						<div class="email-footer__brand" style="font-size:18px;font-weight:700;color:#18181b;letter-spacing:-0.02em;margin:0 0 20px;">${escapeHtml(safeBrand)}</div>
						<div class="email-footer__divider" style="width:64px;height:2px;background-color:#d4d4d8;margin:0 auto 24px;border-radius:9999px;"></div>
						<p class="email-footer__support" style="color:#71717a;font-size:13px;line-height:1.6;margin:0 0 20px;">You're receiving this email because you opted in to receive updates.</p>
						<div class="email-footer__cta-wrap" style="margin:0 0 24px;">
							<a href="${unsubscribeUrl}" class="email-footer__cta" style="display:inline-block;padding:10px 22px;border-radius:9999px;background-color:#0f172a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;">Manage Preferences</a>
						</div>
						${custom}
						<div class="email-footer__bottom" style="margin-top:28px;padding-top:20px;border-top:1px solid #e4e4e7;">
							<p class="email-footer__copyright" style="margin:0;color:#a1a1aa;font-size:11px;line-height:1.5;">
								&copy; ${new Date().getFullYear()} ${escapeHtml(safeBrand)}. All rights reserved.
							</p>
						</div>
					</td>
				</tr>
			</table>
		</td>
	</tr>
</table>`;
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
