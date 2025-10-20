"use client";

import Stepper from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { useCampaignComposer } from "./CampaignComposerProvider";

export default function TopStepperBar() {
    const { steps, currentStep, setCurrentStep, create, draftStatus, hasUnsavedChanges } = useCampaignComposer();
    const saving = false; // saving was local in original; create() handles toasts; button disabled logic can be extended later

    // Determine circle background color based on save status
    const getCircleStyle = () => {
        if (draftStatus === 'error') return { backgroundColor: '#ef4444' }; // red
        if (draftStatus === 'saving') return { backgroundColor: '#3b82f6' }; // blue
        // Show green when there are no unsaved changes (saved state)
        if (!hasUnsavedChanges) return { backgroundColor: '#22c55e' }; // green
        // Show grey when there are unsaved changes
        return { backgroundColor: '#d1d5db' }; // grey
    };

    const isSaving = draftStatus === 'saving';

    return (
        <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm shrink-0">
            <div className="px-8 py-3 flex items-center justify-between relative">
                {/* Sync indicator - left side */}
                <div className="flex items-center gap-3 min-w-[40px]">
                    <div className="relative flex items-center justify-center">
                        <div 
                            className={`w-3 h-3 rounded-full transition-colors duration-300 shadow-md ${isSaving ? 'animate-pulse' : ''}`}
                            style={{ 
                                ...getCircleStyle(),
                                boxShadow: '0 0 0 2px rgba(255,255,255,0.1)' 
                            }}
                            title={`Draft status: ${draftStatus || 'idle'} - ${hasUnsavedChanges ? 'unsaved' : 'saved'}`}
                        />
                        {draftStatus === 'saved' && !hasUnsavedChanges && (
                            <div 
                                className="absolute inset-0 w-3 h-3 rounded-full opacity-50 animate-ping"
                                style={{ backgroundColor: '#22c55e' }}
                            />
                        )}
                    </div>
                </div>

                {/* Center stepper */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    <Stepper steps={steps} currentIndex={currentStep} onChange={setCurrentStep} />
                </div>

                {/* Right buttons */}
                <div className="flex items-center gap-3">
                    {currentStep > 0 && (
                        <Button variant="secondary" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>Back</Button>
                    )}
                    {currentStep < steps.length - 1 ? (
                        <Button onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}>Next</Button>
                    ) : (
                        <Button onClick={create} disabled={saving}>
                            {saving ? "Creating..." : "Create Campaign"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}


