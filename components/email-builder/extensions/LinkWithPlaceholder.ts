"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { LinkPlaceholderView } from "../ui/LinkPlaceholderView";

/**
 * Extended Link node that supports placeholders for URL input
 * When isPlaceholder is true, the editor will render a placeholder UI
 * that allows users to enter a URL directly in the canvas
 */
export interface LinkPlaceholderOptions {
	/**
	 * HTML attributes to add to the element
	 */
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		linkWithPlaceholder: {
			/**
			 * Insert a link placeholder with optional suggested text
			 */
			setLinkPlaceholder: (options?: {
				suggestedText?: string;
			}) => ReturnType;
		};
	}
}

const LinkWithPlaceholder = Node.create<LinkPlaceholderOptions>({
	name: "linkPlaceholder",

	addOptions() {
		return {
			HTMLAttributes: {
				class: "link-placeholder",
			},
		};
	},

	group() {
		return "block";
	},

	atom: true,

	addAttributes() {
		return {
			suggestedText: {
				default: null,
				parseHTML: (element) => element.getAttribute("data-suggested-text"),
				renderHTML: (attributes) => {
					if (!attributes.suggestedText) {
						return {};
					}
					return { "data-suggested-text": attributes.suggestedText };
				},
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'div[data-type="link-placeholder"]',
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ["div", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-type": "link-placeholder" })];
	},

	addNodeView() {
		return ReactNodeViewRenderer(LinkPlaceholderView);
	},

	addCommands() {
		return {
			setLinkPlaceholder:
				(options) =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: {
							suggestedText: options?.suggestedText || "",
						},
					});
				},
		};
	},
});

export default LinkWithPlaceholder;
