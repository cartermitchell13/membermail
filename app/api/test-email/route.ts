import { NextRequest } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { wrapEmailHtml } from "@/lib/email/templates/wrapper";

/**
 * API endpoint to send a test email with draft content
 * This allows users to preview their campaign before saving it
 * POST body: { to: string, subject: string, html: string }
 */
export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const body = await req.json().catch(() => ({}));
        const { to, subject, html } = body;

        // Validate required fields
        if (!to) {
            return new Response(JSON.stringify({ error: "Missing 'to' email address" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!subject) {
            return new Response(JSON.stringify({ error: "Missing 'subject'" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!html) {
            return new Response(JSON.stringify({ error: "Missing 'html' content" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
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

        // Wrap HTML content in proper email structure
        const wrappedHtml = wrapEmailHtml(html);
        
        // Log wrapped HTML preview
        console.log('Wrapped HTML (first 500 chars):', wrappedHtml.substring(0, 500));

        // Send the test email with [TEST] prefix
        await sendEmail({ 
            to, 
            subject: `[TEST] ${subject}`, 
            html: wrappedHtml
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
