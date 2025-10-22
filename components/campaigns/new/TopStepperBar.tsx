"use client";

import Stepper from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { useCampaignComposer } from "./CampaignComposerProvider";

export default function TopStepperBar() {
    // Include setShowPreview so we can open the Preview modal from this top bar
    const { steps, currentStep, setCurrentStep, create, draftStatus, hasUnsavedChanges, setShowPreview } = useCampaignComposer();
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

    // Get text label based on status
    const getStatusLabel = () => {
        if (draftStatus === 'error') return 'Save failed';
        if (draftStatus === 'saving') return 'Saving';
        if (draftStatus === 'saved' && !hasUnsavedChanges) return 'Saved';
        if (hasUnsavedChanges) return 'Not saved';
        return 'Ready';
    };

    const isSaving = draftStatus === 'saving';

    return (
        <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm shrink-0">
            <div className="px-8 py-3 flex items-center justify-between relative">
                {/* Sync indicator - left side */}
                <div className="flex items-center gap-2 min-w-[120px]">
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
                    <span className="text-xs font-medium text-white/80">
                        {getStatusLabel()}
                    </span>
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
                        <>
                            {/* Preview button: opens the full email preview modal so users can see their content rendered */}
                            <Button variant="secondary" onClick={() => setShowPreview(true)}>Preview</Button>
                            <Button onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}>Next</Button>
                        </>
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


