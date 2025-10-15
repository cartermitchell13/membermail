"use client";
import { useRouter } from "next/navigation";
import { use, useEffect, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
	Bold,
	Italic,
	List,
	ListOrdered,
	Heading1,
	Heading2,
	LinkIcon,
	ImageIcon,
	Undo,
	Redo,
} from "lucide-react";
import { toast } from "sonner";

export default function NewCampaignPage({ params }: { params: Promise<{ experienceId: string }> }) {
	const { experienceId } = use(params);
	const router = useRouter();
	const [subject, setSubject] = useState("");
	const [previewText, setPreviewText] = useState("");
	const searchParams = useSearchParams();
	const [saving, setSaving] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "text-[#FA4616] underline",
				},
			}),
			Image.configure({
				HTMLAttributes: {
					class: "max-w-full h-auto rounded",
				},
			}),
			Placeholder.configure({
				placeholder: "Write your newsletter...",
			}),
		],
		content: "<h1>Hello Members</h1><p>Welcome!</p>",
		editorProps: {
			attributes: {
				class: "prose prose-invert max-w-none focus:outline-none min-h-[400px] px-6 py-4",
			},
		},
	});

	useEffect(() => {
		if (!editor) return;

		// Check for draft content from email editor
		const draftContent = sessionStorage.getItem("draft_email_content");
		if (draftContent) {
			editor.commands.setContent(draftContent);
			sessionStorage.removeItem("draft_email_content");
			return;
		}

		// Otherwise, check for template ID
		const tid = searchParams.get("templateId");
		if (!tid) return;
		(async () => {
			const res = await fetch(`/api/templates/${tid}`);
			if (!res.ok) return;
			const data = await res.json();
			if (data?.template?.html_content) {
				editor.commands.setContent(data.template.html_content);
			}
		})();
	}, [searchParams, editor]);

	// Close preview modal with ESC key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && showPreview) {
				setShowPreview(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [showPreview]);

	const addLink = useCallback(() => {
		if (!editor) return;
		const url = window.prompt("Enter URL");
		if (url) {
			editor.chain().focus().setLink({ href: url }).run();
		}
	}, [editor]);

	const addImage = useCallback(() => {
		if (!editor) return;
		const url = window.prompt("Enter image URL");
		if (url) {
			editor.chain().focus().setImage({ src: url }).run();
		}
	}, [editor]);

	async function create() {
		if (!subject.trim()) {
			toast.error("Please add a subject line");
			return;
		}

		setSaving(true);
		try {
			// Resolve community id from whop company id (using experienceId here as fallback)
			const resolveRes = await fetch(`/api/communities/resolve?companyId=${experienceId}`);
			const { id: community_id } = resolveRes.ok ? await resolveRes.json() : { id: 1 };
			const res = await fetch("/api/campaigns", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					subject,
					preview_text: previewText,
					html_content: editor?.getHTML() ?? "",
					community_id,
				}),
			});
			if (res.ok) {
				const data = await res.json();
				toast.success("Campaign created successfully!");
				router.push(`/experiences/${experienceId}/campaigns/${data.campaign.id}`);
			} else {
				toast.error("Failed to create campaign");
			}
		} catch (error) {
			toast.error("An error occurred");
		} finally {
			setSaving(false);
		}
	}

	if (!editor) {
		return null;
	}

	return (
		<div className="h-full flex flex-col -m-8">
			{/* Header */}
			<div className="border-b border-white/10 bg-black/40 backdrop-blur-sm shrink-0">
				<div className="px-8 py-4 flex items-center justify-between">
					<div className="space-y-1">
						<h1 className="text-xl font-semibold text-white">New Campaign</h1>
						<p className="text-sm text-white/50">Create and send an email campaign</p>
					</div>
					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							onClick={() => router.push(`/experiences/${experienceId}/campaigns`)}
						>
							Cancel
						</Button>
						<Button variant="secondary" onClick={() => setShowPreview(true)}>
							Preview
						</Button>
						<Button onClick={create} disabled={saving}>
							{saving ? "Creating..." : "Create Campaign"}
						</Button>
					</div>
				</div>
			</div>

			{/* Preview Modal */}
			{showPreview && (
				<div
					className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-8"
					onClick={() => setShowPreview(false)}
				>
					<div
						className="bg-[#1a1a1a] rounded-xl w-full h-full overflow-hidden flex flex-col shadow-2xl border border-white/10"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Modal header */}
						<div className="bg-[#2a2a2a] border-b border-white/10 px-4 py-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<span className="text-xs text-white/50 mr-2">Preview as:</span>
									<button
										onClick={() => setPreviewMode("desktop")}
										className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
											previewMode === "desktop"
												? "bg-[#FA4616] text-white"
												: "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
										}`}
									>
										Desktop
									</button>
									<button
										onClick={() => setPreviewMode("mobile")}
										className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
											previewMode === "mobile"
												? "bg-[#FA4616] text-white"
												: "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
										}`}
									>
										Mobile
									</button>
								</div>
								<button
									onClick={() => setShowPreview(false)}
									className="text-white/50 hover:text-white transition-colors"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>

						{/* Email client viewport */}
						<div className="flex-1 overflow-y-auto bg-[#111111] p-8">
							<div
								className={`mx-auto transition-all duration-300 ${
									previewMode === "desktop" ? "max-w-3xl" : "max-w-[375px]"
								}`}
							>
								{/* Email container with shadow and rounded borders */}
								<div style={{ 
									backgroundColor: "white", 
									boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
									borderRadius: "12px",
									overflow: "hidden"
								}}>
									{/* macOS window controls - only on desktop */}
									{previewMode === "desktop" && (
										<div style={{ 
											backgroundColor: "#e5e7eb",
											padding: "12px 16px",
											display: "flex",
											alignItems: "center",
											gap: "8px"
										}}>
											<button
												onClick={() => setShowPreview(false)}
												style={{
													width: "12px",
													height: "12px",
													borderRadius: "50%",
													backgroundColor: "#ff5f57",
													border: "none",
													cursor: "pointer"
												}}
												title="Close"
											/>
											<div style={{
												width: "12px",
												height: "12px",
												borderRadius: "50%",
												backgroundColor: "#ffbd2e"
											}} />
											<div style={{
												width: "12px",
												height: "12px",
												borderRadius: "50%",
												backgroundColor: "#28ca42"
											}} />
										</div>
									)}
									
									{/* Email client header - inbox style */}
									<div style={{ 
										backgroundColor: "#f9fafb", 
										borderBottom: "2px solid #d1d5db",
										padding: "24px"
									}}>
										<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
											{/* From line */}
											<div style={{ display: "flex", gap: "16px" }}>
												<span style={{ fontSize: "14px", color: "#4b5563", fontWeight: 600, minWidth: "100px" }}>From:</span>
												<span style={{ fontSize: "14px", color: "#111827", flex: 1 }}>
													Carter's Newsletter &lt;carters-newsletter-98db81@mail.beehiiv.com&gt;
												</span>
											</div>
											
											{/* Subject line */}
											<div style={{ display: "flex", gap: "16px" }}>
												<span style={{ fontSize: "14px", color: "#4b5563", fontWeight: 600, minWidth: "100px" }}>Subject:</span>
												<span style={{ fontSize: "16px", color: "#111827", fontWeight: 700, flex: 1 }}>
													{subject || "-"}
												</span>
											</div>
											
											{/* Preview text */}
											<div style={{ display: "flex", gap: "16px" }}>
												<span style={{ fontSize: "14px", color: "#4b5563", fontWeight: 600, minWidth: "100px" }}>Preview Text:</span>
												<span style={{ fontSize: "14px", color: "#374151", flex: 1 }}>
													{previewText || "-"}
												</span>
											</div>
										</div>
									</div>

									{/* Email content area */}
									<div style={{ padding: "32px 24px", backgroundColor: "white" }}>
										<div
											className="prose max-w-none"
											dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Main Content */}
			<div className="flex-1 flex overflow-hidden">
				{/* Editor */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Campaign Details */}
					<div className="border-b border-white/10 bg-black/20 p-6 space-y-4 shrink-0">
						<div className="space-y-2">
							<label className="block text-sm font-medium text-white/80">Subject Line</label>
							<Input
								value={subject}
								onChange={(e) => setSubject(e.target.value)}
								className="bg-white/5 border-white/10 text-white"
								placeholder="Enter email subject..."
							/>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium text-white/80">
								Preview Text <span className="text-white/40">(Optional)</span>
							</label>
							<Input
								value={previewText}
								onChange={(e) => setPreviewText(e.target.value)}
								className="bg-white/5 border-white/10 text-white"
								placeholder="Shown in inbox preview..."
							/>
						</div>
					</div>

					{/* Toolbar */}
					<div className="border-b border-white/10 bg-black/40 backdrop-blur-sm shrink-0">
						<div className="flex items-center gap-1 p-2 flex-wrap">
							<ToolbarButton
								onClick={() => editor.chain().focus().toggleBold().run()}
								active={editor.isActive("bold")}
								title="Bold"
							>
								<Bold className="w-4 h-4" />
							</ToolbarButton>
							<ToolbarButton
								onClick={() => editor.chain().focus().toggleItalic().run()}
								active={editor.isActive("italic")}
								title="Italic"
							>
								<Italic className="w-4 h-4" />
							</ToolbarButton>
							<div className="w-px h-6 bg-white/10 mx-1" />
							<ToolbarButton
								onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
								active={editor.isActive("heading", { level: 1 })}
								title="Heading 1"
							>
								<Heading1 className="w-4 h-4" />
							</ToolbarButton>
							<ToolbarButton
								onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
								active={editor.isActive("heading", { level: 2 })}
								title="Heading 2"
							>
								<Heading2 className="w-4 h-4" />
							</ToolbarButton>
							<div className="w-px h-6 bg-white/10 mx-1" />
							<ToolbarButton
								onClick={() => editor.chain().focus().toggleBulletList().run()}
								active={editor.isActive("bulletList")}
								title="Bullet List"
							>
								<List className="w-4 h-4" />
							</ToolbarButton>
							<ToolbarButton
								onClick={() => editor.chain().focus().toggleOrderedList().run()}
								active={editor.isActive("orderedList")}
								title="Numbered List"
							>
								<ListOrdered className="w-4 h-4" />
							</ToolbarButton>
							<div className="w-px h-6 bg-white/10 mx-1" />
							<ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Add Link">
								<LinkIcon className="w-4 h-4" />
							</ToolbarButton>
							<ToolbarButton onClick={addImage} title="Add Image">
								<ImageIcon className="w-4 h-4" />
							</ToolbarButton>
							<div className="w-px h-6 bg-white/10 mx-1" />
							<ToolbarButton
								onClick={() => editor.chain().focus().undo().run()}
								disabled={!editor.can().undo()}
								title="Undo"
							>
								<Undo className="w-4 h-4" />
							</ToolbarButton>
							<ToolbarButton
								onClick={() => editor.chain().focus().redo().run()}
								disabled={!editor.can().redo()}
								title="Redo"
							>
								<Redo className="w-4 h-4" />
							</ToolbarButton>
						</div>
					</div>

					{/* Editor Content */}
					<div className="flex-1 overflow-y-auto bg-[#111111]">
						<EditorContent editor={editor} />
					</div>
				</div>
			</div>
		</div>
	);
}

function ToolbarButton({
	onClick,
	active,
	disabled,
	children,
	title,
}: {
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	children: React.ReactNode;
	title: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={`
				p-2 rounded transition-colors
				${active ? "bg-[#FA4616] text-white" : "text-white/70 hover:text-white hover:bg-white/10"}
				${disabled ? "opacity-50 cursor-not-allowed" : ""}
			`}
		>
			{children}
		</button>
	);
}


