"use client";

import { Editor } from "@tiptap/react";
import { 
	Bold, 
	Italic, 
	Underline, 
	AlignLeft, 
	AlignCenter, 
	AlignRight,
	List,
	ListOrdered,
	Heading1,
	Heading2,
	Heading3,
	Link as LinkIcon,
	Palette
} from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";
import { useState } from "react";

/**
 * Formatting toolbar for the email editor
 * Provides quick access to text formatting and styling options
 */
interface FormattingToolbarProps {
	editor: Editor | null;
}

export function FormattingToolbar({ editor }: FormattingToolbarProps) {
	const [showColorPicker, setShowColorPicker] = useState(false);

	if (!editor) {
		return null;
	}

	/**
	 * Get current text color from editor
	 */
	const getCurrentColor = () => {
		return editor.getAttributes('textStyle').color || '#000000';
	};

	/**
	 * Apply color to selected text
	 */
	const applyColor = (color: string) => {
		editor.chain().focus().setColor(color).run();
	};

	/**
	 * Toggle link
	 */
	const toggleLink = () => {
		const previousUrl = editor.getAttributes('link').href;
		const url = window.prompt('URL', previousUrl);

		// cancelled
		if (url === null) {
			return;
		}

		// empty
		if (url === '') {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}

		// update link
		editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	};

	return (
		<div className="flex flex-wrap items-center gap-1 p-2 bg-gray-900 border border-gray-700 rounded-lg mb-3">
			{/* Text Style */}
			<div className="flex items-center gap-1 pr-2 border-r border-gray-700">
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
					isActive={editor.isActive('heading', { level: 1 })}
					title="Heading 1"
				>
					<Heading1 className="w-4 h-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					isActive={editor.isActive('heading', { level: 2 })}
					title="Heading 2"
				>
					<Heading2 className="w-4 h-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
					isActive={editor.isActive('heading', { level: 3 })}
					title="Heading 3"
				>
					<Heading3 className="w-4 h-4" />
				</ToolbarButton>
			</div>

			{/* Text Formatting */}
			<div className="flex items-center gap-1 pr-2 border-r border-gray-700">
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBold().run()}
					isActive={editor.isActive('bold')}
					title="Bold"
				>
					<Bold className="w-4 h-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleItalic().run()}
					isActive={editor.isActive('italic')}
					title="Italic"
				>
					<Italic className="w-4 h-4" />
				</ToolbarButton>
			</div>

			{/* Text Alignment */}
			<div className="flex items-center gap-1 pr-2 border-r border-gray-700">
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign('left').run()}
					isActive={editor.isActive({ textAlign: 'left' })}
					title="Align Left"
				>
					<AlignLeft className="w-4 h-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign('center').run()}
					isActive={editor.isActive({ textAlign: 'center' })}
					title="Align Center"
				>
					<AlignCenter className="w-4 h-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign('right').run()}
					isActive={editor.isActive({ textAlign: 'right' })}
					title="Align Right"
				>
					<AlignRight className="w-4 h-4" />
				</ToolbarButton>
			</div>

			{/* Lists */}
			<div className="flex items-center gap-1 pr-2 border-r border-gray-700">
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					isActive={editor.isActive('bulletList')}
					title="Bullet List"
				>
					<List className="w-4 h-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					isActive={editor.isActive('orderedList')}
					title="Numbered List"
				>
					<ListOrdered className="w-4 h-4" />
				</ToolbarButton>
			</div>

			{/* Link */}
			<div className="flex items-center gap-1 pr-2 border-r border-gray-700">
				<ToolbarButton
					onClick={toggleLink}
					isActive={editor.isActive('link')}
					title="Add Link"
				>
					<LinkIcon className="w-4 h-4" />
				</ToolbarButton>
			</div>

			{/* Text Color */}
			<div className="flex items-center gap-1">
				<div className="relative">
					<ToolbarButton
						onClick={() => setShowColorPicker(!showColorPicker)}
						isActive={showColorPicker}
						title="Text Color"
					>
						<Palette className="w-4 h-4" />
					</ToolbarButton>
					{showColorPicker && (
						<div className="absolute top-full left-0 mt-2 z-50">
							<div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
								<ColorPicker
									label="Text Color"
									value={getCurrentColor()}
									onChange={(color) => {
										applyColor(color);
										setShowColorPicker(false);
									}}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

/**
 * Reusable toolbar button component
 */
interface ToolbarButtonProps {
	onClick: () => void;
	isActive?: boolean;
	title: string;
	children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, title, children }: ToolbarButtonProps) {
	return (
		<button
			onClick={onClick}
			title={title}
			className={`p-2 rounded transition-colors ${
				isActive
					? 'bg-[#FA4616] text-white'
					: 'text-gray-400 hover:text-white hover:bg-gray-800'
			}`}
		>
			{children}
		</button>
	);
}
