"use client";

import * as React from "react";
import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/ui/cn";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
    ({ value, onChange, options, placeholder, className }, ref) => {
        const [isOpen, setIsOpen] = useState(false);
        const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
        const [mounted, setMounted] = useState(false);
        const selectRef = useRef<HTMLDivElement>(null);
        const buttonRef = useRef<HTMLButtonElement>(null);
        const dropdownRef = useRef<HTMLDivElement>(null);

        // Track mounted state for portal
        useEffect(() => {
            setMounted(true);
        }, []);

        // Update dropdown position when opened
        useEffect(() => {
            if (isOpen && buttonRef.current) {
                const updatePosition = () => {
                    const rect = buttonRef.current!.getBoundingClientRect();
                    setDropdownPosition({
                        top: rect.bottom + window.scrollY + 4,
                        left: rect.left + window.scrollX,
                        width: rect.width,
                    });
                };
                updatePosition();
                window.addEventListener("scroll", updatePosition, true);
                window.addEventListener("resize", updatePosition);
                return () => {
                    window.removeEventListener("scroll", updatePosition, true);
                    window.removeEventListener("resize", updatePosition);
                };
            }
        }, [isOpen]);

        // Close dropdown when clicking outside
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (
                    selectRef.current &&
                    !selectRef.current.contains(event.target as Node) &&
                    dropdownRef.current &&
                    !dropdownRef.current.contains(event.target as Node)
                ) {
                    setIsOpen(false);
                }
            };
            if (isOpen) {
                document.addEventListener("mousedown", handleClickOutside);
            }
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, [isOpen]);

        // Close dropdown on Escape key
        useEffect(() => {
            const handleEscape = (event: KeyboardEvent) => {
                if (event.key === "Escape" && isOpen) {
                    setIsOpen(false);
                    buttonRef.current?.focus();
                }
            };
            document.addEventListener("keydown", handleEscape);
            return () => document.removeEventListener("keydown", handleEscape);
        }, [isOpen]);

        const selectedOption = options.find((opt) => opt.value === value);
        const displayValue = selectedOption?.label || placeholder || "";

        const dropdownContent = isOpen && mounted ? (
            <div
                ref={dropdownRef}
                className="fixed z-[9999] rounded-lg border border-white/10 bg-[#111111] shadow-xl overflow-hidden"
                style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${Math.max(dropdownPosition.width, 140)}px`,
                    minWidth: "140px",
                }}
            >
                <div className="max-h-80 overflow-y-auto">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm transition-colors whitespace-nowrap",
                                value === option.value
                                    ? "bg-white/10 text-white font-medium"
                                    : "text-white/90 hover:bg-white/5"
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        ) : null;

        return (
            <>
                <div ref={selectRef} className={cn("relative", className)}>
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "flex h-10 w-full min-w-[140px] items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus-visible:ring-2 focus-visible:ring-accent-9 transition-colors",
                            isOpen && "ring-2 ring-accent-9 border-transparent"
                        )}
                        aria-haspopup="listbox"
                        aria-expanded={isOpen}
                    >
                        <span className={cn("flex-1 truncate text-left", value ? "text-white" : "text-white/40")}>
                            {displayValue}
                        </span>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 flex-shrink-0 text-white/60 transition-transform",
                                isOpen && "rotate-180"
                            )}
                        />
                    </button>
                </div>
                {mounted && typeof document !== "undefined" && dropdownContent && createPortal(dropdownContent, document.body)}
            </>
        );
    }
);

Select.displayName = "Select";
