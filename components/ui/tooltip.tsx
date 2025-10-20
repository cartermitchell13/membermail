"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/ui/cn";

/**
 * TooltipProvider component that wraps the application to enable tooltips.
 * This should be placed at the root of your application.
 */
const TooltipProvider = TooltipPrimitive.Provider;

/**
 * Tooltip root component that manages the tooltip state.
 */
const Tooltip = TooltipPrimitive.Root;

/**
 * TooltipTrigger component that wraps the element that triggers the tooltip.
 */
const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * TooltipContent component that displays the tooltip content.
 * Wrapped in a Portal to render outside parent containers and appear above all elements.
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-[9999] overflow-hidden rounded-md bg-white text-black px-3 py-1.5 text-xs shadow-md border border-gray-200 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
