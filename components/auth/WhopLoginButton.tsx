"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";
import type { VariantProps } from "class-variance-authority";

/**
 * WhopLoginButton Component
 * 
 * A button that redirects users to the Whop OAuth login flow
 * 
 * @param next - Optional URL path to redirect to after successful login (default: current page)
 * @param children - Optional button content (default: "Login with Whop")
 * @param variant - Button variant from the button component
 * @param size - Button size
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <WhopLoginButton />
 * 
 * // With custom redirect
 * <WhopLoginButton next="/dashboard" />
 * 
 * // With custom content and styling
 * <WhopLoginButton variant="outline" className="w-full">
 *   Sign in with Whop
 * </WhopLoginButton>
 * ```
 */
export function WhopLoginButton({
	next,
	children = "Login with Whop",
	variant = "default",
	size = "md",
	className,
}: {
	next?: string;
	children?: React.ReactNode;
	variant?: VariantProps<typeof buttonVariants>["variant"];
	size?: VariantProps<typeof buttonVariants>["size"];
	className?: string;
}) {
	// Use current path as default redirect, or specified next parameter
	const redirectPath = next || "/dashboard";
	const loginUrl = `/api/oauth/init?next=${encodeURIComponent(redirectPath)}`;
	
	return (
		<Link 
			href={loginUrl}
			className={cn(buttonVariants({ variant, size }), className)}
		>
			{children}
		</Link>
	);
}
