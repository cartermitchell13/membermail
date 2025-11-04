"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Blockquote from "@tiptap/extension-blockquote";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { Minus } from 'lucide-react';
import { offset } from "@floating-ui/dom";
import Columns from "./email-builder/extensions/Columns";
import SlashCommand from "./email-builder/extensions/SlashCommand";
import DragHandle from "@tiptap/extension-drag-handle-react";
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
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type EmailEditorProps = {
	content?: string;
	onChange?: (html: string) => void;
};

export default function EmailEditor({ content = "", onChange }: EmailEditorProps) {
	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({ blockquote: false }),
			Blockquote.configure({
				HTMLAttributes: { class: "mm-blockquote" },
			}),
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
				placeholder: "Start writing...",
			}),
			Youtube.configure({ controls: true, nocookie: true }),
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			HorizontalRule.configure({ HTMLAttributes: { class: "mm-hr" } }),
			Columns,
			SlashCommand,
			// React DragHandle registers the extension automatically via the component below
		],
		content,
		editorProps: {
			attributes: {
				class: "prose prose-invert max-w-none focus:outline-none min-h-[500px] px-6 py-4",
			},
		},
		onUpdate: ({ editor }) => {
			onChange?.(editor.getHTML());
		},
	});

	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [uploading, setUploading] = useState(false);
	const [showYoutubeInput, setShowYoutubeInput] = useState(false);
	const [youtubeUrl, setYoutubeUrl] = useState("");
	const ytInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (showYoutubeInput) {
			requestAnimationFrame(() => ytInputRef.current?.focus());
		}
	}, [showYoutubeInput]);

	const addLink = useCallback(() => {
		if (!editor) return;
		const url = window.prompt("Enter URL");
		if (url) {
			editor.chain().focus().setLink({ href: url }).run();
		}
	}, [editor]);

	const onPickFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!editor) return;
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}
		if (file.size > 4 * 1024 * 1024) {
			toast.error("Image too large (max 4MB)");
			return;
		}
		try {
			setUploading(true);
			const fd = new FormData();
			fd.append("file", file);
			const res = await fetch("/api/uploads/image", { method: "POST", body: fd });
			if (!res.ok) {
				toast.error("Upload failed");
				return;
			}
			const data = await res.json();
			if (data?.url) {
				editor.chain().focus().setImage({ src: data.url }).run();
				toast.success("Image inserted");
			}
		} catch {
			toast.error("Upload error");
		} finally {
			setUploading(false);
			// reset input so same file can be selected again
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	}, [editor]);

	const triggerUpload = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const addYoutube = useCallback(() => {
		setYoutubeUrl("");
		setShowYoutubeInput(true);
	}, []);

	const confirmYoutube = useCallback(() => {
		if (!editor) return;
		const url = youtubeUrl.trim();
		if (!url) {
			setShowYoutubeInput(false);
			return;
		}
		try {
			editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run();
			setShowYoutubeInput(false);
			setYoutubeUrl("");
		} catch {
			toast.error("Invalid YouTube URL");
		}
	}, [editor, youtubeUrl]);

	if (!editor) {
		return null;
	}

	return (
		<div className="flex flex-col h-full">
			{/* Toolbar */}
			<div className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
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
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					active={editor.isActive("blockquote")}
					title="Toggle Blockquote"
				>
					<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M7 7h6v6H7V7zm0 8h10v2H7v-2zm8-8h2v6h-2V7z" />
					</svg>
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left" active={editor.isActive({ textAlign: 'left' })}>
					<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 6h14v2H3V6zm0 4h10v2H3v-2zm0 4h14v2H3v-2zm0 4h10v2H3v-2z"/></svg>
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center" active={editor.isActive({ textAlign: 'center' })}>
					<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 6h14v2H5V6zm3 4h8v2H8v-2zm-3 4h14v2H5v-2zm3 4h8v2H8v-2z"/></svg>
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right" active={editor.isActive({ textAlign: 'right' })}>
					<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 6h14v2H7V6zm7 4h7v2h-7v-2zm-7 4h14v2H7v-2zm7 4h7v2h-7v-2z"/></svg>
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justify" active={editor.isActive({ textAlign: 'justify' })}>
					<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 6h18v2H3V6zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/></svg>
				</ToolbarButton>
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
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={onPickFile}
					/>
					<ToolbarButton onClick={triggerUpload} title={uploading ? "Uploading..." : "Upload Image"} disabled={uploading}>
						<ImageIcon className="w-4 h-4" />
					</ToolbarButton>
				<ToolbarButton onClick={addYoutube} title="Insert YouTube Video">
					{/* simple play icon using SVG to avoid adding new deps */}
					<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M10 8l6 4-6 4V8z"></path>
					</svg>
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
					<ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Add Horizontal Rule">
						<Minus className="w-4 h-4" />
					</ToolbarButton>
				</div>
			</div>

			{/* Editor Content */}
			<div className="flex-1 overflow-y-auto bg-[#111111] relative">
				<EditorContent editor={editor} />
				<DragHandle
					editor={editor}
					computePositionConfig={{ placement: "left", strategy: "fixed", middleware: [offset(12)] }}
					className="custom-drag-handle"
				>
					<span />
				</DragHandle>
				{showYoutubeInput ? (
					<div className="absolute inset-0 flex items-start justify-center pointer-events-none">
						<div className="mt-10 w-[520px] pointer-events-auto bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl">
							<div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
								<div className="text-sm font-medium">Insert YouTube Video</div>
								<button onClick={() => setShowYoutubeInput(false)} className="text-white/60 hover:text-white">✕</button>
							</div>
							<div className="p-4 space-y-3">
								<input
									ref={ytInputRef}
									value={youtubeUrl}
									onChange={(e) => setYoutubeUrl(e.target.value)}
									placeholder="Paste or type a YouTube URL"
									className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
									onKeyDown={(e) => {
										if (e.key === "Enter") confirmYoutube();
										if (e.key === "Escape") setShowYoutubeInput(false);
									}}
								/>
								<div className="flex justify-end gap-2">
									<Button size="sm" variant="outline" onClick={() => setShowYoutubeInput(false)}>Cancel</Button>
									<Button size="sm" onClick={confirmYoutube}>Insert</Button>
								</div>
							</div>
						</div>
					</div>
				) : null}
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

export { EmailEditor };

