"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmailEditor from "@/components/EmailEditor";
import { toast } from "sonner";

export default function DraftEditorPage() {
	const [html, setHtml] = useState("");
	const [templateName, setTemplateName] = useState("");
	const [saving, setSaving] = useState(false);
	const [showNameDialog, setShowNameDialog] = useState(false);
	const router = useRouter();
	const params = useParams();
	const experienceId = params.experienceId as string;

	const handleSaveAsTemplate = async () => {
		if (!templateName.trim()) {
			setShowNameDialog(true);
			return;
		}

		setSaving(true);
		try {
			const res = await fetch("/api/templates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: templateName,
					html_content: html,
					category: "Custom",
				}),
			});

			if (res.ok) {
				toast.success("Template saved successfully!");
				router.push(`/experiences/${experienceId}/templates`);
			} else {
				toast.error("Failed to save template");
			}
		} catch (error) {
			toast.error("An error occurred");
		} finally {
			setSaving(false);
		}
	};

	const handleCreateCampaign = () => {
		// Store HTML content in sessionStorage to pass to campaign creation
		sessionStorage.setItem("draft_email_content", html);
		router.push(`/experiences/${experienceId}/campaigns/new`);
	};

	return (
		<div className="h-full flex flex-col -m-8">
			{/* Header */}
			<div className="border-b border-white/10 bg-black/40 backdrop-blur-sm shrink-0">
				<div className="px-8 py-4 flex items-center justify-between">
					<div className="flex items-center gap-6">
						<div className="space-y-1">
							<h1 className="text-xl font-semibold text-white">New Email</h1>
							<p className="text-sm text-white/50">Create your email content</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							onClick={() => router.push(`/experiences/${experienceId}/templates`)}
						>
							Cancel
						</Button>
						<Button variant="secondary" onClick={() => setShowNameDialog(true)} disabled={!html}>
							Save as Template
						</Button>
						<Button onClick={handleCreateCampaign} disabled={!html}>
							Create Campaign
						</Button>
					</div>
				</div>
			</div>

			{/* Template Name Dialog Overlay */}
			{showNameDialog && (
				<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
					<div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6 max-w-md w-full mx-4">
						<h2 className="text-xl font-semibold text-white mb-4">Save as Template</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-white/80 mb-2">
									Template Name
								</label>
								<Input
									value={templateName}
									onChange={(e) => setTemplateName(e.target.value)}
									placeholder="e.g., Weekly Newsletter"
									className="bg-white/5 border-white/10 text-white"
									autoFocus
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleSaveAsTemplate();
										}
									}}
								/>
							</div>
							<div className="flex justify-end gap-3">
								<Button variant="outline" onClick={() => setShowNameDialog(false)}>
									Cancel
								</Button>
								<Button onClick={handleSaveAsTemplate} disabled={!templateName.trim() || saving}>
									{saving ? "Saving..." : "Save"}
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Editor */}
			<div className="flex-1 overflow-hidden">
				<EmailEditor content={html} onChange={setHtml} />
			</div>
		</div>
	);
}

