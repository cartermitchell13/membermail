"use client";

import Link from "next/link";
import { buttonVariants } from "./button";
import { cn } from "@/lib/ui/cn";
import type { VariantProps } from "class-variance-authority";

interface ButtonLinkProps extends VariantProps<typeof buttonVariants> {
	href: string;
	children: React.ReactNode;
	className?: string;
	[key: string]: any;
}

/**
 * Client component wrapper for Link that uses button styling
 * Can be used in server components since it's a client component itself
 */
export function ButtonLink({ 
	href, 
	children, 
	variant = "default", 
	size = "md", 
	className,
	...props 
}: ButtonLinkProps) {
	return (
		<Link
			href={href}
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		>
			{children}
		</Link>
	);
}

