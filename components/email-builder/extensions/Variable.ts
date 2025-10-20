import { Node, mergeAttributes } from "@tiptap/core";

// Define available personalization variables based on Whop member data structure
export type VariableType = "name" | "email" | "username" | "company_name";

// Mapping of variable types to their display labels and example values
export const VARIABLE_CONFIG: Record<VariableType, { label: string; example: string; description: string }> = {
	name: {
		label: "Member Name",
		example: "John Doe",
		description: "Full name of the member",
	},
	email: {
		label: "Email Address",
		example: "john@example.com",
		description: "Member's email address",
	},
	username: {
		label: "Username",
		example: "@johndoe",
		description: "Whop username",
	},
	company_name: {
		label: "Company Name",
		example: "Your Company",
		description: "Your company/experience name",
	},
};

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		variable: {
			/**
			 * Insert a personalization variable
			 */
			insertVariable: (type: VariableType) => ReturnType;
		};
	}
}

/**
 * Variable node extension for personalization tags in email campaigns
 * Renders variables like {{name}}, {{email}}, {{username}} that will be
 * replaced with actual member data when emails are sent
 */
const Variable = Node.create({
	name: "variable",
	group: "inline",
	inline: true,
	atom: true, // Treat as a single unit (can't put cursor inside)
	selectable: true,

	addAttributes() {
		return {
			type: {
				default: "name" as VariableType,
				parseHTML: (element) => {
					if (element instanceof HTMLElement) {
						return (element.getAttribute("data-variable") as VariableType) || "name";
					}
					return "name";
				},
				renderHTML: (attributes) => {
					return {
						"data-variable": attributes.type,
					};
				},
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "span[data-variable]",
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		const type = (HTMLAttributes["data-variable"] as VariableType) || "name";
		const config = VARIABLE_CONFIG[type];
		
		return [
			"span",
			mergeAttributes(HTMLAttributes, {
				"data-variable": type,
				class: "mm-variable",
				// For email rendering, use double curly braces syntax
				"data-var-text": `{{${type}}}`,
			}),
			`{{${type}}}`, // Display text in editor
		];
	},

	addCommands() {
		return {
			insertVariable:
				(type: VariableType) =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: { type },
					});
				},
		};
	},
});

export default Variable;
