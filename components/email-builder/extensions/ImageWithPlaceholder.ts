"use client";

import { Node, mergeAttributes, nodeInputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImagePlaceholderView } from "../ui/ImagePlaceholderView";

/**
 * Extended Image node that supports AI-generated placeholders
 * When isPlaceholder is true, the editor will render a placeholder UI
 * that allows users to generate images from the suggested prompt
 */
export interface ImageOptions {
	/**
	 * Allow inline images
	 */
	inline: boolean;

	/**
	 * Allow images to be draggable
	 */
	allowBase64: boolean;

	/**
	 * HTML attributes to add to the image element
	 */
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		imageWithPlaceholder: {
			/**
			 * Insert a regular image
			 */
			setImage: (options: {
				src: string;
				alt?: string;
				title?: string;
			}) => ReturnType;

			/**
			 * Insert an image placeholder with a suggested prompt
			 */
			setImagePlaceholder: (options: {
				alt: string;
				suggestedPrompt: string;
			}) => ReturnType;

			/**
			 * Update placeholder with generated image URL
			 */
			updateImageFromPlaceholder: (options: {
				src: string;
			}) => ReturnType;
		};
	}
}

/**
 * Matches an image to an ![image](src "title") on input.
 */
export const inputRegex = /(?:^|\s)(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/;

const ImageWithPlaceholder = Node.create<ImageOptions>({
	name: "image",

	addOptions() {
		return {
			inline: false,
			allowBase64: false,
			HTMLAttributes: {
				class: "max-w-full h-auto rounded",
			},
		};
	},

	inline() {
		return this.options.inline;
	},

	group() {
		return this.options.inline ? "inline" : "block";
	},

	draggable: true,

	addAttributes() {
		return {
			src: {
				default: null,
				parseHTML: (element) => element.getAttribute("src"),
				renderHTML: (attributes) => {
					if (!attributes.src) {
						return {};
					}
					return { src: attributes.src };
				},
			},
			alt: {
				default: null,
				parseHTML: (element) => element.getAttribute("alt"),
				renderHTML: (attributes) => {
					if (!attributes.alt) {
						return {};
					}
					return { alt: attributes.alt };
				},
			},
			title: {
				default: null,
				parseHTML: (element) => element.getAttribute("title"),
				renderHTML: (attributes) => {
					if (!attributes.title) {
						return {};
					}
					return { title: attributes.title };
				},
			},
			// Placeholder-specific attributes
			isPlaceholder: {
				default: false,
				parseHTML: (element) => element.getAttribute("data-placeholder") === "true",
				renderHTML: (attributes) => {
					if (!attributes.isPlaceholder) {
						return {};
					}
					return { "data-placeholder": "true" };
				},
			},
			suggestedPrompt: {
				default: null,
				parseHTML: (element) => element.getAttribute("data-suggested-prompt"),
				renderHTML: (attributes) => {
					if (!attributes.suggestedPrompt) {
						return {};
					}
					return { "data-suggested-prompt": attributes.suggestedPrompt };
				},
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: this.options.allowBase64
					? "img[src]"
					: 'img[src]:not([src^="data:"])',
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
	},

	addNodeView() {
		// Always use the React NodeView - it will handle both placeholders and regular images
		return ReactNodeViewRenderer(ImagePlaceholderView);
	},

	addCommands() {
		return {
			setImage:
				(options) =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: options,
					});
				},
			setImagePlaceholder:
				(options) =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: {
							src: "",
							alt: options.alt,
							suggestedPrompt: options.suggestedPrompt,
							isPlaceholder: true,
						},
					});
				},
			updateImageFromPlaceholder:
				(options) =>
				({ tr, state, dispatch }) => {
					const { selection } = state;
					const { $from } = selection;

					// Find the image node in the current selection
					for (let depth = $from.depth; depth > 0; depth--) {
						const node = $from.node(depth);
						if (node.type.name === this.name && node.attrs.isPlaceholder) {
							const pos = $from.before(depth);
							const newAttrs = {
								...node.attrs,
								src: options.src,
								isPlaceholder: false,
								// Keep suggestedPrompt for history/debugging
							};
							if (dispatch) {
								tr.setNodeMarkup(pos, null, newAttrs);
							}
							return true;
						}
					}
					return false;
				},
		};
	},

	addInputRules() {
		return [
			nodeInputRule({
				find: inputRegex,
				type: this.type,
				getAttributes: (match) => {
					const [, , alt, src, title] = match;
					return { src, alt, title };
				},
			}),
		];
	},
});

export default ImageWithPlaceholder;
