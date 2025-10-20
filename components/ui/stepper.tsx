"use client";

import { cn } from "@/lib/ui/cn";
import React from "react";

export type Step = {
  key: string;
  label: string;
};

type StepperProps = {
  steps: Step[];
  currentIndex: number;
  onChange?: (index: number) => void;
};

export function Stepper({ steps, currentIndex, onChange }: StepperProps) {
  return (
    <nav className="flex items-center justify-center gap-4">
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        return (
          <React.Fragment key={step.key}>
            <button
              type="button"
              onClick={() => onChange?.(index)}
              className={cn(
                "text-sm font-medium transition-colors select-none focus:outline-none whitespace-nowrap",
                isCurrent ? "text-white" : "text-white/40 hover:text-white/60",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              {step.label}
            </button>
            {index < steps.length - 1 && (
              <div className="h-px w-12 bg-white/20" aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Stepper;


