import { EmailStyles } from "@/components/email-builder/ui/EmailStylePanel";

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
  const normalize = (value: number) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  };
  const r = normalize(parsed.r);
  const g = normalize(parsed.g);
  const b = normalize(parsed.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isDarkColor(color: string | undefined): boolean {
  return relativeLuminance(color) < 0.45;
}

/**
 * Render email HTML with custom color styles applied
 * Wraps the content in a styled email template with color customization only
 */
// Note: CTA markup should be a single anchor within a container.
// In some edge cases, editor marks can leave stray sibling text/links
// next to the CTA anchor when serialized. The helper below collapses
// that content so the preview matches the editor.
function normalizeCtaHtml(content: string, styles: EmailStyles): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div id="__mm_root">${content}</div>`, "text/html");
    const root = doc.getElementById("__mm_root");
    if (!root) return content;

    root.querySelectorAll('div[data-cta]').forEach((wrap) => {
      const anchors = Array.from(wrap.querySelectorAll('a.mm-cta')) as HTMLAnchorElement[];
      // Snapshot any style/data from the first anchor before pruning
      let preserved: Partial<{ bg: string; text: string; radius: string; padding: string; variant: string; style: string }>|null = null;
      if (anchors[0]) {
        const a0 = anchors[0] as HTMLAnchorElement;
        const ds = (a0 as HTMLElement).dataset as any;
        preserved = {
          bg: ds.bgColor || '',
          text: ds.textColor || '',
          radius: ds.borderRadius || '',
          padding: ds.padding || '',
          variant: a0.getAttribute('data-variant') || '',
          style: a0.getAttribute('style') || ''
        };
      }
      // Remove any empty anchors first
      anchors.forEach((a) => {
        if (!a.textContent || a.textContent.trim().length === 0) a.remove();
      });
      // Recompute after removals
      const remaining = Array.from(wrap.querySelectorAll('a.mm-cta')) as HTMLAnchorElement[];
      let anchor = remaining[0] ?? null;
      if (!anchor) {
        // If no anchor remains but text exists, create one
        const label = (wrap.textContent || '').trim();
        if (!label) return;
        const a = doc.createElement('a');
        a.className = 'mm-cta mm-cta-primary';
        a.textContent = label;
        // Reapply preserved data attributes/styles if we captured them
        if (preserved) {
          if (preserved.variant) a.setAttribute('data-variant', preserved.variant);
          if (preserved.bg) (a as any).dataset.bgColor = preserved.bg;
          if (preserved.text) (a as any).dataset.textColor = preserved.text;
          if (preserved.radius) (a as any).dataset.borderRadius = preserved.radius;
          if (preserved.padding) (a as any).dataset.padding = preserved.padding;
          if (preserved.style) a.setAttribute('style', preserved.style);
        }
        // Clear and append
        while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
        wrap.appendChild(a);
        anchor = a;
      }
      const fullText = (wrap.textContent || '').trim();
      const anchorText = (anchor.textContent || '').trim();
      if (fullText && fullText !== anchorText) {
        // Replace container children with only the anchor containing the full label text
        anchor.textContent = fullText;
        // Remove all children then re-append anchor
        while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
        wrap.appendChild(anchor);
      } else {
        // Ensure there is only a single anchor child
        const children = Array.from(wrap.childNodes);
        if (!(children.length === 1 && children[0] === anchor)) {
          while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
          wrap.appendChild(anchor);
        }

        // Apply inline styles from data attributes if missing so preview color matches editor
        const ds = (anchor as HTMLElement).dataset as any;
        const style = anchor.getAttribute('style') || '';
        const parts: string[] = [style];

        // Strip Tailwind text color and underline utility classes that override CTA colors
        try {
          anchor.classList.remove('underline');
          Array.from(anchor.classList).forEach((cls) => {
            if (cls.startsWith('text-')) anchor.classList.remove(cls);
          });
        } catch {}
        const variant = (anchor.getAttribute('data-variant') || 'primary').toLowerCase();
        const hasBgInline = /background(-color)?:/i.test(style);
        const hasColorInline = /\bcolor:/i.test(style);

        // Determine fallbacks when data attributes are absent
        const resolvedBg = ds.bgColor || (variant !== 'outline' ? styles.primary : undefined);
        const resolvedText = ds.textColor || (variant !== 'outline' ? styles.textOnPrimary : styles.primary);

        // Apply background/text color based on variant, preferring existing inline/data
        if (!hasBgInline) {
          if (variant === 'outline') {
            parts.push(`background-color: transparent`);
          } else if (resolvedBg) {
            parts.push(`background-color: ${resolvedBg}`);
          }
        }
        if (!hasColorInline && resolvedText) {
          parts.push(`color: ${resolvedText}`);
        }

        // Border style according to variant
        if (variant === 'outline') {
          const outlineColor = ds.bgColor || styles.primary;
          parts.push(`border: 2px solid ${outlineColor}`);
        } else {
          parts.push('border: 2px solid transparent');
        }

        if (ds.borderRadius) {
          const radiusVal = String(ds.borderRadius).replace(/[^0-9.]/g, '');
          parts.push(`border-radius: ${radiusVal}px !important`);
        }
        if (ds.padding && !/padding:/i.test(style)) {
          parts.push(`padding: ${ds.padding}`);
        }

        // Ensure button-like display regardless of external CSS
        if (!/display\s*:/i.test(style)) {
          parts.push('display: inline-block');
        }
        if (!/text-decoration\s*:/i.test(style)) {
          parts.push('text-decoration: none');
        }
        const nextStyle = parts.join('; ').trim();
        if (nextStyle && nextStyle !== style) anchor.setAttribute('style', nextStyle);
      }
    });

    return root.innerHTML;
  } catch {
    return content;
  }
}

export function renderEmailWithStyles(content: string, styles: EmailStyles): string {
	const outsideBackgroundValue = styles.outsideBackground || "#FFFFFF";
	const postBackgroundValue = styles.postBackground || "#FFFFFF";
	const textColorValue = styles.textOnBackground || "#2D2D2D";
	const outsideBackgroundHex = normalizeColor(outsideBackgroundValue, "#f5f5f5");
	const postBackgroundHex = normalizeColor(postBackgroundValue, "#ffffff");
	const forcedColorScheme = isDarkColor(postBackgroundHex) ? "dark" : "light";
	const fallbackMuted = "rgba(45, 45, 45, 0.6)";
	const footerTextMuted = withAlpha(styles.textOnBackground, 0.65, fallbackMuted);
	const footerTextSubtle = withAlpha(styles.textOnBackground, 0.55, "rgba(45, 45, 45, 0.55)");
	const footerDividerColor = withAlpha(styles.textOnBackground, 0.16, "rgba(45, 45, 45, 0.16)");
	const footerBorderColor = withAlpha(styles.textOnBackground, 0.14, "rgba(45, 45, 45, 0.14)");
	const footerButtonShadow = withAlpha(styles.primary, 0.2, "rgba(0, 0, 0, 0.1)");
	const footerButtonBg = styles.primary || "#030712";
	const footerButtonText = styles.textOnPrimary || "#FFFFFF";
	const footerLinkColor = styles.links || footerButtonBg;

	// Create CSS for the email with color styles only
	const emailCSS = `
		/* Reset styles for email clients */
		body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
		table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
		img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

		:root {
			color-scheme: ${forcedColorScheme};
			supported-color-schemes: ${forcedColorScheme};
		}
		
		/* Email container styles - colors only */
		body {
			margin: 0;
			padding: 0;
			width: 100% !important;
			background-color: ${outsideBackgroundValue} !important;
			color: ${textColorValue} !important;
		}

		body[data-mm-force-scheme] {
			background-color: ${outsideBackgroundValue} !important;
			color: ${textColorValue} !important;
		}
		
		/* Content wrapper - colors only */
		.email-wrapper {
			background-color: ${outsideBackgroundValue} !important;
			padding: 35px;
		}
		
		.email-content {
			max-width: 600px;
			margin: 0 auto;
			background-color: ${postBackgroundValue} !important;
			padding: 40px !important;
			box-sizing: border-box;
			border-radius: 24px !important;
			overflow: hidden !important;
		}
		
		.email-footer {
			width: 100%;
			margin-top: 48px !important;
			border-collapse: separate;
			border-spacing: 0;
			background-color: ${styles.postBackground} !important;
			border-top: 1px solid ${footerBorderColor} !important;
		}

		.email-footer__cell {
			padding: 0 !important;
		}

		.email-footer__content {
			width: 100%;
			max-width: 600px;
			border-collapse: separate;
			border-spacing: 0;
			background-color: ${styles.postBackground};
		}

		.email-footer__inner {
			padding: 40px 32px !important;
			text-align: center !important;
		}

		.email-footer__brand {
			font-size: 18px;
			font-weight: 700;
			color: ${styles.textOnBackground} !important;
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
			color: ${footerLinkColor} !important;
		}

		@media (prefers-color-scheme: dark) {
			body[data-mm-force-scheme] {
				background-color: ${outsideBackgroundValue} !important;
				color: ${textColorValue} !important;
			}
			body[data-mm-force-scheme] .email-wrapper {
				background-color: ${outsideBackgroundValue} !important;
			}
			body[data-mm-force-scheme] .email-content {
				background-color: ${postBackgroundValue} !important;
			}
		}
		
		/* Heading hierarchy - preserve default sizes and weights */
		h1 {
			color: ${styles.textOnBackground};
			font-size: 32px;
			font-weight: 700;
			line-height: 1.2;
			margin: 0 0 16px 0;
		}
		
		h2 {
			color: ${styles.textOnBackground};
			font-size: 24px;
			font-weight: 600;
			line-height: 1.3;
			margin: 24px 0 12px 0;
		}
		
		h3 {
			color: ${styles.textOnBackground};
			font-size: 20px;
			font-weight: 600;
			line-height: 1.4;
			margin: 20px 0 10px 0;
		}
		
		h4 {
			color: ${styles.textOnBackground};
			font-size: 18px;
			font-weight: 600;
			line-height: 1.4;
			margin: 16px 0 8px 0;
		}
		
		h5 {
			color: ${styles.textOnBackground};
			font-size: 16px;
			font-weight: 600;
			line-height: 1.4;
			margin: 12px 0 8px 0;
		}
		
		h6 {
			color: ${styles.textOnBackground};
			font-size: 14px;
			font-weight: 600;
			line-height: 1.4;
			margin: 12px 0 8px 0;
		}
		
		/* Paragraph and list text */
		p {
			color: ${styles.textOnBackground};
			font-size: 16px;
			line-height: 1.6;
			margin: 0 0 16px 0;
		}
		
		/* Bullet lists */
		ul {
			color: ${styles.textOnBackground};
			margin: 0 0 16px 0;
			padding-left: 24px;
			list-style-type: disc;
		}
		
		ul li {
			color: ${styles.textOnBackground};
			font-size: 16px;
			line-height: 1.6;
			margin-bottom: 8px;
		}
		
		/* Numbered lists */
		ol {
			color: ${styles.textOnBackground};
			margin: 0 0 16px 0;
			padding-left: 24px;
			list-style-type: decimal;
		}
		
		ol li {
			color: ${styles.textOnBackground};
			font-size: 16px;
			line-height: 1.6;
			margin-bottom: 8px;
		}
		
		/* Nested lists */
		ul ul, ol ul {
			margin: 8px 0;
			list-style-type: circle;
		}
		
		ul ol, ol ol {
			margin: 8px 0;
		}
		
		/* Links */
		a {
			color: ${styles.links};
			text-decoration: underline;
		}
		
		a:hover {
			color: ${styles.links};
			text-decoration: none;
		}
		
		/* Horizontal rule */
		hr {
			border: none;
			border-top: 2px solid ${styles.textOnBackground};
			opacity: 0.2;
			margin: 24px 0;
		}
		
		/* Blockquote */
		blockquote {
			border-left: 4px solid ${styles.primary};
			margin: 16px 0;
			padding: 12px 20px;
			background-color: rgba(0, 0, 0, 0.02);
			color: ${styles.textOnBackground};
			font-style: italic;
		}
		
		/* CTA Buttons */
		.cta-button, .button-primary, a.cta-button, a.button-primary {
			background-color: ${styles.primary} !important;
			color: ${styles.textOnPrimary} !important;
			text-decoration: none !important;
			display: inline-block;
			padding: 12px 24px;
			border-radius: 6px;
			font-weight: 600;
			font-size: 16px;
			border: none;
			text-align: center;
			margin: 8px 0;
		}

		/* TipTap CTA node (.mm-cta) fallbacks for email preview */
		.mm-cta-wrap { margin: 8px 0; }
		.mm-cta-wrap.mm-cta-align-left { text-align: left; }
		.mm-cta-wrap.mm-cta-align-center { text-align: center; }
		.mm-cta-wrap.mm-cta-align-right { text-align: right; }

		/* Strong fallback for any anchor inside CTA container */
		div[data-cta] a {
			display: inline-block !important;
			text-decoration: none !important;
			padding: 12px 24px !important;
			border-radius: 8px !important;
			font-weight: 600 !important;
			border: 2px solid transparent !important;
		}

		/* Base button look; inline styles from node take precedence */
		.mm-cta {
			display: inline-block;
			text-decoration: none !important;
			padding: 12px 24px !important;
			border-radius: 8px !important;
			font-weight: 600;
			border: 2px solid transparent !important;
		}

		/* Safe variant fallbacks (inline styles should override these) */
		.mm-cta-primary { background: ${styles.primary}; color: ${styles.textOnPrimary}; border-color: ${styles.primary}; }
		.mm-cta-secondary { background: ${styles.secondary}; color: ${styles.textOnPrimary}; border-color: ${styles.secondary}; }
		.mm-cta-outline { background: transparent; color: ${styles.primary}; border-color: ${styles.primary}; }
		
		/* Secondary buttons */
		.button-secondary, a.button-secondary {
			background-color: ${styles.secondary} !important;
			color: ${styles.textOnPrimary} !important;
			text-decoration: none !important;
			display: inline-block;
			padding: 12px 24px;
			border-radius: 6px;
			font-weight: 600;
			font-size: 16px;
			border: none;
			text-align: center;
			margin: 8px 0;
		}
		
		/* Button containers for alignment */
		.button-container {
			margin: 16px 0;
		}
		
		.button-container.center {
			text-align: center;
		}
		
		.button-container.left {
			text-align: left;
		}
		
		.button-container.right {
			text-align: right;
		}
		
		/* Images */
		img {
			max-width: 100%;
			height: auto;
			display: block;
		}
		
		/* Text alignment utilities */
		.text-left {
			text-align: left;
		}
		
		.text-center {
			text-align: center;
		}
		
		.text-right {
			text-align: right;
		}
		
		.text-justify {
			text-align: justify;
		}
		
		/* Bold and italic */
		strong, b {
			font-weight: 700;
		}
		
		em, i {
			font-style: italic;
		}
		
		/* Code blocks */
		code {
			background-color: rgba(0, 0, 0, 0.05);
			padding: 2px 6px;
			border-radius: 3px;
			font-family: 'Courier New', monospace;
			font-size: 14px;
		}
		
		pre {
			background-color: rgba(0, 0, 0, 0.05);
			padding: 12px;
			border-radius: 6px;
			overflow-x: auto;
			margin: 16px 0;
		}
		
		pre code {
			background: none;
			padding: 0;
		}
		
		/* Responsive */
		@media only screen and (max-width: 600px) {
			.email-wrapper {
				padding: 10px !important;
			}
			.email-content {
				padding: 20px !important;
				border-radius: 20px !important;
			}
			.email-footer {
				margin-top: 32px !important;
			}
			.email-footer__inner {
				padding: 28px 18px !important;
			}
			.email-footer__divider {
				width: 48px !important;
			}
			.email-footer__cta {
				width: 100% !important;
			}
			.email-footer__cta:hover,
			.email-footer__cta:focus {
				transform: none !important;
			}
		}
	`;

	// Build the complete email HTML
	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="color-scheme" content="${forcedColorScheme}">
	<meta name="supported-color-schemes" content="${forcedColorScheme}">
	<title>Email</title>
	<style>${emailCSS}</style>
</head>
<body data-mm-force-scheme="${forcedColorScheme}" style="margin:0;padding:0;background-color:${outsideBackgroundValue};color:${textColorValue};color-scheme:${forcedColorScheme};" bgcolor="${outsideBackgroundHex}">
	<div class="email-wrapper" style="background-color:${outsideBackgroundValue};">
		<div class="email-content" style="background-color:${postBackgroundValue};">
			${normalizeCtaHtml(content, styles)}
		</div>
	</div>
</body>
</html>
	`.trim();
}

/**
 * Extract styles from email HTML if they exist
 * Returns null if no custom styles are found
 */
export function extractEmailStyles(html: string): EmailStyles | null {
	// Look for our custom style marker in the HTML
	const styleMatch = html.match(/<!-- EMAIL_STYLES: (.*?) -->/);
	if (!styleMatch) {
		return null;
	}

	try {
		return JSON.parse(decodeURIComponent(styleMatch[1]));
	} catch {
		return null;
	}
}

/**
 * Embed styles in email HTML as a comment for later retrieval
 */
export function embedStylesInHTML(html: string, styles: EmailStyles): string {
	const styleComment = `<!-- EMAIL_STYLES: ${encodeURIComponent(JSON.stringify(styles))} -->`;
	return `${styleComment}\n${html}`;
}
