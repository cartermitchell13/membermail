"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";
import { ImageIcon, Sparkles, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * React component that renders as a TipTap NodeView for image placeholders
 * Shows a dashed border box with options to generate an image from AI or upload manually
 */
export function ImagePlaceholderView({
	node,
	updateAttributes,
	deleteNode,
	editor,
}: {
	node: any;
	updateAttributes: (attrs: Record<string, any>) => void;
	deleteNode: () => void;
	editor: any;
}) {
	const [showDialog, setShowDialog] = useState(false);
	const [prompt, setPrompt] = useState(node.attrs.suggestedPrompt || "");
	const [isGenerating, setIsGenerating] = useState(false);
	const [aspectRatio, setAspectRatio] = useState<string>("16:9");

	/**
	 * Generate image using Gemini API
	 */
	const handleGenerateImage = async () => {
		if (!prompt.trim()) {
			toast.error("Please enter a prompt");
			return;
		}

		setIsGenerating(true);
		const loadingToast = toast.loading("Generating image with AI...");

		try {
			const response = await fetch("/api/ai/generate-image", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: prompt.trim(),
					aspectRatio,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => "Failed to generate image");
				throw new Error(errorText);
			}

			const data = await response.json();

			if (!data.url) {
				throw new Error("No image URL returned");
			}

			// Update the node to show the generated image
			updateAttributes({
				src: data.url,
				isPlaceholder: false,
			});

			toast.success("Image generated successfully!", { id: loadingToast });
			setShowDialog(false);
		} catch (error) {
			console.error("Image generation error:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to generate image",
				{ id: loadingToast }
			);
		} finally {
			setIsGenerating(false);
		}
	};

	/**
	 * Handle manual image upload
	 */
	const handleUploadClick = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			// Upload to your backend
			const formData = new FormData();
			formData.append("file", file);

			try {
				toast.loading("Uploading image...");
				const response = await fetch("/api/upload-image", {
					method: "POST",
					body: formData,
				});

				if (!response.ok) throw new Error("Upload failed");

				const data = await response.json();
				updateAttributes({
					src: data.url,
					isPlaceholder: false,
				});
				toast.success("Image uploaded!");
			} catch (error) {
				toast.error("Failed to upload image");
				console.error(error);
			}
		};
		input.click();
	};

	/**
	 * Close dialog and keep placeholder
	 */
	const handleCancel = () => {
		setShowDialog(false);
	};

	/**
	 * Remove this placeholder entirely
	 */
	const handleRemove = () => {
		deleteNode();
	};

	// If not a placeholder AND has a real src, render regular image
	if (!node.attrs.isPlaceholder && node.attrs.src) {
		return (
			<NodeViewWrapper>
				<img
					src={node.attrs.src}
					alt={node.attrs.alt || ""}
					title={node.attrs.title || ""}
					className="max-w-full h-auto rounded"
				/>
			</NodeViewWrapper>
		);
	}

	// Render placeholder UI (either isPlaceholder=true OR empty src)
	return (
		<NodeViewWrapper className="my-4">
			{!showDialog ? (
				// Collapsed placeholder view
				<div className="relative group border-2 border-dashed border-gray-600 rounded-lg p-8 bg-gray-900/50 hover:bg-gray-900/70 hover:border-gray-500 transition-all">
					<div className="flex flex-col items-center gap-4 text-center">
						<div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
							<ImageIcon className="w-8 h-8 text-gray-400" />
						</div>
						
						<div className="space-y-1">
							<p className="text-sm font-medium text-gray-200">
								{node.attrs.alt || "Image placeholder"}
							</p>
							<p className="text-xs text-gray-400 max-w-md">
								AI can generate this image for you
							</p>
						</div>

						<div className="flex gap-2">
							<Button
								onClick={() => setShowDialog(true)}
								size="sm"
								className="bg-[#FA4616] hover:bg-[#FA4616]/90"
							>
								<Sparkles className="w-4 h-4 mr-1" />
								Generate with AI
							</Button>
							<Button
								onClick={handleUploadClick}
								size="sm"
								variant="outline"
							>
								<Upload className="w-4 h-4 mr-1" />
								Upload
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
			) : (
				// Expanded dialog view for generating image
				<div className="border-2 border-gray-600 rounded-lg p-6 bg-gray-900 shadow-xl">
					<div className="space-y-4">
						<div>
							<h3 className="text-lg font-semibold text-white mb-1">
								Generate Image with AI
							</h3>
							<p className="text-sm text-gray-400">
								Describe what you want to see in this image
							</p>
						</div>

						{/* Prompt textarea */}
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Image prompt
							</label>
							<textarea
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								placeholder="E.g., Professional product photo of a modern drum kit, dark background, studio lighting..."
								className="w-full min-h-[100px] px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FA4616] focus:border-transparent resize-y"
								disabled={isGenerating}
							/>
							<p className="mt-1 text-xs text-gray-500">
								Be specific: include subject, setting, lighting, style, mood
							</p>
						</div>

						{/* Aspect ratio selector */}
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Aspect ratio
							</label>
							<div className="flex gap-2">
								{["16:9", "1:1", "4:3", "3:4"].map((ratio) => (
									<button
										key={ratio}
										onClick={() => setAspectRatio(ratio)}
										className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
											aspectRatio === ratio
												? "bg-[#FA4616] text-white"
												: "bg-gray-800 text-gray-300 hover:bg-gray-700"
										}`}
										disabled={isGenerating}
									>
										{ratio}
									</button>
								))}
							</div>
						</div>

						{/* Action buttons */}
						<div className="flex gap-2 pt-2">
							<Button
								onClick={handleGenerateImage}
								disabled={isGenerating || !prompt.trim()}
								className="flex-1 bg-[#FA4616] hover:bg-[#FA4616]/90"
							>
								{isGenerating ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Generating...
									</>
								) : (
									<>
										<Sparkles className="w-4 h-4 mr-2" />
										Generate Image
									</>
								)}
							</Button>
							<Button
								onClick={handleCancel}
								variant="outline"
								disabled={isGenerating}
							>
								Cancel
							</Button>
						</div>
					</div>
				</div>
			)}
		</NodeViewWrapper>
	);
}
