"use client";

import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { useState, useEffect } from "react";
import { 
	ExternalLink, 
	Palette, 
	Settings, 
	AlignLeft, 
	AlignCenter, 
	AlignRight,
	Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import type { CtaVariant, CtaAlign } from "../extensions/CTA";

/**
 * React component that renders as a TipTap NodeView for CTA buttons
 * Provides visual customization controls for button appearance and behavior
 */
export function CTACustomizer({
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
	// Extract current attributes from the node
	const [url, setUrl] = useState(node.attrs.href || "");
	const [backgroundColor, setBackgroundColor] = useState(node.attrs.backgroundColor || "#FA4616");
	const [textColor, setTextColor] = useState(node.attrs.textColor || "#FFFFFF");
	const [borderRadius, setBorderRadius] = useState(node.attrs.borderRadius || 8);
	const [padding, setPadding] = useState(node.attrs.padding || "12px 24px");
	const [variant, setVariant] = useState<CtaVariant>(node.attrs.variant || "primary");
	const [align, setAlign] = useState<CtaAlign>(node.attrs.align || "left");
	const [showCustomizer, setShowCustomizer] = useState(false);

	// Ensure node attributes are populated so getHTML includes data- attributes
	useEffect(() => {
		updateAttributes({
			href: url,
			backgroundColor,
			textColor,
			borderRadius,
			padding,
			variant,
			align,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Keep node attributes in sync with state changes
	useEffect(() => {
		updateAttributes({
			href: url,
			backgroundColor,
			textColor,
			borderRadius,
			padding,
			variant,
			align,
		});
	}, [url, backgroundColor, textColor, borderRadius, padding, variant, align, updateAttributes]);

	/**
	 * Update the URL attribute
	 */
	const handleUrlChange = (value: string) => {
		setUrl(value);
		updateAttributes({ href: value });
	};

	/**
	 * Update background color
	 */
	const handleBackgroundColorChange = (color: string) => {
		setBackgroundColor(color);
		updateAttributes({ backgroundColor: color });
	};

	/**
	 * Update text color
	 */
	const handleTextColorChange = (color: string) => {
		setTextColor(color);
		updateAttributes({ textColor: color });
	};

	/**
	 * Update border radius
	 */
	const handleBorderRadiusChange = (value: number) => {
		setBorderRadius(value);
		updateAttributes({ borderRadius: value });
	};

	/**
	 * Update padding
	 */
	const handlePaddingChange = (value: string) => {
		setPadding(value);
		updateAttributes({ padding: value });
	};

	/**
	 * Update variant
	 */
	const handleVariantChange = (newVariant: CtaVariant) => {
		setVariant(newVariant);
		updateAttributes({ variant: newVariant });
	};

	/**
	 * Update alignment
	 */
	const handleAlignChange = (newAlign: CtaAlign) => {
		setAlign(newAlign);
		updateAttributes({ align: newAlign });
	};

	/**
	 * Get button text from node content
	 */
	const getButtonText = () => {
		return node.textContent || "Call to Action";
	};

	/**
	 * Build button style based on current attributes
	 */
	const getButtonStyle = () => {
		const style: React.CSSProperties = {
			backgroundColor: backgroundColor || "#FA4616",
			color: textColor || "#FFFFFF",
			borderRadius: `${borderRadius}px`,
			padding: padding || "12px 24px",
			textDecoration: "none",
			display: "inline-block",
			fontWeight: 600,
			cursor: "pointer",
			border: variant === "outline" ? `2px solid ${backgroundColor || "#FA4616"}` : "none",
		};

		// Override styles for outline variant
		if (variant === "outline") {
			style.backgroundColor = "transparent";
			style.color = backgroundColor || "#FA4616";
		}

		return style;
	};

	/**
	 * Get container alignment style
	 */
	const getContainerStyle = () => {
		const textAlign = align === "center" ? "center" : align === "right" ? "right" : "left";
		return { textAlign } as React.CSSProperties;
	};

	// Render the CTA customizer UI
	return (
		<NodeViewWrapper className="my-4 mm-cta-node">
			<div className="relative group">
				{/* Preview of the button */}
				<div 
					className="border-2 border-dashed border-gray-600 rounded-lg p-6 bg-gray-900/50 hover:bg-gray-900/70 hover:border-gray-500 transition-all"
					style={getContainerStyle()}
				>
					<span
						style={getButtonStyle()}
						className="transition-all hover:opacity-90"
					>
						<NodeViewContent className="inline-block outline-none" />
					</span>
				</div>

				{/* Customization toggle button */}
				<Button
					onClick={() => setShowCustomizer(!showCustomizer)}
					variant="secondary"
					size="sm"
					className="absolute top-2 right-2"
					title="Customize button"
				>
					<Settings className="w-4 h-4" />
				</Button>

				{/* Customization panel */}
				{showCustomizer && (
					<div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-4">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-sm font-semibold text-white flex items-center gap-2">
								<Palette className="w-4 h-4" />
								Customize Button
							</h3>
							<Button
								onClick={() => setShowCustomizer(false)}
								variant="ghost"
								size="xs"
							>
								Close
							</Button>
						</div>

						{/* URL Input */}
						<div>
							<label className="block text-xs text-gray-400 mb-1.5">
								Button URL
							</label>
							<div className="relative">
								<Input
									type="text"
									value={url}
									onChange={(e) => handleUrlChange(e.target.value)}
									placeholder="https://example.com"
									className="bg-gray-900 border-gray-700 text-white text-sm pr-8"
								/>
								<ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
							</div>
						</div>

						{/* Variant Selection */}
						<div>
							<label className="block text-xs text-gray-400 mb-1.5">
								Button Style
							</label>
							<div className="flex gap-2">
								<button
									onClick={() => handleVariantChange("primary")}
									className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
										variant === "primary"
											? "bg-[#FA4616] border-[#FA4616] text-white"
											: "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600"
									}`}
								>
									Primary
								</button>
								<button
									onClick={() => handleVariantChange("secondary")}
									className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
										variant === "secondary"
											? "bg-gray-700 border-gray-600 text-white"
											: "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600"
									}`}
								>
									Secondary
								</button>
								<button
									onClick={() => handleVariantChange("outline")}
									className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
										variant === "outline"
											? "border-[#FA4616] text-[#FA4616]"
											: "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600"
									}`}
								>
									Outline
								</button>
							</div>
						</div>

						{/* Color Pickers */}
						<div className="grid grid-cols-2 gap-3">
							<ColorPicker
								label="Background Color"
								value={backgroundColor}
								onChange={handleBackgroundColorChange}
							/>
							<ColorPicker
								label="Text Color"
								value={textColor}
								onChange={handleTextColorChange}
							/>
						</div>

						{/* Border Radius */}
						<div>
							<label className="block text-xs text-gray-400 mb-1.5">
								Border Radius: {borderRadius}px
							</label>
							<input
								type="range"
								min="0"
								max="50"
								value={borderRadius}
								onChange={(e) => handleBorderRadiusChange(parseInt(e.target.value))}
								className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
								style={{
									background: `linear-gradient(to right, #FA4616 0%, #FA4616 ${(borderRadius / 50) * 100}%, #374151 ${(borderRadius / 50) * 100}%, #374151 100%)`
								}}
							/>
						</div>

						{/* Padding */}
						<div>
							<label className="block text-xs text-gray-400 mb-1.5">
								Padding (e.g., "12px 24px")
							</label>
							<Input
								type="text"
								value={padding}
								onChange={(e) => handlePaddingChange(e.target.value)}
								placeholder="12px 24px"
								className="bg-gray-900 border-gray-700 text-white text-sm"
							/>
						</div>

						{/* Alignment */}
						<div>
							<label className="block text-xs text-gray-400 mb-1.5">
								Alignment
							</label>
							<div className="flex gap-2">
								<button
									onClick={() => handleAlignChange("left")}
									className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
										align === "left"
											? "bg-gray-700 border-gray-600 text-white"
											: "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600"
									}`}
								>
									<AlignLeft className="w-4 h-4 mx-auto" />
								</button>
								<button
									onClick={() => handleAlignChange("center")}
									className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
										align === "center"
											? "bg-gray-700 border-gray-600 text-white"
											: "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600"
									}`}
								>
									<AlignCenter className="w-4 h-4 mx-auto" />
								</button>
								<button
									onClick={() => handleAlignChange("right")}
									className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
										align === "right"
											? "bg-gray-700 border-gray-600 text-white"
											: "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600"
									}`}
								>
									<AlignRight className="w-4 h-4 mx-auto" />
								</button>
							</div>
						</div>

						{/* Delete Button */}
						<div className="pt-2 border-t border-gray-700">
							<Button
								onClick={deleteNode}
								variant="outline"
								className="w-full text-red-400 border-red-400/30 hover:bg-red-400/10"
								size="sm"
							>
								<Trash2 className="w-4 h-4 mr-2" />
								Remove Button
							</Button>
						</div>
					</div>
				)}
			</div>
		</NodeViewWrapper>
	);
}
