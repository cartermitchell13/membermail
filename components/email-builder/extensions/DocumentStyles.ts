"use client";

import { Extension } from "@tiptap/core";

/**
 * Document-level styles extension
 * Stores email-wide styling configuration that doesn't belong to individual nodes
 * This allows us to maintain consistent styling across the entire email
 */
export interface DocumentStylesStorage {
	outsideBackground: string;
	postBackground: string;
	textOnBackground: string;
	primary: string;
	textOnPrimary: string;
	secondary: string;
	links: string;
	headingFontFamily: string;
	headingFontWeight: string;
	paragraphFontFamily: string;
	paragraphFontWeight: string;
	margin: number;
	padding: number;
}

/**
 * Default document styles
 */
const defaultStyles: DocumentStylesStorage = {
	outsideBackground: "#000000",
	postBackground: "#FFFFFF",
	textOnBackground: "#2D2D2D",
	primary: "#030712",
	textOnPrimary: "#FFFFFF",
	secondary: "#030712",
	links: "#0C4A6E",
	headingFontFamily: "Trebuchet MS, sans-serif",
	headingFontWeight: "Regular",
	paragraphFontFamily: "Helvetica, sans-serif",
	paragraphFontWeight: "Regular",
	margin: 35,
	padding: 0,
};

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		documentStyles: {
			/**
			 * Set document-level styles
			 */
			setDocumentStyles: (styles: Partial<DocumentStylesStorage>) => ReturnType;
		};
	}
	
	interface Storage {
		documentStyles: DocumentStylesStorage;
	}
}

/**
 * Extension for storing document-level styles
 * These styles are applied to the email wrapper, not individual content nodes
 */
const DocumentStyles = Extension.create({
	name: "documentStyles",

	addStorage() {
		return {
			...defaultStyles,
		};
	},

	addCommands() {
		return {
			setDocumentStyles:
				(styles: Partial<DocumentStylesStorage>) =>
				({ editor }: { editor: any }) => {
					// Update the storage with new styles
					Object.assign(editor.storage.documentStyles, styles);
					return true;
				},
		};
	},
});

export default DocumentStyles;
