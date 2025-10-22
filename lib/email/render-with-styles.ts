import { EmailStyles } from "@/components/email-builder/ui/EmailStylePanel";

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
	// Create CSS for the email with color styles only
	const emailCSS = `
		/* Reset styles for email clients */
		body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
		table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
		img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
		
		/* Email container styles - colors only */
		body {
			margin: 0;
			padding: 0;
			width: 100% !important;
			background-color: ${styles.outsideBackground};
			color: ${styles.textOnBackground};
		}
		
		/* Content wrapper - colors only */
		.email-wrapper {
			background-color: ${styles.outsideBackground};
			padding: 35px;
		}
		
		.email-content {
			max-width: 600px;
			margin: 0 auto;
			background-color: ${styles.postBackground};
			padding: 40px;
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
	<title>Email</title>
	<style>${emailCSS}</style>
</head>
<body>
	<div class="email-wrapper">
		<div class="email-content">
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
