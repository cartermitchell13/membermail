"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

/**
 * ColorPicker component for selecting colors visually
 * Provides preset colors and a custom hex input
 */
interface ColorPickerProps {
	value: string;
	onChange: (color: string) => void;
	presets?: string[];
	label?: string;
}

// Default preset colors with a variety of options
const DEFAULT_PRESETS = [
	"#FA4616", // Primary orange
	"#FF6B35", // Coral
	"#4ECDC4", // Turquoise
	"#44BBA4", // Teal
	"#3498DB", // Blue
	"#9B59B6", // Purple
	"#E74C3C", // Red
	"#F39C12", // Yellow
	"#2ECC71", // Green
	"#1ABC9C", // Emerald
	"#34495E", // Dark gray
	"#95A5A6", // Gray
	"#ECF0F1", // Light gray
	"#FFFFFF", // White
	"#000000", // Black
];

export function ColorPicker({ value, onChange, presets = DEFAULT_PRESETS, label }: ColorPickerProps) {
	const [hexInput, setHexInput] = useState(value);

	/**
	 * Validate and apply hex color
	 */
	const handleHexChange = (hex: string) => {
		setHexInput(hex);
		// Validate hex color format
		if (/^#[0-9A-F]{6}$/i.test(hex)) {
			onChange(hex);
		}
	};

	/**
	 * Handle preset color selection
	 */
	const handlePresetSelect = (color: string) => {
		setHexInput(color);
		onChange(color);
	};

	return (
		<div className="space-y-2">
			{label && <label className="text-xs text-gray-400">{label}</label>}
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="w-full justify-start text-left font-normal"
					>
						<div className="flex items-center gap-2">
							<div
								className="h-4 w-4 rounded border border-gray-600"
								style={{ backgroundColor: value }}
							/>
							<span className="text-sm">{value}</span>
						</div>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-64 bg-gray-900 border-gray-700 text-white">
					<div className="space-y-3">
						{/* Hex input */}
						<div>
							<label className="text-xs text-gray-300 mb-1.5 block font-medium">
								Hex Color
							</label>
							<Input
								value={hexInput}
								onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
								placeholder="#FFFFFF"
								className="bg-gray-800 border-gray-700 text-white text-sm placeholder-gray-500"
								maxLength={7}
							/>
						</div>

						{/* Preset colors grid */}
						<div>
							<label className="text-xs text-gray-300 mb-1.5 block font-medium">
								Preset Colors
							</label>
							<div className="grid grid-cols-5 gap-2">
								{presets.map((preset) => (
									<button
										key={preset}
										onClick={() => handlePresetSelect(preset)}
										className="relative h-8 w-8 rounded border-2 border-gray-700 hover:border-gray-500 transition-colors"
										style={{ backgroundColor: preset }}
										title={preset}
										type="button"
									>
										{value === preset && (
											<Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-lg" />
										)}
									</button>
								))}
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
