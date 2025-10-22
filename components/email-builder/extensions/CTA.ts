import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CTACustomizer } from "../ui/CTACustomizer";

export type CtaVariant = "primary" | "secondary" | "outline";
export type CtaAlign = "left" | "center" | "right";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		cta: {
			insertCTA: (options?: { text?: string; href?: string; variant?: CtaVariant }) => ReturnType;
			setCTAUrl: (href: string) => ReturnType;
			setCTAVariant: (variant: CtaVariant) => ReturnType;
			setCTAAlign: (align: CtaAlign) => ReturnType;
			setCTABackgroundColor: (color: string) => ReturnType;
			setCTATextColor: (color: string) => ReturnType;
			setCTABorderRadius: (radius: number) => ReturnType;
			setCTAPadding: (padding: string) => ReturnType;
			removeCTA: () => ReturnType;
		};
	}
}

function getVariantFromClassList(el: Element): CtaVariant {
	const classList = Array.from(el.classList || []);
	if (classList.includes("mm-cta-secondary")) return "secondary";
	if (classList.includes("mm-cta-outline")) return "outline";
	return "primary";
}

const CTA = Node.create({
	name: "cta",
	group: "block",
	// Allow any inline content (matches existing documents and prevents schema errors)
	content: "inline*",
	selectable: true,
	draggable: true,
	addAttributes() {
		return {
			href: {
				default: "",
				parseHTML: (element) => {
					if (element instanceof HTMLElement) {
						if (element.tagName.toLowerCase() === "a") {
							return element.getAttribute("href") || "";
						}
						const anchor = element.querySelector("a");
						return anchor?.getAttribute("href") || "";
					}
					return "";
				},
				renderHTML: (attributes) => (attributes.href ? { href: attributes.href } : {}),
			},
			variant: {
				default: "primary" as CtaVariant,
				parseHTML: (element) => {
					if (element instanceof HTMLElement) {
						const el = element.tagName.toLowerCase() === "a" ? element : element.querySelector("a");
						if (!el) return "primary";
						const fromData = el.getAttribute("data-variant") as CtaVariant | null;
						return fromData || getVariantFromClassList(el);
					}
					return "primary";
				},
			},
			align: {
				default: "left" as CtaAlign,
				parseHTML: (element) => {
					if (!(element instanceof HTMLElement)) return "left";
					const container = element.matches('[data-cta]') ? element : element.closest('[data-cta]');
					if (container && container instanceof HTMLElement) {
						const dataAlign = (container.getAttribute('data-align') as CtaAlign) || null;
						if (dataAlign === 'center' || dataAlign === 'right' || dataAlign === 'left') return dataAlign;
						const styleAlign = (container.style.textAlign as CtaAlign) || null;
						if (styleAlign === 'center' || styleAlign === 'right' || styleAlign === 'left') return styleAlign;
					}
					return "left";
				},
			},
			backgroundColor: {
				default: "",
				parseHTML: (element) => {
					if (!(element instanceof HTMLElement)) return "";
					const anchor = element.tagName.toLowerCase() === "a" ? element : element.querySelector("a");
					return anchor?.getAttribute("data-bg-color") || "";
				},
			},
			textColor: {
				default: "",
				parseHTML: (element) => {
					if (!(element instanceof HTMLElement)) return "";
					const anchor = element.tagName.toLowerCase() === "a" ? element : element.querySelector("a");
					return anchor?.getAttribute("data-text-color") || "";
				},
			},
			borderRadius: {
				default: 8,
				parseHTML: (element) => {
					if (!(element instanceof HTMLElement)) return 8;
					const anchor = element.tagName.toLowerCase() === "a" ? element : element.querySelector("a");
					const radius = anchor?.getAttribute("data-border-radius");
					return radius ? parseInt(radius, 10) : 8;
				},
			},
			padding: {
				default: "12px 24px",
				parseHTML: (element) => {
					if (!(element instanceof HTMLElement)) return "12px 24px";
					const anchor = element.tagName.toLowerCase() === "a" ? element : element.querySelector("a");
					return anchor?.getAttribute("data-padding") || "12px 24px";
				},
			},
		};
	},
	parseHTML() {
		return [
			{ tag: "div[data-cta]" },
			{ tag: "a[data-cta]" },
			{ tag: "a.mm-cta" },
		];
	},
	renderHTML({ HTMLAttributes }) {
		const href = (HTMLAttributes.href as string) || "";
		const variant = ((HTMLAttributes.variant as CtaVariant) || "primary") as CtaVariant;
		const align = ((HTMLAttributes.align as CtaAlign) || "left") as CtaAlign;
		const backgroundColor = (HTMLAttributes.backgroundColor as string) || "";
		const textColor = (HTMLAttributes.textColor as string) || "";
		const borderRadius = (HTMLAttributes.borderRadius as number) || 8;
		const padding = (HTMLAttributes.padding as string) || "12px 24px";
		
		// Build inline styles for custom colors
		const customStyles: string[] = [];
		
		// For outline variant, apply special styling
		if (variant === "outline" && backgroundColor) {
			customStyles.push(`background-color: transparent !important`);
			customStyles.push(`border: 2px solid ${backgroundColor} !important`);
			customStyles.push(`color: ${backgroundColor} !important`);
		} else {
			// For primary and secondary variants
			if (backgroundColor) customStyles.push(`background-color: ${backgroundColor} !important`);
			if (textColor) customStyles.push(`color: ${textColor} !important`);
			customStyles.push(`border: 2px solid transparent`);
		}
		
		if (borderRadius) customStyles.push(`border-radius: ${borderRadius}px`);
		if (padding) customStyles.push(`padding: ${padding}`);
		const styleAttr = customStyles.length > 0 ? customStyles.join("; ") : undefined;
		
		return [
			"div",
			{ "data-cta": "true", "data-align": align, class: `mm-cta-wrap mm-cta-align-${align}` },
			[
				"a",
				mergeAttributes(
					{},
					// include href only if provided to avoid navigation in editor
					...(href ? [{ href }] as any : []),
					{ 
						"data-variant": variant, 
						"data-bg-color": backgroundColor,
						"data-text-color": textColor,
						"data-border-radius": borderRadius.toString(),
						"data-padding": padding,
						class: `mm-cta mm-cta-${variant}`,
						...(styleAttr ? { style: styleAttr } : {}),
					},
				),
				0,
			],
		];
	},
	addCommands() {
		return {
			insertCTA:
				(options) =>
				({ commands }) => {
					const text = options?.text ?? "Call to Action";
					const href = options?.href ?? "";
					const variant: CtaVariant = options?.variant ?? "primary";
					return commands.insertContent({
						type: this.name,
						attrs: { href, variant },
						content: [{ type: "text", text }],
					});
				},
			setCTAUrl:
				(href) => ({ tr, state, dispatch }) => {
					const { selection } = state;
					const $from = selection.$from;
					const nodeName = this.name;
					
					for (let depth = $from.depth; depth > 0; depth--) {
						const node = $from.node(depth);
						if (node.type.name === nodeName) {
							const pos = $from.before(depth);
							const newAttrs = { ...node.attrs, href };
							if (dispatch) {
								tr.setNodeMarkup(pos, node.type, newAttrs, node.marks);
							}
							return true;
						}
					}
					return false;
				},
			setCTAVariant:
				(variant) => ({ tr, state, dispatch }) => {
					const { selection } = state;
					const $from = selection.$from;
					const nodeName = this.name;
					
					for (let depth = $from.depth; depth > 0; depth--) {
						const node = $from.node(depth);
						if (node.type.name === nodeName) {
							const pos = $from.before(depth);
							const newAttrs = { ...node.attrs, variant };
							if (dispatch) {
								tr.setNodeMarkup(pos, node.type, newAttrs, node.marks);
							}
							return true;
						}
					}
					return false;
				},
			setCTAAlign:
				(align) => ({ tr, state, dispatch }) => {
					const { selection } = state;
					const $from = selection.$from;
					const nodeName = this.name;
					
					for (let depth = $from.depth; depth > 0; depth--) {
						const node = $from.node(depth);
						if (node.type.name === nodeName) {
							const pos = $from.before(depth);
							const newAttrs = { ...node.attrs, align };
							if (dispatch) {
								tr.setNodeMarkup(pos, node.type, newAttrs, node.marks);
							}
							return true;
						}
					}
					return false;
				},
			setCTABackgroundColor:
				(color) => ({ tr, state, dispatch }) => {
					const { selection } = state;
					const $from = selection.$from;
					const nodeName = this.name;
					
					for (let depth = $from.depth; depth > 0; depth--) {
						const node = $from.node(depth);
						if (node.type.name === nodeName) {
							const pos = $from.before(depth);
							const newAttrs = { ...node.attrs, backgroundColor: color };
							if (dispatch) {
								tr.setNodeMarkup(pos, node.type, newAttrs, node.marks);
							}
							return true;
						}
					}
					return false;
				},
			setCTATextColor:
				(color) => ({ tr, state, dispatch }) => {
					const { selection } = state;
					const $from = selection.$from;
					const nodeName = this.name;
					
					for (let depth = $from.depth; depth > 0; depth--) {
						const node = $from.node(depth);
						if (node.type.name === nodeName) {
							const pos = $from.before(depth);
							const newAttrs = { ...node.attrs, textColor: color };
							if (dispatch) {
								tr.setNodeMarkup(pos, node.type, newAttrs, node.marks);
							}
							return true;
						}
					}
					return false;
				},
			setCTABorderRadius:
				(radius) => ({ tr, state, dispatch }) => {
					const { selection } = state;
					const $from = selection.$from;
					const nodeName = this.name;
					
					for (let depth = $from.depth; depth > 0; depth--) {
						const node = $from.node(depth);
						if (node.type.name === nodeName) {
							const pos = $from.before(depth);
							const newAttrs = { ...node.attrs, borderRadius: radius };
							if (dispatch) {
								tr.setNodeMarkup(pos, node.type, newAttrs, node.marks);
							}
							return true;
						}
					}
					return false;
				},
			setCTAPadding:
				(padding) => ({ tr, state, dispatch }) => {
					const { selection } = state;
					const $from = selection.$from;
					const nodeName = this.name;
					
					for (let depth = $from.depth; depth > 0; depth--) {
						const node = $from.node(depth);
						if (node.type.name === nodeName) {
							const pos = $from.before(depth);
							const newAttrs = { ...node.attrs, padding };
							if (dispatch) {
								tr.setNodeMarkup(pos, node.type, newAttrs, node.marks);
							}
							return true;
						}
					}
					return false;
				},
			removeCTA:
				() =>
				({ commands }) => commands.deleteNode(this.name),
		};
	},
	addNodeView() {
		return ReactNodeViewRenderer(CTACustomizer);
	},
});

export default CTA;


