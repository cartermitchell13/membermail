"use client";

import { useEffect } from "react";
import { useCampaignComposer } from "../CampaignComposerProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUPPORTED_AUTOMATION_EVENTS, getEventLabel } from "@/lib/automations/events";
import type { AutomationTriggerEvent } from "@/lib/automations/events";
import { cn } from "@/lib/ui/cn";

const DELAY_UNITS: { value: "minutes" | "hours" | "days"; label: string }[] = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];

export default function AutomationStep() {
  const {
    currentStep,
    sendMode,
    setSendMode,
    triggerEvent,
    setTriggerEvent,
    triggerDelayValue,
    setTriggerDelayValue,
    triggerDelayUnit,
    setTriggerDelayUnit,
    automationStatus,
    setAutomationStatus,
    automationSequenceId,
  } = useCampaignComposer();

  useEffect(() => {
    if (sendMode === "automation" && !triggerEvent) {
      setTriggerEvent(SUPPORTED_AUTOMATION_EVENTS[0]?.code ?? null);
      setAutomationStatus("active");
    }
    if (sendMode === "manual") {
      setAutomationStatus("draft");
    }
  }, [sendMode, triggerEvent, setTriggerEvent, setAutomationStatus]);

  if (currentStep !== 3) return null;

  const isAutomation = sendMode === "automation";

  const handleModeSelect = (mode: "manual" | "automation") => {
    if (automationSequenceId && mode === "manual") return;
    setSendMode(mode);
    if (mode === "manual") {
      setTriggerEvent(null);
      setTriggerDelayValue(0);
      setTriggerDelayUnit("minutes");
      setAutomationStatus("draft");
    } else if (!triggerEvent) {
      setTriggerEvent(SUPPORTED_AUTOMATION_EVENTS[0]?.code ?? null);
      setAutomationStatus("active");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#111111]">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-white">Delivery & Automation</h2>
          <p className="text-white/60 text-base">
            Choose how this campaign is delivered. Automations trigger emails based on Whop events and scheduling rules.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className={cn(
              "transition-all",
              sendMode === "manual" ? "border-[#FA4616]/40 bg-[#FA4616]/5 ring-1 ring-[#FA4616]/30" : "hover:border-white/20",
              automationSequenceId ? "opacity-60" : undefined,
            )}
          >
            <button
              type="button"
              onClick={() => handleModeSelect("manual")}
              className="w-full text-left disabled:cursor-not-allowed disabled:opacity-60"
              disabled={Boolean(automationSequenceId)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  Manual send
                  {sendMode === "manual" && (
                    <span className="rounded-full bg-[#FA4616]/20 px-3 py-1 text-xs font-medium text-[#FA4616]">
                      Selected
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-white/60">
                  Schedule and send this campaign manually. Perfect for one-off announcements and newsletters.
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-white/50">
                  {automationSequenceId ? "Managed by your automation sequence" : "Manual emails send when you trigger them."}
                </p>
              </CardContent>
            </button>
          </Card>

          <Card
            className={cn(
              "transition-all",
              isAutomation ? "border-[#FA4616]/40 bg-[#FA4616]/5 ring-1 ring-[#FA4616]/30" : "hover:border-white/20",
              automationSequenceId ? "opacity-60" : undefined,
            )}
          >
            <button
              type="button"
              onClick={() => handleModeSelect("automation")}
              className="w-full text-left disabled:cursor-not-allowed disabled:opacity-60"
              disabled={Boolean(automationSequenceId)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  Automation
                  {isAutomation && (
                    <span className="rounded-full bg-[#FA4616]/20 px-3 py-1 text-xs font-medium text-[#FA4616]">
                      Selected
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-white/60">
                  Deliver automatically when Whop events fire—ideal for lifecycle sequences, win-backs, and dunning flows.
                </p>
              </CardHeader>
            </button>
          </Card>
        </div>

        {isAutomation && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-white">Trigger event</CardTitle>
                <p className="text-sm text-white/60">
                  Pick the Whop event that should start this automation.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {SUPPORTED_AUTOMATION_EVENTS.map((event) => {
                    const isSelected = triggerEvent === event.code;
                    return (
                      <button
                        key={event.code}
                        type="button"
                        onClick={() => setTriggerEvent(event.code)}
                        className={cn(
                          "rounded-lg border px-4 py-3 text-left transition-all",
                          isSelected
                            ? "border-[#FA4616] bg-[#FA4616]/10 text-white shadow-[#FA4616]/10 shadow"
                            : "border-white/10 text-white/80 hover:border-white/30 hover:text-white",
                        )}
                      >
                        <div className="text-sm font-semibold">{event.label}</div>
                        <div className="mt-1 text-xs text-white/40">{event.code}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-white">Send timing</CardTitle>
                  <p className="text-sm text-white/60">
                    Delay the send after the trigger event fires.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        value={triggerDelayValue}
                        onChange={(event) => {
                          const next = Number.parseInt(event.target.value, 10);
                          setTriggerDelayValue(Number.isNaN(next) ? 0 : Math.max(0, next));
                        }}
                        className="bg-white/5 text-white border-white/10"
                      />
                      <select
                        value={triggerDelayUnit}
                        onChange={(event) => setTriggerDelayUnit(event.target.value as typeof triggerDelayUnit)}
                        className="rounded-md border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FA4616]"
                      >
                        {DELAY_UNITS.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-white/50">
                      Emails will queue immediately when the event arrives and respect quiet hours before delivery.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-white">Automation status</CardTitle>
                  <p className="text-sm text-white/60">
                    Pause automations without deleting your configuration.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="inline-flex rounded-md border border-white/10 bg-white/5 p-1">
                    <Button
                      type="button"
                      variant={automationStatus === "active" ? "default" : "ghost"}
                      onClick={() => setAutomationStatus("active")}
                      className={cn(
                        automationStatus === "active"
                          ? "bg-[#FA4616] text-white hover:bg-[#FA4616]/90"
                          : "text-white/70 hover:text-white",
                      )}
                    >
                      Active
                    </Button>
                    <Button
                      type="button"
                      variant={automationStatus === "paused" ? "default" : "ghost"}
                      onClick={() => setAutomationStatus("paused")}
                      className={cn(
                        automationStatus === "paused"
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "text-white/70 hover:text-white",
                      )}
                    >
                      Paused
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-white/50">
                    When paused, incoming events are ignored until you reactivate.
                  </p>
                </CardContent>
              </Card>
            </div>

            {triggerEvent && (
              <Card className="border-white/20 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Automation summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-white/70">
                  <p>
                    <span className="text-white">Trigger:</span>{" "}
                    {getEventLabel(triggerEvent as AutomationTriggerEvent)} ({triggerEvent})
                  </p>
                  <p>
                    <span className="text-white">Initial delay:</span> {triggerDelayValue} {triggerDelayUnit}
                  </p>
                  <p>
                    <span className="text-white">Status:</span> {automationStatus === "active" ? "Active" : "Paused"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}






