/**
 * Decodes HTML entities if the content has been encoded
 */
function decodeHtmlEntities(text: string): string {
    const textArea = typeof document !== 'undefined' ? document.createElement('textarea') : null;
    if (textArea) {
        textArea.innerHTML = text;
        return textArea.value;
    }
    // Fallback for server-side: decode common entities
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
}

/**
 * Cleans editor HTML by removing editor-specific classes and attributes
 */
function cleanEditorHtml(html: string): string {
    // First decode any HTML entities
    let cleaned = decodeHtmlEntities(html);
    
    // CRITICAL: Remove data URI images (base64 encoded images)
    // These make emails huge and most email clients don't support them
    // Replace with a placeholder or remove entirely
    cleaned = cleaned.replace(/<img[^>]*src="data:image\/[^"]+base64,[^"]*"[^>]*>/gi, 
        '<div style="padding: 20px; background: #f0f0f0; border: 2px dashed #ccc; text-align: center; color: #666;">[Image removed - please use uploaded images for emails]</div>');
    
    // Remove editor-specific classes like prose, prose-invert, etc.
    cleaned = cleaned.replace(/\sclass="[^"]*prose[^"]*"/g, '');
    
    // Remove any data attributes used by the editor
    cleaned = cleaned.replace(/\sdata-[\w-]+="[^"]*"/g, '');
    
    // Remove contenteditable attributes
    cleaned = cleaned.replace(/\scontenteditable="[^"]*"/g, '');
    
    // If the content looks like it's been JSON stringified, try to parse it
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        try {
            cleaned = JSON.parse(cleaned);
        } catch {
            // Not JSON, continue
        }
    }
    
    return cleaned;
}

/**
 * Wraps email content in a proper HTML email structure
 * Ensures proper rendering in email clients
 * @param content - The HTML content to wrap
 * @param options - Optional footer configuration
 */
export function wrapEmailHtml(content: string, options?: { 
    includeFooter?: boolean;
    brandName?: string;
    unsubscribeUrl?: string;
}): string {
    // Clean the content first
    const cleanedContent = cleanEditorHtml(content);
    
    // Build footer if requested
    const footer = options?.includeFooter ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #e5e5e5;">
            <tr>
                <td align="center" style="padding: 20px;">
                    <div style="color: #71717a; font-size: 13px; line-height: 1.6; margin-bottom: 16px;">
                        You're receiving this email because you subscribed to ${options?.brandName || 'our newsletter'}.
                    </div>
                    ${options?.unsubscribeUrl ? `
                    <div style="margin-bottom: 16px;">
                        <a href="${options.unsubscribeUrl}" style="color: #FA4616 !important; text-decoration: underline; font-size: 13px;">
                            Unsubscribe
                        </a>
                    </div>
                    ` : ''}
                    <div style="color: #a1a1aa; font-size: 11px; margin-top: 16px;">
                        © ${new Date().getFullYear()} ${options?.brandName || 'MemberMail'}. All rights reserved.
                    </div>
                </td>
            </tr>
        </table>
    ` : '';
    
    // Return HTML structure with comprehensive email-safe styling
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Email</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <!-- Outer container for centering -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Inner white container/card -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="500" style="max-width: 500px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px 40px;">
                            <!-- Content wrapper with styles -->
                            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333;">
                                <style>
                                    h1, h2, h3, h4, h5, h6 {
                                        margin-top: 24px;
                                        margin-bottom: 16px;
                                        font-weight: 600;
                                        line-height: 1.25;
                                        color: #1a1a1a;
                                    }
                                    h1 { font-size: 32px; margin-top: 0; }
                                    h2 { font-size: 24px; }
                                    h3 { font-size: 20px; }
                                    h4 { font-size: 16px; }
                                    p {
                                        margin-top: 0;
                                        margin-bottom: 16px;
                                        font-size: 16px;
                                        line-height: 1.6;
                                        color: #333333;
                                    }
                                    a {
                                        color: #FA4616 !important;
                                        text-decoration: underline;
                                    }
                                    a:visited {
                                        color: #FA4616 !important;
                                    }
                                    img {
                                        max-width: 100%;
                                        height: auto;
                                        display: block;
                                        margin: 20px 0;
                                        border-radius: 8px;
                                    }
                                    blockquote, .mm-blockquote {
                                        border-left: 4px solid #FA4616;
                                        margin: 20px 0;
                                        padding: 16px 20px;
                                        background-color: #fef5f3;
                                        font-style: italic;
                                        color: #555;
                                    }
                                    ul, ol {
                                        margin: 16px 0;
                                        padding-left: 28px;
                                    }
                                    li {
                                        margin-bottom: 8px;
                                        color: #333333;
                                    }
                                    hr {
                                        border: none;
                                        border-top: 2px solid #e5e5e5;
                                        margin: 32px 0;
                                    }
                                    .mm-columns {
                                        width: 100%;
                                        margin: 20px 0;
                                    }
                                    .mm-columns td {
                                        padding: 0 12px;
                                        vertical-align: top;
                                    }
                                </style>
                                ${cleanedContent}
                                ${footer}
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}
