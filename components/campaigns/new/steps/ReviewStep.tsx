"use client";

import { useCampaignComposer } from "../CampaignComposerProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimulateSendCard } from "@/components/campaigns/SimulateSendButton";
import { useMemo, useState } from "react";
import { getEventLabel } from "@/lib/automations/events";
import type { AutomationTriggerEvent } from "@/lib/automations/events";

export default function ReviewStep() {
    const {
        currentStep,
        subject,
        previewText,
        audienceMode,
        selectedTiers,
        counts,
        trackOpens,
        trackClicks,
        utmTemplate,
        timezone,
        quietHoursEnabled,
        editor,
        sendMode,
        triggerEvent,
        triggerDelayValue,
        triggerDelayUnit,
        automationStatus,
    } = useCampaignComposer();
    
    // Preserve hooks order: compute and call hooks unconditionally,
    // and only decide what to render after hooks are called.
    const isActive = currentStep === 4;

    // Calculate total recipients based on audience mode
    const recipients = audienceMode === 'all_active' 
        ? (counts.activeCount ?? 0)
        : audienceMode === 'active_recent' 
            ? (counts.recentActiveCount ?? 0)
            : selectedTiers.reduce((s, t) => s + (counts.tierActiveCounts[t] ?? 0), 0);

    // Get audience label
    const audienceLabel = audienceMode === 'all_active' 
        ? 'All Active Members'
        : audienceMode === 'active_recent' 
            ? 'Recently Active (30 days)'
            : `Selected Tiers`;

    // Get HTML content for validation
    const htmlContent = editor?.getHTML() ?? '';

    const automationTriggerLabel =
        sendMode === 'automation' && triggerEvent
            ? getEventLabel(triggerEvent as AutomationTriggerEvent)
            : null;
    
    // Validation checks with detailed status
    const validationChecks = useMemo(() => [
        {
            id: 'subject',
            label: 'Subject line provided',
            status: subject.trim().length > 0,
            severity: 'error' as const,
            message: subject.trim().length > 0 ? `"${subject}"` : 'No subject line set',
        },
        {
            id: 'recipients',
            label: 'Recipients selected',
            status: recipients > 0,
            severity: 'error' as const,
            message: recipients > 0 ? `${recipients.toLocaleString()} recipients` : 'No recipients selected',
        },
        {
            id: 'content',
            label: 'Email content added',
            status: htmlContent.length > 50,
            severity: 'error' as const,
            message: htmlContent.length > 50 ? 'Content looks good' : 'Email appears to be empty',
        },
        {
            id: 'automation_trigger',
            label: 'Automation trigger configured',
            status: sendMode === 'manual' || Boolean(triggerEvent),
            severity: 'error' as const,
            message:
                sendMode === 'manual'
                    ? 'Manual delivery'
                    : triggerEvent
                        ? automationTriggerLabel ?? triggerEvent
                        : 'Select a trigger event',
        },
        {
            id: 'links',
            label: 'Links use HTTPS',
            status: !htmlContent.includes('href="http://'),
            severity: 'warning' as const,
            message: !htmlContent.includes('href="http://') 
                ? 'All links are secure' 
                : 'Some links use HTTP instead of HTTPS',
        },
        {
            id: 'tracking',
            label: 'Tracking configured',
            status: trackOpens || trackClicks,
            severity: 'info' as const,
            message: trackOpens && trackClicks 
                ? 'Tracking opens and clicks' 
                : trackOpens 
                    ? 'Tracking opens only'
                    : trackClicks 
                        ? 'Tracking clicks only'
                        : 'No tracking enabled',
        },
        {
            id: 'timezone',
            label: 'Timezone configured',
            status: timezone !== '',
            severity: 'info' as const,
            message: timezone || 'Not set',
        },
    ], [subject, recipients, htmlContent, trackOpens, trackClicks, timezone, sendMode, triggerEvent, automationTriggerLabel]);

    // Count issues by severity
    const errors = validationChecks.filter(c => c.severity === 'error' && !c.status);
    const warnings = validationChecks.filter(c => c.severity === 'warning' && !c.status);
    const isReady = errors.length === 0;

    if (!isActive) {
        return null;
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#111111]">
            <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
                {/* Header */}
                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-white">Review & Send</h2>
                    <p className="text-white/60 text-base">
                        Review your campaign details before sending
                    </p>
                </div>

                {/* Status Banner */}
                {isReady ? (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-semibold text-green-400">Campaign is ready to send</div>
                                <p className="text-sm text-green-400/80 mt-1">
                                    All requirements met. You can proceed to create this campaign.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-semibold text-red-400">
                                    Action required ({errors.length} {errors.length === 1 ? 'issue' : 'issues'})
                                </div>
                                <p className="text-sm text-red-400/80 mt-1">
                                    Please resolve the issues below before sending.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Campaign Details Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Email Content Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#FA4616]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Email Content
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-white/60">Subject Line</div>
                                <div className="text-base text-white">
                                    {subject || <span className="text-white/40 italic">No subject set</span>}
                                </div>
                            </div>
                            {previewText && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-white/60">Preview Text</div>
                                    <div className="text-sm text-white/80">{previewText}</div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-white/60">Content Length</div>
                                <div className="text-sm text-white/80">
                                    {htmlContent.length > 0 
                                        ? `${Math.round(htmlContent.length / 1000)}KB` 
                                        : 'Empty'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Audience Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#FA4616]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Audience
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-white/60">Target Audience</div>
                                <div className="text-base text-white">{audienceLabel}</div>
                            </div>
                            {audienceMode === 'tiers' && selectedTiers.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-white/60">Selected Tiers</div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTiers.map(tier => (
                                            <Badge key={tier} className="bg-[#FA4616]/20 text-[#FA4616]">
                                                {tier}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-white/60">Total Recipients</div>
                                <div className="text-2xl font-bold text-white">{recipients.toLocaleString()}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tracking & Settings Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#FA4616]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Tracking & Analytics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-white/60">Tracking Options</div>
                                <div className="flex flex-wrap gap-2">
                                    {trackOpens && <Badge className="bg-green-500/20 text-green-400">Opens Tracked</Badge>}
                                    {trackClicks && <Badge className="bg-green-500/20 text-green-400">Clicks Tracked</Badge>}
                                    {!trackOpens && !trackClicks && <Badge className="bg-white/10">No Tracking</Badge>}
                                </div>
                            </div>
                            {utmTemplate && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-white/60">UTM Parameters</div>
                                    <div className="text-xs text-white/70 font-mono bg-white/5 p-2 rounded border border-white/10 break-all">
                                        {utmTemplate}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Delivery Settings Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#FA4616]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Delivery Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-white/60">Send Mode</div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-white/10 text-white/80">
                                        {sendMode === 'automation' ? 'Automation' : 'Manual'}
                                    </Badge>
                                    {sendMode === 'automation' && triggerEvent && (
                                        <span className="text-xs text-white/60">{automationTriggerLabel ?? triggerEvent}</span>
                                    )}
                                </div>
                            </div>
                            {sendMode === 'automation' && triggerEvent && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-white/60">Automation Details</div>
                                    <div className="grid gap-1 text-sm text-white/80">
                                        <div className="flex items-center justify-between">
                                            <span>Trigger</span>
                                            <span>{automationTriggerLabel ?? triggerEvent}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Initial delay</span>
                                            <span>{triggerDelayValue} {triggerDelayUnit}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Status</span>
                                            <Badge className="bg-white/10 text-white/80 capitalize">{automationStatus}</Badge>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-white/60">Timezone</div>
                                <div className="text-sm text-white/80">{timezone || 'UTC'}</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-white/60">Quiet Hours</div>
                                <div className="flex items-center gap-2">
                                    {quietHoursEnabled ? (
                                        <Badge className="bg-blue-500/20 text-blue-400">Enabled (9am-8pm)</Badge>
                                    ) : (
                                        <Badge className="bg-white/10">Not Enabled</Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Validation Checklist Card */}
                <Card className="border-white/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#FA4616]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                Pre-Send Checklist
                            </CardTitle>
                            {isReady && (
                                <Badge className="bg-green-500/20 text-green-400">All Clear</Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {validationChecks.map((check) => (
                                <div 
                                    key={check.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                        check.status 
                                            ? 'bg-white/5 border-white/10' 
                                            : check.severity === 'error'
                                                ? 'bg-red-500/10 border-red-500/30'
                                                : check.severity === 'warning'
                                                    ? 'bg-yellow-500/10 border-yellow-500/30'
                                                    : 'bg-blue-500/10 border-blue-500/30'
                                    }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {check.status ? (
                                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        ) : check.severity === 'error' ? (
                                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-medium text-sm ${
                                            check.status 
                                                ? 'text-white' 
                                                : check.severity === 'error'
                                                    ? 'text-red-400'
                                                    : check.severity === 'warning'
                                                        ? 'text-yellow-400'
                                                        : 'text-blue-400'
                                        }`}>
                                            {check.label}
                                        </div>
                                        <div className="text-sm text-white/60 mt-0.5">
                                            {check.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {warnings.length > 0 && (
                            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                <div className="text-sm text-yellow-400">
                                    <span className="font-semibold">{warnings.length} warning{warnings.length > 1 ? 's' : ''}:</span> These won't prevent sending but should be reviewed.
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Development Tools - Only visible in dev mode */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="pt-4 border-t border-white/10">
                        <div className="text-xs text-white/40 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            Development Tools
                        </div>
                        <p className="text-sm text-white/60 mb-4">
                            Note: To simulate a campaign send, first create the campaign as a draft, then use the simulate button on the campaign list page or in the campaign details.
                        </p>
                        <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm text-orange-400/90">
                                    <strong>Testing Tip:</strong> After creating this campaign, you can simulate sending and generate mock analytics without actually sending emails. Look for the "Simulate Send (Dev)" button on the campaign page.
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
