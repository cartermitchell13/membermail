"use client";

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
import { useCallback } from "react";

type EmailEditorProps = {
	content?: string;
	onChange?: (html: string) => void;
};

export default function EmailEditor({ content = "", onChange }: EmailEditorProps) {
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
				placeholder: "Start writing...",
			}),
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

