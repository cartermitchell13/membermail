"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";
import { Link as LinkIcon, ExternalLink, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * React component that renders as a TipTap NodeView for link placeholders
 * Shows a dashed border box with URL input embedded in the canvas
 */
export function LinkPlaceholderView({
	node,
	updateAttributes,
	deleteNode,
	editor,
	getPos,
}: {
	node: any;
	updateAttributes: (attrs: Record<string, any>) => void;
	deleteNode: () => void;
	editor: any;
	getPos?: () => number | undefined;
}) {
	const [url, setUrl] = useState("");
	const [linkText, setLinkText] = useState(node.attrs.suggestedText || "");
	const [isValidUrl, setIsValidUrl] = useState(true);

	/**
	 * Validate URL format
	 */
	const validateUrl = (urlValue: string): boolean => {
		if (!urlValue.trim()) return true; // Empty is valid (will show error on submit)
		try {
			// Allow relative URLs or full URLs
			if (urlValue.startsWith('/')) return true;
			if (urlValue.startsWith('#')) return true;
			if (urlValue.startsWith('mailto:')) return true;
			if (urlValue.startsWith('tel:')) return true;
			
			// Check if it's a valid URL
			new URL(urlValue.startsWith('http') ? urlValue : `https://${urlValue}`);
			return true;
		} catch {
			return false;
		}
	};

	/**
	 * Handle URL input change with validation
	 */
	const handleUrlChange = (value: string) => {
		setUrl(value);
		setIsValidUrl(validateUrl(value));
	};

	/**
	 * Insert the link into the editor
	 */
	const handleInsertLink = () => {
		const urlValue = url.trim();
		if (!urlValue) {
			setIsValidUrl(false);
			return;
		}

		if (!validateUrl(urlValue)) {
			setIsValidUrl(false);
			return;
		}

		// Normalize URL - add https:// if it looks like a domain
		let normalizedUrl = urlValue;
		if (!urlValue.startsWith('http') && !urlValue.startsWith('/') && !urlValue.startsWith('#') && !urlValue.startsWith('mailto:') && !urlValue.startsWith('tel:')) {
			normalizedUrl = `https://${urlValue}`;
		}

		const text = linkText.trim() || normalizedUrl;

		// Get the position of this specific placeholder node
		const pos = (() => {
			if (typeof getPos === "function") {
				const value = getPos();
				if (typeof value === "number") {
					return value;
				}
			}
			return editor?.state?.selection?.from ?? 0;
		})();

		// Replace this placeholder node with actual link text at its position
		editor.chain()
			.focus()
			.deleteRange({ from: pos, to: pos + node.nodeSize })
			.insertContentAt(pos, {
				type: 'text',
				text: text,
				marks: [{ type: 'link', attrs: { href: normalizedUrl } }],
			})
			.run();
	};

	/**
	 * Remove this placeholder entirely
	 */
	const handleRemove = () => {
		deleteNode();
	};

	// Render placeholder UI
	return (
		<NodeViewWrapper className="my-4">
			<div className="relative group border-2 border-dashed border-gray-600 rounded-lg p-6 bg-gray-900/50 hover:bg-gray-900/70 hover:border-gray-500 transition-all">
				<div className="flex flex-col items-center gap-3 text-center">
					{/* URL Input */}
					<div className="w-full max-w-md space-y-3">
						<div>
							<label className="block text-xs text-gray-400 mb-1.5 text-left">
								URL
							</label>
							<div className="relative">
								<input
									type="text"
									value={url}
									onChange={(e) => handleUrlChange(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handleInsertLink();
										}
									}}
									placeholder="https://example.com or /page"
									className={`w-full bg-gray-800 border ${
										!isValidUrl ? 'border-red-500/50' : 'border-gray-700'
									} rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FA4616] focus:border-transparent`}
								/>
								<ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
							</div>
							{!isValidUrl && (
								<p className="text-xs text-red-400 mt-1 text-left">
									Please enter a valid URL
								</p>
							)}
							<p className="text-xs text-gray-500 mt-1 text-left">
								Supports: https://, mailto:, tel:, /page, or #section
							</p>
							<p className="text-xs text-gray-400 mt-1 text-left">
								💡 Use the YouTube button in the toolbar to embed videos
							</p>
						</div>

						{/* Link Text Input */}
						<div>
							<label className="block text-xs text-gray-400 mb-1.5 text-left">
								Link Text <span className="text-gray-500">(optional)</span>
							</label>
							<input
								type="text"
								value={linkText}
								onChange={(e) => setLinkText(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										handleInsertLink();
									}
								}}
								placeholder="Click here"
								className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FA4616] focus:border-transparent"
							/>
							<p className="text-xs text-gray-500 mt-1 text-left">
								Leave empty to use the URL as text
							</p>
						</div>

						{/* Quick Links */}
						<div>
							<label className="block text-xs text-gray-400 mb-1.5 text-left">
								Quick Links
							</label>
							<div className="flex flex-wrap gap-2">
								<button
									onClick={() => handleUrlChange('mailto:')}
									className="px-3 py-1.5 text-xs rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors text-gray-300"
								>
									Email
								</button>
								<button
									onClick={() => handleUrlChange('tel:')}
									className="px-3 py-1.5 text-xs rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors text-gray-300"
								>
									Phone
								</button>
								<button
									onClick={() => handleUrlChange('#')}
									className="px-3 py-1.5 text-xs rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors text-gray-300"
								>
									Anchor
								</button>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-2 w-full max-w-md">
						<Button
							onClick={handleInsertLink}
							disabled={!url.trim() || !isValidUrl}
							className="flex-1 bg-[#FA4616] hover:bg-[#FA4616]/90"
							size="sm"
						>
							<Check className="w-4 h-4 mr-1" />
							Insert Link
						</Button>
					</div>

					<button
						onClick={handleRemove}
						className="text-xs text-gray-500 hover:text-gray-300 underline"
					>
						Remove placeholder
					</button>
				</div>
			</div>
		</NodeViewWrapper>
	);
}
