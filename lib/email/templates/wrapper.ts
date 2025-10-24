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

function clampAlpha(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(1, value));
}

function toRgba(color: string, alpha: number, fallback: string): string {
	if (!color) return fallback;
	const trimmed = color.trim();

	const rgbaMatch = trimmed.match(/^rgba?\(([^)]+)\)$/i);
	if (rgbaMatch) {
		const parts = rgbaMatch[1].split(",").map((part) => part.trim());
		if (parts.length >= 3) {
			const r = Number.parseFloat(parts[0]);
			const g = Number.parseFloat(parts[1]);
			const b = Number.parseFloat(parts[2]);
			if ([r, g, b].some((component) => Number.isNaN(component))) {
				return fallback;
			}
			const baseAlpha = parts.length >= 4 ? clampAlpha(Number.parseFloat(parts[3])) : 1;
			const finalAlpha = clampAlpha(baseAlpha * alpha);
			return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Number(finalAlpha.toFixed(3))})`;
		}
	}

	const hexMatch = trimmed.match(/^#([0-9a-fA-F]{3,8})$/);
	if (hexMatch) {
		let hex = hexMatch[1];

		if (hex.length === 3 || hex.length === 4) {
			const r = hex[0];
			const g = hex[1];
			const b = hex[2];
			const a = hex.length === 4 ? hex[3] : "f";
			hex = `${r}${r}${g}${g}${b}${b}${a}${a}`;
		}

		let baseAlpha = 1;
		if (hex.length === 8) {
			baseAlpha = clampAlpha(parseInt(hex.slice(6, 8), 16) / 255);
			hex = hex.slice(0, 6);
		}

		if (hex.length === 6) {
			const r = parseInt(hex.slice(0, 2), 16);
			const g = parseInt(hex.slice(2, 4), 16);
			const b = parseInt(hex.slice(4, 6), 16);
			const finalAlpha = clampAlpha(baseAlpha * alpha);
			return `rgba(${r}, ${g}, ${b}, ${Number(finalAlpha.toFixed(3))})`;
		}
	}

	return fallback;
}

function withAlpha(color: string, alpha: number, fallback?: string): string {
	const safeFallback = fallback ?? `rgba(0, 0, 0, ${alpha})`;
	return toRgba(color, alpha, safeFallback);
}

function parseRgb(color: string | undefined): { r: number; g: number; b: number } | null {
	if (!color) return null;
	const trimmed = color.trim();
	if (!trimmed) return null;

	if (trimmed.startsWith("#")) {
		let hex = trimmed.slice(1);
		if (hex.length === 3) {
			hex = hex.split("").map((char) => char + char).join("");
		} else if (hex.length === 4) {
			hex = hex
				.slice(0, 3)
				.split("")
				.map((char) => char + char)
				.join("");
		} else if (hex.length === 8) {
			hex = hex.slice(0, 6);
		} else if (hex.length !== 6) {
			return null;
		}
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		if ([r, g, b].some((val) => Number.isNaN(val))) return null;
		return { r, g, b };
	}

	const rgbMatch = trimmed.match(/^rgba?\((.+)\)$/i);
	if (rgbMatch) {
		const parts = rgbMatch[1].split(",").map((part) => part.trim());
		if (parts.length < 3) return null;

		const parseChannel = (value: string): number | null => {
			if (value.endsWith("%")) {
				const perc = Number.parseFloat(value.slice(0, -1));
				if (Number.isNaN(perc)) return null;
				return Math.round(Math.max(0, Math.min(100, perc)) * 2.55);
			}
			const num = Number.parseFloat(value);
			if (Number.isNaN(num)) return null;
			return Math.max(0, Math.min(255, Math.round(num)));
		};

		const r = parseChannel(parts[0]);
		const g = parseChannel(parts[1]);
		const b = parseChannel(parts[2]);
		if (r === null || g === null || b === null) return null;
		return { r, g, b };
	}

	return null;
}

function toHexChannel(value: number): string {
	return value.toString(16).padStart(2, "0").toUpperCase();
}

function normalizeColor(color: string | undefined, fallback: string): string {
	const parsed = parseRgb(color);
	if (parsed) {
		return `#${toHexChannel(parsed.r)}${toHexChannel(parsed.g)}${toHexChannel(parsed.b)}`;
	}
	const fallbackParsed = parseRgb(fallback);
	if (fallbackParsed) {
		return `#${toHexChannel(fallbackParsed.r)}${toHexChannel(fallbackParsed.g)}${toHexChannel(fallbackParsed.b)}`;
	}
	return "#FFFFFF";
}

