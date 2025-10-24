import { wrapEmailHtml } from "@/lib/email/templates/wrapper";
import { createSignature, buildOpenPayload, buildClickPayload, buildUnsubscribePayload } from "@/lib/tracking/hmac";
import { renderEmailFooterHtml } from "@/lib/email/footer";

type TrackingContext = {
  campaignId: number;
  memberId: number;
  html: string;
  footerBrand: string;
  footerText: string | null;
};

function appendBeforeBodyClose(html: string, snippet: string): string {
  if (!snippet) return html;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${snippet}</body>`);
  }
  return `${html}${snippet}`;
}

export function buildTrackedEmailHtml(context: TrackingContext): string {
  const { campaignId, memberId, html, footerBrand, footerText } = context;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  const openPayload = buildOpenPayload(String(campaignId), String(memberId));
  const openSig = createSignature(openPayload);
  const openPixelSrc = `${base}/api/track/open?c=${campaignId}&m=${memberId}&sig=${openSig}`;
  const openPixel = `<img src="${openPixelSrc}" width="1" height="1" style="display:none;" />`;

  const trackedHtml = html.replace(/href="([^"]+)"/g, (match, url) => {
    try {
      const encoded = encodeURIComponent(url);
      const clickPayload = buildClickPayload(String(campaignId), String(memberId), encoded);
      const sig = createSignature(clickPayload);
      return `href="${base}/api/track/click?c=${campaignId}&m=${memberId}&u=${encoded}&sig=${sig}"`;
    } catch {
      return match;
    }
  });

  const unsubPayload = buildUnsubscribePayload(String(campaignId), String(memberId));
  const unsubSig = createSignature(unsubPayload);
  const unsubscribeUrl = `${base}/api/unsubscribe?c=${campaignId}&m=${memberId}&sig=${unsubSig}`;
  const safeBrand = footerBrand || "MemberMail";
  const footerHtml = renderEmailFooterHtml(safeBrand, unsubscribeUrl, footerText);

  const htmlWithFooter = appendBeforeBodyClose(trackedHtml, footerHtml);
  const htmlWithPixel = appendBeforeBodyClose(htmlWithFooter, openPixel);

  const hasHtmlDocument = /<html[\s>]/i.test(htmlWithPixel);
  return hasHtmlDocument ? htmlWithPixel : wrapEmailHtml(htmlWithPixel);
}
