"use client";

import { Extension } from "@tiptap/core";

/**
 * BackgroundColor extension for TipTap
 * Allows setting background color (highlighting) on text spans
 * Uses the backgroundColor CSS property for inline text highlighting
 */
export type BackgroundColorOptions = {
	types: string[];
};

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		backgroundColor: {
			/**
			 * Set the background color
			 */
			setBackgroundColor: (color: string) => ReturnType;
			/**
			 * Unset the background color
			 */
			unsetBackgroundColor: () => ReturnType;
		};
	}
}

/**
 * BackgroundColor extension
 * Adds background color (text highlighting) support to the editor
 */
export const BackgroundColor = Extension.create<BackgroundColorOptions>({
	name: "backgroundColor",

	addOptions() {
		return {
			types: ["textStyle"],
		};
	},

	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					backgroundColor: {
						default: null,
						parseHTML: (element) =>
							element.style.backgroundColor?.replace(/['"]+/g, ""),
						renderHTML: (attributes) => {
							if (!attributes.backgroundColor) {
								return {};
							}

							return {
								style: `background-color: ${attributes.backgroundColor}`,
							};
						},
					},
				},
			},
		];
	},

	addCommands() {
		return {
			setBackgroundColor:
				(color: string) =>
				({ chain }) => {
					return chain().setMark("textStyle", { backgroundColor: color }).run();
				},
			unsetBackgroundColor:
				() =>
				({ chain }) => {
					return chain()
						.setMark("textStyle", { backgroundColor: null })
						.removeEmptyTextStyle()
						.run();
				},
		};
	},
});

export default BackgroundColor;
