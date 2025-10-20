"use client";

import * as React from "react";
import { cn } from "@/lib/ui/cn";

type SidebarContextValue = {
	open: boolean;
	setOpen: (value: boolean | ((value: boolean) => boolean)) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
	const ctx = React.useContext(SidebarContext);
	if (!ctx) {
		throw new Error("useSidebar must be used within a SidebarProvider");
	}
	return ctx;
}

type SidebarProviderProps = {
	children: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	defaultOpen?: boolean;
};

export function SidebarProvider({
	children,
	open: openProp,
	onOpenChange,
	defaultOpen = true,
}: SidebarProviderProps) {
	const [uncontrolledOpen, setUncontrolledOpen] = React.useState<boolean>(
		defaultOpen,
	);
	const open = openProp ?? uncontrolledOpen;

	const setOpen = React.useCallback(
		(value: boolean | ((value: boolean) => boolean)) => {
			const nextOpen =
				typeof value === "function" ? (value as (v: boolean) => boolean)(open) : value;
			if (onOpenChange) {
				onOpenChange(nextOpen);
			} else {
				setUncontrolledOpen(nextOpen);
			}
			// Persist state in a cookie so the preference sticks across reloads.
			if (typeof document !== "undefined") {
				document.cookie = `sidebar:open=${String(nextOpen)}; path=/; max-age=${60 * 60 * 24 * 365}`;
			}
		},
		[onOpenChange, open],
	);

	const value = React.useMemo<SidebarContextValue>(() => ({ open, setOpen }), [open, setOpen]);

	return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export type SidebarProps = React.HTMLAttributes<HTMLElement> & {
	collapsible?: "icon" | "off";
};

export function Sidebar({
	className,
	children,
	collapsible = "icon",
	...props
}: SidebarProps) {
	const { open } = useSidebar();
	return (
		<aside
			data-collapsible={collapsible}
			data-state={open ? "open" : "collapsed"}
			className={cn(
				"group/sidebar relative sticky top-0 h-screen shrink-0 border-r bg-[var(--sidebar)] text-[var(--sidebar-foreground)] border-[var(--sidebar-border)] transition-[width] duration-200 ease-in-out",
				open ? "w-60" : "w-16",
				"flex flex-col",
				className,
			)}
			{...props}
		>
			{children}
		</aside>
	);
}

export type SidebarSectionProps = React.HTMLAttributes<HTMLDivElement>;

export function SidebarHeader({ className, ...props }: SidebarSectionProps) {
	return (
		<div
			className={cn(
				"px-4 py-4 border-b border-[var(--sidebar-border)]",
				className,
			)}
			{...props}
		/>
	);
}

export function SidebarFooter({ className, ...props }: SidebarSectionProps) {
	return <div className={cn("mt-auto px-4 py-4", className)} {...props} />;
}

export function SidebarContent({ className, ...props }: SidebarSectionProps) {
	return (
		<div className={cn("px-2 py-2 overflow-y-auto flex-1", className)} {...props} />
	);
}

export function SidebarGroup({ className, ...props }: SidebarSectionProps) {
	return <div className={cn("px-1 py-1", className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }: SidebarSectionProps) {
	return (
		<div
			className={cn(
				"px-3 py-2 text-[10px] uppercase tracking-wide text-white/50 font-medium",
				className,
			)}
			{...props}
		/>
	);
}

export function SidebarGroupContent({ className, ...props }: SidebarSectionProps) {
	return <div className={cn("space-y-1", className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: SidebarSectionProps) {
	return <div className={cn("space-y-1", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: SidebarSectionProps) {
	return <div className={cn("relative", className)} {...props} />;
}

type SidebarMenuButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	asChild?: boolean;
	isActive?: boolean;
	children?: React.ReactNode;
};

export function SidebarMenuButton({
	className,
	isActive,
	asChild,
	children,
	...props
}: SidebarMenuButtonBaseProps) {
	const baseClasses = cn(
		"block rounded-md px-3 py-2 text-3 transition-colors",
		isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5",
		className,
	);

	if (asChild && React.isValidElement(children)) {
		return React.cloneElement(children, {
			className: cn(baseClasses, (children as any).props?.className),
		} as any);
	}

	return (
		<button type="button" className={baseClasses} {...props}>
			{children}
		</button>
	);
}

export type SidebarTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	icon?: React.ReactNode;
};

export function SidebarTrigger({ className, icon, ...props }: SidebarTriggerProps) {
    const { open, setOpen } = useSidebar();
	return (
		<button
			onClick={() => setOpen((prev) => !prev)}
			className={cn(
				"inline-flex h-9 w-9 items-center justify-center rounded-md bg-transparent text-white hover:bg-white/10",
				className,
			)}
			{...props}
		>
            {icon ?? (
                open ? (
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden
                        className="h-4 w-4"
                    >
                        <path fill="currentColor" d="M18 6h2v12h-2zm-2 5H7.414l4.293-4.293l-1.414-1.414L3.586 12l6.707 6.707l1.414-1.414L7.414 13H16z" />
                    </svg>
                ) : (
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden
                        className="h-4 w-4"
                    >
                        <path fill="currentColor" d="M4 6h2v12H4zm4 7h8.586l-4.293 4.293l1.414 1.414L20.414 12l-6.707-6.707l-1.414 1.414L16.586 11H8z" />
                    </svg>
                )
            )}
		</button>
	);
}

export type SidebarRailProps = React.HTMLAttributes<HTMLDivElement>;

export function SidebarRail({ className, ...props }: SidebarRailProps) {
    const { setOpen } = useSidebar();
    return (
        <div
            role="button"
            aria-label="Toggle sidebar"
            onClick={() => setOpen((prev) => !prev)}
            className={cn(
                "absolute right-0 top-0 h-full w-2 cursor-ew-resize bg-transparent hover:bg-white/5",
                className,
            )}
            {...props}
        />
    );
}


