"use client";

import { Extension } from "@tiptap/core";
import { toast } from "sonner";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		aiCompose: {
			aiCompose: (options: { prompt: string; mode?: "replace" | "insert" | "rewrite" }) => ReturnType;
			aiInsert: (options: { prompt: string }) => ReturnType;
			aiRewriteSelection: (options: { prompt: string }) => ReturnType;
		};
	}
}

const AICompose = Extension.create({
	name: "aiCompose",
	addCommands() {
		return {
			aiCompose:
				(options) => ({ editor }) => {
					(async () => {
						const id = toast.loading("Generating with AI…");
						try {
                            const res = await fetch("/api/ai/newsletter", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
                                    prompt: options.prompt + "\n\nConstraints: Use real list nodes for bullets/numbers. Add horizontal rules between sections. Keep paragraphs short. Use 2- or 3-column layouts when presenting side-by-side content.\n\nPersonalization: You can use these variables that will be replaced with actual member data when emails are sent:\n- {{name}} for the member's full name\n- {{email}} for the member's email address\n- {{username}} for their Whop username\n- {{company_name}} for the company/experience name\nUse these variables naturally in greetings, signatures, or anywhere personalization makes sense (e.g., 'Hi {{name}},' or 'Welcome to {{company_name}}').",
									mode: options.mode ?? "replace",
								}),
							});
							if (!res.ok) {
								let msg = "AI request failed";
								try { msg = (await res.text()) || msg; } catch {}
								throw new Error(msg);
							}
							const data = await res.json();
							if (!data?.doc) throw new Error("Invalid AI response");
							editor.commands.setContent(data.doc);
							toast.success("Inserted AI content", { id });
						} catch (e) {
							toast.error("Failed to generate content", { id });
						}
					})();
					return true;
				},
			aiInsert:
				(_options) => () => {
					toast("AI insert is coming soon");
					return false;
				},
			aiRewriteSelection:
				(_options) => () => {
					toast("AI rewrite is coming soon");
					return false;
				},
		};
	},
});

export default AICompose;