function relativeLuminance(color: string | undefined): number {
	const parsed = parseRgb(color);
	if (!parsed) return 1;
	const normalizeChannel = (value: number) => {
		const channel = value / 255;
		return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
	};
	const r = normalizeChannel(parsed.r);
	const g = normalizeChannel(parsed.g);
	const b = normalizeChannel(parsed.b);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isDarkColor(color: string | undefined): boolean {
	return relativeLuminance(color) < 0.45;
}

/**
 * Email style configuration
 */
export interface EmailStyles {
	outsideBackground?: string;
	postBackground?: string;
	textOnBackground?: string;
	primary?: string;
	textOnPrimary?: string;
	secondary?: string;
	links?: string;
	headingFontFamily?: string;
	headingFontWeight?: string;
	paragraphFontFamily?: string;
	paragraphFontWeight?: string;
	margin?: number;
	padding?: number;
}

/**
 * Wraps email content in a proper HTML email structure
 * Ensures proper rendering in email clients
 * @param content - The HTML content to wrap
 * @param options - Optional footer configuration and custom styles
 */
export function wrapEmailHtml(content: string, options?: { 
    includeFooter?: boolean;
    brandName?: string;
    unsubscribeUrl?: string;
	styles?: EmailStyles;
}): string {
    // Clean the content first
    const cleanedContent = cleanEditorHtml(content);
	const contentWithoutMarker = cleanedContent.replace(/<!--\s*EMAIL_STYLES:\s*(.*?)\s*-->\s*/gi, "");
	
	// Extract custom styles if embedded in content
	const styleMatch = content.match(/<!-- EMAIL_STYLES: (.*?) -->/);
	let customStyles: EmailStyles = {};
	if (styleMatch) {
		try {
			customStyles = JSON.parse(decodeURIComponent(styleMatch[1]));
		} catch {
			// Ignore parsing errors
		}
	}
	
	// Merge with provided styles (provided styles take precedence)
	const styles: EmailStyles = { ...customStyles, ...options?.styles };
	
	// Apply default values
	const outsideBackground = styles.outsideBackground || '#f5f5f5';
	const postBackground = styles.postBackground || '#ffffff';
	const textColor = styles.textOnBackground || '#333333';
	const outsideBackgroundHex = normalizeColor(outsideBackground, '#f5f5f5');
	const postBackgroundHex = normalizeColor(postBackground, '#ffffff');
	const forcedColorScheme = isDarkColor(postBackgroundHex) ? 'dark' : 'light';
	const linkColor = styles.links || '#FA4616';
	const headingColor = styles.textOnBackground || '#1a1a1a';
	const margin = styles.margin !== undefined ? styles.margin : 40;
	const padding = styles.padding !== undefined ? styles.padding : 40;
	const headingFont = styles.headingFontFamily || '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif';
	const paragraphFont = styles.paragraphFontFamily || '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif';
	const headingWeight = styles.headingFontWeight || '600';
	const paragraphWeight = styles.paragraphFontWeight || '400';
	const footerTextMuted = withAlpha(textColor, 0.65, 'rgba(113, 113, 122, 0.65)');
	const footerTextSubtle = withAlpha(textColor, 0.55, 'rgba(161, 161, 170, 0.6)');
	const footerDividerColor = withAlpha(textColor, 0.16, 'rgba(161, 161, 170, 0.18)');
	const footerBorderColor = withAlpha(textColor, 0.14, 'rgba(161, 161, 170, 0.2)');
	const footerButtonBg = styles.primary || linkColor;
	const footerButtonText = styles.textOnPrimary || '#ffffff';
	const footerButtonShadow = withAlpha(footerButtonBg, 0.2, 'rgba(0, 0, 0, 0.12)');
	const outsideBackgroundAttr = `background-color: ${outsideBackground};`;
	const postBackgroundAttr = `background-color: ${postBackground};`;
    
    // Build footer if requested
    const footer = options?.includeFooter ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #e5e5e5;">
            <tr>
                <td align="center" style="padding: 20px;">
                    <div style="color: #71717a; font-size: 13px; line-height: 1.6; margin-bottom: 16px; font-family: ${paragraphFont};">
                        You're receiving this email because you subscribed to ${options?.brandName || 'our newsletter'}.
                    </div>
                    ${options?.unsubscribeUrl ? `
                    <div style="margin-bottom: 16px;">
                        <a href="${options.unsubscribeUrl}" style="color: ${linkColor} !important; text-decoration: underline; font-size: 13px; font-family: ${paragraphFont};">
                            Unsubscribe
                        </a>
                    </div>
                    ` : ''}
                    <div style="color: #a1a1aa; font-size: 11px; margin-top: 16px; font-family: ${paragraphFont};">
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
    <meta name="color-scheme" content="${forcedColorScheme}">
    <meta name="supported-color-schemes" content="${forcedColorScheme}">
    <title>Email</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
        body, table, td {background-color: ${outsideBackground} !important; color: ${textColor} !important;}
    </style>
    <![endif]-->
</head>
<body data-mm-force-scheme="${forcedColorScheme}" style="margin: 0; padding: 0; background-color: ${outsideBackground}; color: ${textColor}; font-family: ${paragraphFont}; color-scheme: ${forcedColorScheme};" bgcolor="${outsideBackgroundHex}" data-ogsb="${outsideBackgroundAttr}" data-ogsc="${outsideBackgroundAttr}">
    <!-- Outer container for centering -->
    <table class="email-wrapper" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${outsideBackground};" bgcolor="${outsideBackgroundHex}" data-ogsb="${outsideBackgroundAttr}" data-ogsc="${outsideBackgroundAttr}">
        <tr>
            <td align="center" style="padding: ${margin}px 20px; background-color: ${outsideBackground};" bgcolor="${outsideBackgroundHex}" data-ogsb="${outsideBackgroundAttr}" data-ogsc="${outsideBackgroundAttr}">
                <!-- Inner white container/card -->
                <table class="email-content" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: ${postBackground}; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px rgba(15, 23, 42, 0.08); border: 1px solid ${withAlpha(headingColor, 0.08, 'rgba(15, 23, 42, 0.08)')};" bgcolor="${postBackgroundHex}" data-ogsb="${postBackgroundAttr}" data-ogsc="${postBackgroundAttr}">
                    <tr>
                        <td style="padding: ${padding}px ${padding}px; background-color: ${postBackground};" bgcolor="${postBackgroundHex}" data-ogsb="${postBackgroundAttr}" data-ogsc="${postBackgroundAttr}">
                            <!-- Content wrapper with styles -->
                            <div class="email-inner" style="font-family: ${paragraphFont}; line-height: 1.6; color: ${textColor}; font-weight: ${paragraphWeight}; background-color: ${postBackground};">
                                <style>
                                    :root {
                                        color-scheme: ${forcedColorScheme};
                                        supported-color-schemes: ${forcedColorScheme};
                                    }
                                    body[data-mm-force-scheme] {
                                        background-color: ${outsideBackground} !important;
                                        color: ${textColor} !important;
                                    }
                                    body[data-mm-force-scheme] .email-wrapper {
                                        background-color: ${outsideBackground} !important;
                                    }
                                    body[data-mm-force-scheme] .email-content,
                                    body[data-mm-force-scheme] .email-inner {
                                        background-color: ${postBackground} !important;
                                    }
                                    @media (prefers-color-scheme: dark) {
                                        body[data-mm-force-scheme] {
                                            background-color: ${outsideBackground} !important;
                                            color: ${textColor} !important;
                                        }
                                        body[data-mm-force-scheme] .email-wrapper {
                                            background-color: ${outsideBackground} !important;
                                        }
                                        body[data-mm-force-scheme] .email-content,
                                        body[data-mm-force-scheme] .email-inner {
                                            background-color: ${postBackground} !important;
                                        }
                                    }
                                    h1, h2, h3, h4, h5, h6 {
                                        margin-top: 24px;
                                        margin-bottom: 16px;
                                        font-weight: ${headingWeight};
                                        line-height: 1.25;
                                        color: ${headingColor};
                                        font-family: ${headingFont};
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
                                        color: ${textColor};
                                        font-family: ${paragraphFont};
                                        font-weight: ${paragraphWeight};
                                    }
                                    a {
                                        color: ${linkColor} !important;
                                        text-decoration: underline;
                                    }
                                    a:visited {
                                        color: ${linkColor} !important;
                                    }
                                    img {
                                        max-width: 100%;
                                        height: auto;
                                        display: block;
                                        margin: 20px 0;
                                        border-radius: 8px;
                                    }
                                    blockquote, .mm-blockquote {
                                        border-left: 4px solid ${linkColor};
                                        margin: 20px 0;
                                        padding: 16px 20px;
                                        background-color: #fef5f3;
                                        font-style: italic;
                                        color: ${textColor};
                                        font-family: ${paragraphFont};
                                    }
                                    ul, ol {
                                        margin: 16px 0;
                                        padding-left: 28px;
                                        font-family: ${paragraphFont};
                                    }
                                    li {
                                        margin-bottom: 8px;
                                        color: ${textColor};
                                        font-family: ${paragraphFont};
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
                                    .email-footer {
                                        width: 100% !important;
                                        margin-top: 48px !important;
                                        border-top: 1px solid ${footerBorderColor} !important;
                                        background-color: ${postBackground} !important;
                                        border-collapse: separate;
                                        border-spacing: 0;
                                    }
                                    .email-footer__cell {
                                        padding: 0 !important;
                                    }
                                    .email-footer__content {
                                        width: 100%;
                                        max-width: 600px;
                                        border-collapse: separate;
                                        border-spacing: 0;
                                        background-color: ${postBackground} !important;
                                    }
                                    .email-footer__inner {
                                        padding: 40px 32px !important;
                                        text-align: center !important;
                                    }
                                    .email-footer__brand {
                                        font-size: 18px;
                                        font-weight: 700;
                                        color: ${headingColor} !important;
                                        letter-spacing: -0.02em;
                                        margin: 0 0 20px 0;
                                    }
                                    .email-footer__divider {
                                        width: 64px;
                                        height: 2px;
                                        background-color: ${footerDividerColor} !important;
                                        margin: 0 auto 24px;
                                        border-radius: 9999px;
                                    }
                                    .email-footer__support {
                                        color: ${footerTextMuted} !important;
                                        font-size: 13px;
                                        line-height: 1.6;
                                        margin: 0 0 20px 0;
                                    }
                                    .email-footer__cta-wrap {
                                        margin: 0 0 24px 0;
                                    }
                                    .email-footer__cta {
                                        display: inline-block;
                                        padding: 10px 22px;
                                        border-radius: 9999px;
                                        background-color: ${footerButtonBg} !important;
                                        color: ${footerButtonText} !important;
                                        text-decoration: none;
                                        font-size: 13px;
                                        font-weight: 600;
                                        box-shadow: 0 12px 24px ${footerButtonShadow};
                                        transition: opacity 0.2s ease, transform 0.2s ease;
                                    }
                                    .email-footer__cta:hover,
                                    .email-footer__cta:focus {
                                        opacity: 0.9;
                                        transform: translateY(-1px);
                                    }
                                    .email-footer__note {
                                        margin: 16px 0 0 0;
                                        color: ${footerTextSubtle} !important;
                                        font-size: 12px;
                                        line-height: 1.5;
                                    }
                                    .email-footer__bottom {
                                        margin-top: 28px;
                                        padding-top: 20px;
                                        border-top: 1px solid ${footerBorderColor} !important;
                                    }
                                    .email-footer__copyright {
                                        margin: 0;
                                        color: ${footerTextSubtle} !important;
                                        font-size: 11px;
                                        line-height: 1.5;
                                    }
                                    .email-footer__support a,
                                    .email-footer__note a,
                                    .email-footer__copyright a {
                                        color: ${linkColor} !important;
                                    }
                                    @media (prefers-color-scheme: dark) {
                                        .email-footer {
                                            background-color: ${postBackground} !important;
                                        }
                                        .email-footer__content {
                                            background-color: ${postBackground} !important;
                                        }
                                    }
                                    @media only screen and (max-width: 600px) {
                                        .email-footer__inner {
                                            padding: 28px 18px !important;
                                        }
                                        .email-footer__divider {
                                            width: 48px !important;
                                        }
                                        .email-footer__cta {
                                            width: 100% !important;
                                        }
                                    }
                                </style>
                                ${contentWithoutMarker}
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
