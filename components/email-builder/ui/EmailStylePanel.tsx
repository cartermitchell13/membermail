"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { ColorPicker } from "@/components/ui/color-picker";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Email style customization panel
 * Provides controls for colors, typography, and spacing
 * Similar to Beehiiv's style panel
 */
interface EmailStylePanelProps {
	editor: Editor | null;
	emailStyles: EmailStyles;
	onStyleChange: (styles: EmailStyles) => void;
}

/**
 * Email-wide style configuration
 * Currently focused on colors only
 */
export interface EmailStyles {
	// Colors
	outsideBackground: string;
	postBackground: string;
	textOnBackground: string;
	primary: string;
	textOnPrimary: string;
	secondary: string;
	links: string;
}

/**
 * Default email styles
 */
export const defaultEmailStyles: EmailStyles = {
	outsideBackground: "#FFFFFF",
	postBackground: "#FFFFFF",
	textOnBackground: "#2D2D2D",
	primary: "#030712",
	textOnPrimary: "#FFFFFF",
	secondary: "#030712",
	links: "#0C4A6E",
};


export function EmailStylePanel({ editor, emailStyles, onStyleChange }: EmailStylePanelProps) {
	/**
	 * Update a specific style property
	 */
	const updateStyle = (key: keyof EmailStyles, value: string | number) => {
		onStyleChange({
			...emailStyles,
			[key]: value,
		});
	};

	return (
		<div className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden w-80">
			{/* Header */}
			<div className="bg-[#2a2a2a] border-b border-white/10 px-4 py-3">
				<h3 className="text-sm font-semibold text-white">Email Colors</h3>
				<p className="text-xs text-white/70 mt-0.5">Customize your email color scheme</p>
			</div>

			{/* Content */}
			<div className="p-4 space-y-3 max-h-[500px] overflow-y-auto bg-[#1a1a1a]">
				<ColorControl
					label="Outside Background"
					value={emailStyles.outsideBackground}
					onChange={(color) => updateStyle("outsideBackground", color)}
					description="Background color outside email content"
				/>
				<ColorControl
					label="Post Background"
					value={emailStyles.postBackground}
					onChange={(color) => updateStyle("postBackground", color)}
					description="Main email content background"
				/>
				<ColorControl
					label="Text Color"
					value={emailStyles.textOnBackground}
					onChange={(color) => updateStyle("textOnBackground", color)}
					description="Primary text color"
				/>
				<ColorControl
					label="Primary Button"
					value={emailStyles.primary}
					onChange={(color) => updateStyle("primary", color)}
					description="CTA button background"
				/>
				<ColorControl
					label="Button Text"
					value={emailStyles.textOnPrimary}
					onChange={(color) => updateStyle("textOnPrimary", color)}
					description="Text on primary buttons"
				/>
				<ColorControl
					label="Secondary"
					value={emailStyles.secondary}
					onChange={(color) => updateStyle("secondary", color)}
					description="Secondary accent color"
				/>
				<ColorControl
					label="Links"
					value={emailStyles.links}
					onChange={(color) => updateStyle("links", color)}
					description="Hyperlink color"
				/>
			</div>
		</div>
	);
}


/**
 * Color control component
 */
interface ColorControlProps {
	label: string;
	value: string;
	onChange: (color: string) => void;
	description?: string;
}

function ColorControl({ label, value, onChange, description }: ColorControlProps) {
	const [showPicker, setShowPicker] = useState(false);

	return (
		<div className="border border-white/10 rounded-lg p-3 bg-white/5 hover:bg-white/10 transition-colors">
			<div className="flex items-start justify-between mb-2">
				<div className="flex-1">
					<label className="text-sm font-medium text-white block">
						{label}
					</label>
					{description && (
						<p className="text-xs text-white/70 mt-0.5">{description}</p>
					)}
				</div>
			</div>
			<div className="relative">
				<button
					onClick={() => setShowPicker(!showPicker)}
					className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/20 rounded-md hover:bg-white/10 hover:border-white/30 transition-colors"
				>
					<div
						className="w-6 h-6 rounded border-2 border-white/30"
						style={{ backgroundColor: value }}
					/>
					<span className="text-sm text-white font-mono flex-1 text-left">{value}</span>
					<svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
					</svg>
				</button>
				{showPicker && (
					<>
						{/* Backdrop */}
						<div 
							className="fixed inset-0 z-40" 
							onClick={() => setShowPicker(false)}
						/>
						{/* Picker */}
						<div className="absolute left-0 top-full mt-2 z-50">
							<div className="bg-[#2a2a2a] border border-white/20 rounded-lg p-3 shadow-xl">
								<ColorPicker
									label=""
									value={value}
									onChange={(color) => {
										onChange(color);
										setShowPicker(false);
									}}
								/>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

