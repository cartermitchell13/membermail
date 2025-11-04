"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "default",
  isLoading = false,
}: ConfirmationDialogProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isLoading, onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Dialog */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#111111] shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* Header */}
        <div className="border-b border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-base leading-relaxed text-white/70 whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 p-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {cancelText}
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "min-w-[100px] inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA4616] disabled:pointer-events-none disabled:opacity-50 relative h-9 px-4",
              confirmVariant === "destructive"
                ? "!bg-red-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.4),0_2px_4px_rgba(239,68,68,0.3)] !border-red-500 hover:!bg-red-700 hover:shadow-[0_6px_16px_rgba(239,68,68,0.5),0_3px_6px_rgba(239,68,68,0.4)] hover:translate-y-[-1px] active:translate-y-[0px] active:!bg-red-700 active:shadow-[0_2px_8px_rgba(239,68,68,0.4),0_1px_2px_rgba(239,68,68,0.3)]"
                : "bg-gradient-to-b from-[#FF8F4A] to-[#FA4616] text-white shadow-[0_4px_12px_rgba(250,70,22,0.4),0_2px_4px_rgba(250,70,22,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(184,50,15,0.3)] border border-[#E23F14]/50 hover:shadow-[0_6px_16px_rgba(250,70,22,0.5),0_3px_6px_rgba(250,70,22,0.4),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(184,50,15,0.4)] hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-[0_2px_8px_rgba(250,70,22,0.4),0_1px_2px_rgba(250,70,22,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
            )}
            style={confirmVariant === "destructive" ? { backgroundColor: "#dc2626", borderColor: "#ef4444" } : undefined}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                <span>Loading...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
