"use client";

import { Input } from "@/components/ui/input";
import { useCampaignComposer } from "../CampaignComposerProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsStep() {
    const {
        currentStep,
        trackOpens,
        setTrackOpens,
        trackClicks,
        setTrackClicks,
        utmTemplate,
        setUtmTemplate,
        timezone,
        setTimezone,
        quietHoursEnabled,
        setQuietHoursEnabled,
    } = useCampaignComposer();

    if (currentStep !== 2) return null;

    // Common timezone options
    const timezones = [
        { value: "UTC", label: "UTC (Coordinated Universal Time)" },
        { value: "America/New_York", label: "America/New_York (EST/EDT)" },
        { value: "America/Chicago", label: "America/Chicago (CST/CDT)" },
        { value: "America/Denver", label: "America/Denver (MST/MDT)" },
        { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
        { value: "Europe/London", label: "Europe/London (GMT/BST)" },
        { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
        { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
        { value: "Asia/Shanghai", label: "Asia/Shanghai (CST)" },
        { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT)" },
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-[#111111]">
            <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
                {/* Header */}
                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-white">Campaign Settings</h2>
                    <p className="text-white/60 text-base">
                        Configure tracking, analytics, and delivery preferences
                    </p>
                </div>

                {/* Settings Cards */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Tracking & Analytics Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#FA4616]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Tracking & Analytics
                            </CardTitle>
                            <p className="text-sm text-white/60 mt-1">
                                Monitor campaign performance with open and click tracking
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Tracking Options */}
                            <div className="space-y-4">
                                <div className="text-sm font-medium text-white/80">Tracking Options</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Track Opens */}
                                    <button
                                        onClick={() => setTrackOpens(!trackOpens)}
                                        className={`group relative p-4 rounded-lg border-2 transition-all text-left ${
                                            trackOpens
                                                ? 'bg-[#FA4616]/10 border-[#FA4616] shadow-lg shadow-[#FA4616]/10'
                                                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                                                trackOpens
                                                    ? 'bg-[#FA4616] border-[#FA4616]'
                                                    : 'border-white/30 group-hover:border-white/40'
                                            }`}>
                                                {trackOpens && (
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-medium mb-1 ${trackOpens ? 'text-[#FA4616]' : 'text-white'}`}>
                                                    Track Opens
                                                </div>
                                                <div className="text-sm text-white/60">
                                                    Monitor when recipients open your email
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Track Clicks */}
                                    <button
                                        onClick={() => setTrackClicks(!trackClicks)}
                                        className={`group relative p-4 rounded-lg border-2 transition-all text-left ${
                                            trackClicks
                                                ? 'bg-[#FA4616]/10 border-[#FA4616] shadow-lg shadow-[#FA4616]/10'
                                                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                                                trackClicks
                                                    ? 'bg-[#FA4616] border-[#FA4616]'
                                                    : 'border-white/30 group-hover:border-white/40'
                                            }`}>
                                                {trackClicks && (
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-medium mb-1 ${trackClicks ? 'text-[#FA4616]' : 'text-white'}`}>
                                                    Track Clicks
                                                </div>
                                                <div className="text-sm text-white/60">
                                                    Monitor link clicks within your email
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* UTM Parameters */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-white/80 block mb-1">
                                        UTM Parameters
                                    </label>
                                    <p className="text-xs text-white/50 mb-3">
                                        Track campaign performance in your analytics platform. Use {'{slug}'} as a placeholder for the campaign slug.
                                    </p>
                                </div>
                                <Input 
                                    value={utmTemplate} 
                                    onChange={(e) => setUtmTemplate(e.target.value)} 
                                    className="bg-white/5 border-white/10 text-white font-mono text-sm"
                                    placeholder="utm_source=membermail&utm_medium=email&utm_campaign={slug}"
                                />
                                {utmTemplate && (
                                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                        <div className="text-xs font-medium text-white/60 mb-1">Example Output:</div>
                                        <div className="text-xs text-white/80 font-mono break-all">
                                            {utmTemplate.replace(/\{slug\}/g, 'summer-sale-2024')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Settings Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#FA4616]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Delivery Settings
                            </CardTitle>
                            <p className="text-sm text-white/60 mt-1">
                                Configure timezone and quiet hours for optimal delivery
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Timezone Selection */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-white/80 block mb-1">
                                        Timezone
                                    </label>
                                    <p className="text-xs text-white/50 mb-3">
                                        Select the timezone for scheduling and delivery times
                                    </p>
                                </div>
                                <select 
                                    value={timezone} 
                                    onChange={(e) => setTimezone(e.target.value)} 
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FA4616] focus:border-transparent"
                                >
                                    {timezones.map((tz) => (
                                        <option key={tz.value} value={tz.value} className="bg-[#1a1a1a]">
                                            {tz.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Quiet Hours */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        quietHoursEnabled
                                            ? 'bg-[#FA4616]/10 border-[#FA4616] shadow-lg shadow-[#FA4616]/10'
                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                                            quietHoursEnabled
                                                ? 'bg-[#FA4616] border-[#FA4616]'
                                                : 'border-white/30'
                                        }`}>
                                            {quietHoursEnabled && (
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className={`font-medium mb-1 ${quietHoursEnabled ? 'text-[#FA4616]' : 'text-white'}`}>
                                                Enable Quiet Hours (9am – 8pm)
                                            </div>
                                            <div className="text-sm text-white/60">
                                                Only send emails during business hours in the recipient's local timezone to improve engagement
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {quietHoursEnabled && (
                                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                        <div className="flex items-start gap-2">
                                            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <div className="text-sm text-blue-400">
                                                Emails scheduled outside quiet hours will be held and sent at 9am in the recipient's timezone.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Best Practices Card */}
                    <Card className="border-white/20 bg-gradient-to-br from-white/5 to-transparent">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Best Practices
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-sm text-white/70">
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#FA4616] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Enable both open and click tracking for comprehensive analytics</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#FA4616] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Use UTM parameters to track campaign performance in Google Analytics</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#FA4616] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Enable quiet hours to respect your audience and improve open rates</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#FA4616] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Match timezone to your primary audience location for optimal delivery timing</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


