import { NextRequest } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { wrapEmailHtml } from "@/lib/email/templates/wrapper";
import { renderEmailFooterHtml } from "@/lib/email/footer";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import {
    fetchSenderIdentityByUserId,
    formatSenderAddress,
    isSenderIdentityComplete,
} from "@/lib/email/sender-identity";
import { getSubscriptionAccess } from "@/lib/subscriptions/access";

function appendBeforeBodyClose(html: string, snippet: string): string {
    if (!snippet) return html;
    if (/<\/body>/i.test(html)) {
        return html.replace(/<\/body>/i, `${snippet}</body>`);
    }
    return `${html}${snippet}`;
}

/**
 * API endpoint to send a test email with draft content
 * This allows users to preview their campaign before saving it
 * POST body: { to: string, subject: string, html: string }
 */
export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const body = await req.json().catch(() => ({}));
        const { to, subject, html, companyId } = body as Record<string, unknown>;

        // Validate required fields
        if (!to || typeof to !== "string") {
            return new Response(JSON.stringify({ error: "Missing 'to' email address" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!subject || typeof subject !== "string") {
            return new Response(JSON.stringify({ error: "Missing 'subject'" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!html || typeof html !== "string") {
            return new Response(JSON.stringify({ error: "Missing 'html' content" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!companyId || typeof companyId !== "string") {
            return new Response(JSON.stringify({ error: "Missing 'companyId'" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const access = await getSubscriptionAccess({ companyId });
        if (!access.canSend) {
            return new Response(
                JSON.stringify({
                    error: "Sending test emails requires a Pro or Enterprise subscription",
                    tier: access.tier,
                }),
                {
                    status: 402,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            return new Response(JSON.stringify({ error: "Invalid email address" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Log the first 500 characters of HTML for debugging
        console.log('Received HTML (first 500 chars):', html.substring(0, 500));
        console.log('HTML type:', typeof html);
        console.log('HTML length:', html.length);

        const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
        const unsubscribeUrl = `${base || "https://app.membermail.com"}/api/unsubscribe?c=0&m=0&sig=demo`;
        const footerHtml = renderEmailFooterHtml("MemberMail", unsubscribeUrl, null);
        const htmlWithFooter = appendBeforeBodyClose(html, footerHtml);

        const hasHtmlDocument = /<html[\s>]/i.test(htmlWithFooter);
        
        // Wrap HTML content in proper email structure if needed
        const wrappedHtml = hasHtmlDocument ? htmlWithFooter : wrapEmailHtml(htmlWithFooter);

        // Load sender identity (required for all sends)
        const supabase = getAdminSupabaseClient();
        const { data: community } = await supabase
            .from("communities")
            .select("id, user_id, reply_to_email")
            .eq("whop_community_id", companyId)
            .single();

        if (!community) {
            return new Response(JSON.stringify({ error: "Community not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        const identity = await fetchSenderIdentityByUserId(supabase, community.user_id);
        if (!isSenderIdentityComplete(identity)) {
            return new Response(JSON.stringify({ error: "Sender identity not configured" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const fromAddress = formatSenderAddress({
            displayName: identity.displayName,
            mailUsername: identity.mailUsername,
        });
        const replyToAddress = community.reply_to_email ?? undefined;

        // Log wrapped HTML preview
        console.log('Wrapped HTML (first 500 chars):', wrappedHtml.substring(0, 500));

        // Send the test email with [TEST] prefix
        await sendEmail({ 
            to, 
            subject: `[TEST] ${subject}`, 
            html: wrappedHtml,
            from: fromAddress,
            replyTo: replyToAddress,
        });

        // Return success response
        return Response.json({ 
            success: true, 
            message: `Test email sent to ${to}` 
        });

    } catch (error) {
        console.error("Error sending test email:", error);
        return new Response(JSON.stringify({ 
            error: "Failed to send test email",
            details: error instanceof Error ? error.message : "Unknown error"
        }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
