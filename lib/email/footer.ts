export function renderEmailFooterHtml(brand: string, unsubscribeUrl: string, footerText?: string | null): string {
    const safeBrand = brand || "MemberMail";
    const custom = footerText ? `<div style=\"margin-top:16px;color:#a1a1aa;font-size:11px;line-height:1.5\">${escapeHtml(footerText)}</div>` : "";
    
    return `
<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background:linear-gradient(to bottom, #fafafa 0%, #f4f4f5 100%);margin-top:48px;border-top:1px solid #e4e4e7\">
  <tr>
    <td align=\"center\">
      <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">
        <tr>
          <td style=\"padding:40px 24px;text-align:center\">
            <!-- Brand Name -->
            <div style=\"margin-bottom:20px\">
              <span style=\"font-size:18px;font-weight:700;color:#18181b;letter-spacing:-0.02em\">${escapeHtml(safeBrand)}</span>
            </div>
            
            <!-- Divider -->
            <div style=\"width:60px;height:2px;background:linear-gradient(to right, transparent, #d4d4d8, transparent);margin:0 auto 24px\"></div>
            
            <!-- Subscription Info -->
            <div style=\"margin-bottom:16px;color:#71717a;font-size:13px;line-height:1.6;font-weight:400\">
              You're receiving this email because you opted in to receive updates.
            </div>
            
            <!-- Unsubscribe Link -->
            <div style=\"margin-bottom:24px\">
              <a href=\"${unsubscribeUrl}\" style=\"display:inline-block;color:#3b82f6;text-decoration:none;font-size:13px;font-weight:500;padding:8px 16px;border-radius:6px;background:#eff6ff;transition:background 0.2s ease\">
                Manage Preferences
              </a>
            </div>
            
            <!-- Custom Footer Text -->
            ${custom}
            
            <!-- Bottom Text -->
            <div style=\"margin-top:24px;padding-top:20px;border-top:1px solid #e4e4e7\">
              <div style=\"color:#a1a1aa;font-size:11px;line-height:1.5\">
                © ${new Date().getFullYear()} ${escapeHtml(safeBrand)}. All rights reserved.
              </div>
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


