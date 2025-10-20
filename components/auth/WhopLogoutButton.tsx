"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";
import type { VariantProps } from "class-variance-authority";

/**
 * WhopLogoutButton Component
 * 
 * A button that logs out the user and redirects them
 * 
 * @param redirect - Optional URL path to redirect to after logout (default: /)
 * @param children - Optional button content (default: "Logout")
 * @param variant - Button variant from the button component
 * @param size - Button size
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <WhopLogoutButton />
 * 
 * // With custom redirect
 * <WhopLogoutButton redirect="/goodbye" />
 * 
 * // With custom content and styling
 * <WhopLogoutButton variant="outline" className="text-red-500">
 *   Sign Out
 * </WhopLogoutButton>
 * ```
 */
export function WhopLogoutButton({
	redirect = "/",
	children = "Logout",
	variant = "outline",
	size = "md",
	className,
}: {
	redirect?: string;
	children?: React.ReactNode;
	variant?: VariantProps<typeof buttonVariants>["variant"];
	size?: VariantProps<typeof buttonVariants>["size"];
	className?: string;
}) {
	const logoutUrl = `/api/oauth/logout?redirect=${encodeURIComponent(redirect)}`;
	
	return (
		<Link 
			href={logoutUrl}
			className={cn(buttonVariants({ variant, size }), className)}
		>
			{children}
		</Link>
	);
}
