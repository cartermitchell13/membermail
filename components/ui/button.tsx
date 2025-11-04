"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA4616] disabled:pointer-events-none disabled:opacity-50 relative",
	{
		variants: {
			variant: {
				default: "bg-gradient-to-b from-[#FF8F4A] to-[#FA4616] text-white shadow-[0_4px_12px_rgba(250,70,22,0.4),0_2px_4px_rgba(250,70,22,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(184,50,15,0.3)] border border-[#E23F14]/50 hover:shadow-[0_6px_16px_rgba(250,70,22,0.5),0_3px_6px_rgba(250,70,22,0.4),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(184,50,15,0.4)] hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-[0_2px_8px_rgba(250,70,22,0.4),0_1px_2px_rgba(250,70,22,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]",
				secondary: "bg-gradient-to-b from-white/15 to-white/10 text-white shadow-[0_4px_12px_rgba(255,255,255,0.1),0_2px_4px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.2)] border border-white/20 hover:shadow-[0_6px_16px_rgba(255,255,255,0.15),0_3px_6px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.25)] hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-[0_2px_8px_rgba(255,255,255,0.1),0_1px_2px_rgba(255,255,255,0.05)]",
				outline: "border-2 border-white/30 bg-transparent text-white shadow-[0_4px_12px_rgba(255,255,255,0.1),0_2px_4px_rgba(255,255,255,0.05)] hover:bg-white/10 hover:shadow-[0_6px_16px_rgba(255,255,255,0.15),0_3px_6px_rgba(255,255,255,0.08)] hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-[0_2px_8px_rgba(255,255,255,0.1)]",
				ghost: "text-white hover:bg-white/10 shadow-none hover:shadow-[0_2px_8px_rgba(255,255,255,0.1)] hover:translate-y-[-1px] active:translate-y-[0px]",
			},
			size: {
				xs: "h-7 px-2 text-xs font-normal",
				sm: "h-8 px-3",
				md: "h-9 px-4",
				lg: "h-10 px-5",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "md",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, ...props }, ref) => {
		return (
			<button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };


