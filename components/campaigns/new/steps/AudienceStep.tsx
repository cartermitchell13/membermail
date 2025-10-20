"use client";

import { useCampaignComposer } from "../CampaignComposerProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AudienceStep() {
    const {
        currentStep,
        audienceMode,
        setAudienceMode,
        availableTiers,
        selectedTiers,
        setSelectedTiers,
        counts,
        loadingAudience,
    } = useCampaignComposer();

    if (currentStep !== 1) return null;

    // Calculate total recipients based on selected audience mode
    const recipients = audienceMode === 'all_active'
        ? (counts.activeCount ?? 0)
        : audienceMode === 'active_recent'
            ? (counts.recentActiveCount ?? 0)
            : selectedTiers.reduce((sum, t) => sum + (counts.tierActiveCounts[t] ?? 0), 0);

    // Audience mode options with descriptions
    const audienceOptions = [
        {
            key: 'all_active' as const,
            label: 'All Active Members',
            description: 'Send to everyone with an active membership',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            count: counts.activeCount,
        },
        {
            key: 'tiers' as const,
            label: 'By Membership Tier',
            description: 'Target specific membership tiers',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
            count: null,
        },
        {
            key: 'active_recent' as const,
            label: 'Recently Active',
            description: 'Members active in the last 30 days',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            count: counts.recentActiveCount,
        },
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-[#111111]">
            <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
                {/* Header */}
                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-white">Select Your Audience</h2>
                    <p className="text-white/60 text-base">Choose who will receive this campaign</p>
                </div>

                {/* Audience Mode Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {audienceOptions.map((option) => {
                        const isSelected = audienceMode === option.key;
                        return (
                            <button
                                key={option.key}
                                onClick={() => setAudienceMode(option.key)}
                                className={`relative text-left transition-all duration-200 ${
                                    isSelected
                                        ? 'ring-2 ring-[#FA4616] scale-[1.02]'
                                        : 'hover:scale-[1.01]'
                                }`}
                            >
                                <Card className={`h-full ${isSelected ? 'bg-[#FA4616]/10 border-[#FA4616]/30' : ''}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#FA4616]/20 text-[#FA4616]' : 'bg-white/5 text-white/60'}`}>
                                                {option.icon}
                                            </div>
                                            {isSelected && (
                                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FA4616] text-white">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <CardTitle className="text-base">{option.label}</CardTitle>
                                        <p className="text-sm text-white/60">{option.description}</p>
                                        {option.count !== null && (
                                            <div className="pt-2">
                                                <Badge className={isSelected ? 'bg-[#FA4616]/20 text-[#FA4616]' : ''}>
                                                    {loadingAudience ? '...' : option.count.toLocaleString()} members
                                                </Badge>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </button>
                        );
                    })}
                </div>

                {/* Tier Selection (shown when tiers mode is active) */}
                {audienceMode === 'tiers' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Membership Tiers</CardTitle>
                            <p className="text-sm text-white/60 mt-1">
                                Choose one or more tiers to target with this campaign
                            </p>
                        </CardHeader>
                        <CardContent>
                            {availableTiers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                    </div>
                                    <p className="text-white/60 mb-1">No membership tiers found</p>
                                    <p className="text-sm text-white/40">Create tiers in your membership settings</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {availableTiers.map((tier) => {
                                        const isSelected = selectedTiers.includes(tier);
                                        const tierCount = counts.tierActiveCounts[tier];
                                        return (
                                            <button
                                                key={tier}
                                                onClick={() => setSelectedTiers(
                                                    isSelected ? selectedTiers.filter((x: string) => x !== tier) : [...selectedTiers, tier]
                                                )}
                                                className={`group relative px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                                                    isSelected
                                                        ? 'bg-[#FA4616] border-[#FA4616] text-white shadow-lg shadow-[#FA4616]/20'
                                                        : 'border-white/10 text-white/80 hover:border-white/20 hover:bg-white/5'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                                        isSelected
                                                            ? 'bg-white border-white'
                                                            : 'border-white/30 group-hover:border-white/40'
                                                    }`}>
                                                        {isSelected && (
                                                            <svg className="w-3 h-3 text-[#FA4616]" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="font-medium">{tier}</span>
                                                    <span className={`text-sm ${isSelected ? 'text-white/80' : 'text-white/50'}`}>
                                                        ({tierCount !== undefined ? tierCount.toLocaleString() : '...'})
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Summary Card */}
                <Card className="bg-gradient-to-br from-[#FA4616]/10 to-transparent border-[#FA4616]/30">
                    <CardContent className="py-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="text-sm text-white/60">Campaign will be sent to</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-white">
                                        {loadingAudience ? '...' : recipients.toLocaleString()}
                                    </span>
                                    <span className="text-lg text-white/60">
                                        {recipients === 1 ? 'recipient' : 'recipients'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 rounded-full bg-[#FA4616]/20">
                                <svg className="w-8 h-8 text-[#FA4616]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        {audienceMode === 'tiers' && selectedTiers.length === 0 && (
                            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm text-yellow-500">
                                        Please select at least one tier to continue
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


