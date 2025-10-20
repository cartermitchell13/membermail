/**
 * Email personalization variable replacement utilities
 * 
 * This module handles replacing variable placeholders like {{name}}, {{email}}, etc.
 * with actual member data when sending campaign emails.
 */

import type { VariableType } from "@/components/email-builder/extensions/Variable";

/**
 * Member data structure based on Whop API
 * Reference: whop-docs/whop.md
 */
export type MemberData = {
	/** Member's full name from their Whop account */
	name: string;
	/** Member's email address */
	email: string;
	/** Member's Whop username (e.g., "@johndoe") */
	username: string;
	/** Your company/experience name */
	company_name?: string;
};

/**
 * Replace all variable placeholders in HTML content with actual member data
 * 
 * @param htmlContent - The email HTML content with variable placeholders
 * @param memberData - The member's data to use for replacement
 * @returns HTML content with all variables replaced
 * 
 * @example
 * ```ts
 * const html = "<p>Hello {{name}}, your email is {{email}}</p>";
 * const member = { name: "John Doe", email: "john@example.com", username: "@johndoe" };
 * const result = replaceVariables(html, member);
 * // Result: "<p>Hello John Doe, your email is john@example.com</p>"
 * ```
 */
export function replaceVariables(htmlContent: string, memberData: MemberData): string {
	let result = htmlContent;

	// Replace each variable type with actual data
	// Using word boundaries to ensure we only match the exact variable syntax
	const replacements: Record<VariableType, string> = {
		name: memberData.name || "Member",
		email: memberData.email || "",
		username: memberData.username || "",
		company_name: memberData.company_name || "Our Team",
	};

	// Replace all occurrences of each variable
	for (const [variable, value] of Object.entries(replacements)) {
		// Match {{variable}} syntax (including in data attributes)
		const regex = new RegExp(`\\{\\{${variable}\\}\\}`, "g");
		result = result.replace(regex, value);
	}

	return result;
}

/**
 * Extract all variables used in HTML content
 * Useful for validation and debugging
 * 
 * @param htmlContent - The email HTML content to analyze
 * @returns Array of variable types found in the content
 */
export function extractVariables(htmlContent: string): VariableType[] {
	const variablePattern = /\{\{(\w+)\}\}/g;
	const found = new Set<VariableType>();
	let match;

	while ((match = variablePattern.exec(htmlContent)) !== null) {
		const varName = match[1] as VariableType;
		// Only include valid variable types
		if (["name", "email", "username", "company_name"].includes(varName)) {
			found.add(varName);
		}
	}

	return Array.from(found);
}

/**
 * Validate that all variables in content have corresponding member data
 * 
 * @param htmlContent - The email HTML content to validate
 * @param memberData - The member's data to check against
 * @returns Object with validation result and any missing variables
 */
export function validateVariables(
	htmlContent: string,
	memberData: Partial<MemberData>
): { valid: boolean; missing: VariableType[] } {
	const usedVariables = extractVariables(htmlContent);
	const missing: VariableType[] = [];

	for (const variable of usedVariables) {
		const value = memberData[variable];
		// Check if the variable has a value (excluding empty strings for required fields)
		if (!value || (["name", "email"].includes(variable) && value.trim() === "")) {
			missing.push(variable);
		}
	}

	return {
		valid: missing.length === 0,
		missing,
	};
}

/**
 * Preview variables with example data
 * Useful for testing email templates
 * 
 * @param htmlContent - The email HTML content to preview
 * @returns HTML content with example data filled in
 */
export function previewWithExamples(htmlContent: string): string {
	const exampleData: MemberData = {
		name: "John Doe",
		email: "john@example.com",
		username: "@johndoe",
		company_name: "Your Company",
	};

	return replaceVariables(htmlContent, exampleData);
}
