import * as React from "react";
import { cn } from "@/lib/ui/cn";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-2 font-medium text-white",
				className,
			)}
			{...props}
		/>
	);
}


