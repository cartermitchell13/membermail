"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getEventLabel } from "@/lib/automations/events";
import type { AutomationTriggerEvent } from "@/lib/automations/events";

type AutomationStepRecord = {
  id: number;
  position: number;
  delay_value: number;
  delay_unit: "minutes" | "hours" | "days";
  campaign_id: number;
  campaign?: {
    id: number;
    subject: string;
  } | null;
};

type AutomationSequenceRecord = {
  id: number;
  name: string;
  trigger_event: string;
  trigger_label: string | null;
  status: "draft" | "active" | "paused" | "archived";
  timezone: string | null;
  quiet_hours_enabled: boolean | null;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  automation_steps: AutomationStepRecord[] | null;
};

const DELAY_UNITS = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
] as const;

const DEFAULT_QUIET_START = 9;
const DEFAULT_QUIET_END = 20;

export default function FlowEditorPage({ params }: { params: Promise<{ companyId: string; flowId: string }> }) {
  const { companyId, flowId } = use(params);
  const router = useRouter();
  const [sequence, setSequence] = useState<AutomationSequenceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [delayValue, setDelayValue] = useState(0);
  const [delayUnit, setDelayUnit] = useState<(typeof DELAY_UNITS)[number]["value"]>("minutes");
  const [timezone, setTimezone] = useState("UTC");
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState(DEFAULT_QUIET_START);
  const [quietEnd, setQuietEnd] = useState(DEFAULT_QUIET_END);
  const [savingSettings, setSavingSettings] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchSequence = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/automations/sequences/${flowId}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setSequence(data.sequence ?? null);
      setError(null);
    } catch (err) {
      console.error("Failed to load automation flow", err);
      setError("Unable to load this flow. It may have been deleted.");
    } finally {
      setLoading(false);
    }
  }, [flowId]);

  useEffect(() => {
    fetchSequence();
  }, [fetchSequence]);

  useEffect(() => {
    if (!sequence) return;
    setTimezone(sequence.timezone ?? "UTC");
    setQuietEnabled(Boolean(sequence.quiet_hours_enabled));
    setQuietStart(sequence.quiet_hours_start ?? DEFAULT_QUIET_START);
    setQuietEnd(sequence.quiet_hours_end ?? DEFAULT_QUIET_END);
  }, [sequence]);

  const steps = useMemo(
    () => (sequence?.automation_steps ?? []).slice().sort((a, b) => a.position - b.position),
    [sequence?.automation_steps],
  );

  const updateSequence = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!sequence) return;
      setSavingSettings(true);
      try {
        const response = await fetch(`/api/automations/sequences/${sequence.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        await fetchSequence();
      } catch (err) {
        console.error("Failed to update flow", err);
      } finally {
        setSavingSettings(false);
      }
    },
    [fetchSequence, sequence],
  );

  const handleStatusToggle = async () => {
    if (!sequence) return;
    setUpdatingStatus(true);
    try {
      const nextStatus = sequence.status === "active" ? "paused" : "active";
      if (sequence.status === "draft") {
        await updateSequence({ status: "active" });
      } else {
        await updateSequence({ status: nextStatus });
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddEmail = () => {
    if (!sequence) return;
    const safeDelay = Number.isFinite(delayValue) ? Math.max(0, Math.floor(delayValue)) : 0;
    const params = new URLSearchParams({
      automationEditor: "1",
      automationSequenceId: String(sequence.id),
      stepDelayValue: String(safeDelay),
      stepDelayUnit: delayUnit,
      returnTo: `/dashboard/${companyId}/automations/flows/${sequence.id}`,
    });
    router.push(`/dashboard/${companyId}/campaigns/new?${params.toString()}`);
  };

  const handleMoveStep = async (step: AutomationStepRecord, direction: "up" | "down") => {
    if (!sequence) return;
    const delta = direction === "up" ? -1 : 1;
    const newPosition = step.position + delta;
    if (newPosition < 1 || newPosition > steps.length) return;
    await fetch(`/api/automations/sequences/${sequence.id}/steps/${step.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position: newPosition }),
    });
    await fetchSequence();
  };

  const handleRemoveStep = async (step: AutomationStepRecord) => {
    if (!sequence) return;
    const confirmed = window.confirm("Remove this step and delete the attached email?");
    if (!confirmed) return;
    await fetch(`/api/automations/sequences/${sequence.id}/steps/${step.id}`, { method: "DELETE" });
    await fetchSequence();
  };

  const handleQuietToggle = async (enabled: boolean) => {
    if (!sequence) return;
    setQuietEnabled(enabled);
    await updateSequence({
      quiet_hours_enabled: enabled,
      quiet_hours_start: quietStart,
      quiet_hours_end: quietEnd,
    });
  };

  const handleQuietBlur = async (field: "quiet_hours_start" | "quiet_hours_end", value: number) => {
    if (!sequence) return;
    const clamped = Math.min(23, Math.max(0, Math.floor(value)));
    if (field === "quiet_hours_start") {
      setQuietStart(clamped);
    } else {
      setQuietEnd(clamped);
    }
    await updateSequence({
      quiet_hours_enabled: quietEnabled,
      quiet_hours_start: field === "quiet_hours_start" ? clamped : quietStart,
      quiet_hours_end: field === "quiet_hours_end" ? clamped : quietEnd,
    });
  };

  const handleTimezoneBlur = async () => {
    if (!sequence) return;
    const next = timezone.trim() || "UTC";
    setTimezone(next);
    await updateSequence({ timezone: next });
  };

  if (loading) {
    return <div className="p-6 text-sm text-white/60">Loading flow…</div>;
  }

  if (!sequence) {
    return (
      <div className="p-6">
        <Link href={`/dashboard/${companyId}/automations`} className="text-sm text-primary hover:underline">
          ← Back to automations
        </Link>
        <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error ?? "Flow not found."}
        </div>
      </div>
    );
  }

  const triggerLabel = sequence.trigger_label ?? getEventLabel(sequence.trigger_event as AutomationTriggerEvent);
  const statusLabel = sequence.status === "draft" ? "Activate" : sequence.status === "active" ? "Pause" : "Resume";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <Link href={`/dashboard/${companyId}/automations`} className="text-sm text-primary hover:underline">
          ← Back to automations
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">{sequence.name}</h1>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="rounded-full border border-white/10 px-2 py-0.5 uppercase tracking-wide text-white/50">
                {triggerLabel}
              </span>
              <span>ID: {sequence.id}</span>
            </div>
          </div>
          <Button variant="outline" onClick={handleStatusToggle} disabled={updatingStatus}>
            {updatingStatus ? "Updating…" : statusLabel}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">{error}</div>
      )}

      <section className="grid gap-4 rounded-lg border border-white/10 bg-black/30 p-4 text-sm text-white/80 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Flow settings</h2>
          <p className="text-xs text-white/60">
            Timezone:
            <input
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              onBlur={handleTimezoneBlur}
              className="ml-2 inline-flex h-8 w-32 rounded border border-white/10 bg-black/40 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FA4616]"
            />
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={quietEnabled}
                onChange={(event) => handleQuietToggle(event.target.checked)}
                className="h-4 w-4 rounded border border-white/40 bg-black/40"
              />
              Quiet hours
            </label>
            {quietEnabled && (
              <>
                <label className="flex items-center gap-1">
                  Start
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={quietStart}
                    onChange={(event) => setQuietStart(Number(event.target.value))}
                    onBlur={(event) => handleQuietBlur("quiet_hours_start", Number(event.target.value))}
                    className="h-8 w-20 flex-none bg-black/40 text-xs text-white"
                  />
                </label>
                <label className="flex items-center gap-1">
                  End
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={quietEnd}
                    onChange={(event) => setQuietEnd(Number(event.target.value))}
                    onBlur={(event) => handleQuietBlur("quiet_hours_end", Number(event.target.value))}
                    className="h-8 w-20 flex-none bg-black/40 text-xs text-white"
                  />
                </label>
              </>
            )}
            {savingSettings && <span className="text-white/40">Saving…</span>}
          </div>
          <p className="text-xs text-white/50">
            Quiet hours move scheduled sends into the next allowed window using the flow timezone.
          </p>
        </div>

        <div className="space-y-2 rounded-md border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm font-semibold text-white">How it works</h3>
          <ul className="space-y-2 text-xs text-white/60">
            <li>1. Whop sends the <span className="font-medium text-white/70">{triggerLabel}</span> webhook.</li>
            <li>2. Member is enrolled, waits the configured delay, then receives the next email.</li>
            <li>3. Pausing the flow stops new sends; resume to pick up future events.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-white">Steps</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
            <span>{steps.length} step{steps.length === 1 ? "" : "s"}</span>
            <span>Last updated just now</span>
          </div>
        </header>

        {steps.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/20 bg-black/30 p-6 text-center text-sm text-white/60">
            No steps yet. Add an email below to start the flow.
          </div>
        ) : (
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/30 px-4 py-4 text-sm text-white/80 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="text-xs text-white/40">Step {index + 1}</div>
                  <div className="font-medium text-white">{step.campaign?.subject ?? "Untitled email"}</div>
                  <div className="text-xs text-white/50">
                    Delay: {step.delay_value} {step.delay_unit}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Link
                    href={`/dashboard/${companyId}/campaigns/${step.campaign_id}`}
                    className="rounded-md border border-white/10 px-2 py-1 text-white hover:border-white/40"
                  >
                    Open email
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveStep(step, "up")}
                    disabled={index === 0}
                    className="h-8 px-3"
                  >
                    Up
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveStep(step, "down")}
                    disabled={index === steps.length - 1}
                    className="h-8 px-3"
                  >
                    Down
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveStep(step)}
                    className="h-8 px-3 text-red-300 hover:text-red-100"
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="flex flex-col gap-3 rounded-md border border-dashed border-white/20 bg-black/20 px-4 py-4 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-white/40">Add email</span>
            <Input
              type="number"
              min={0}
              value={delayValue}
              onChange={(event) => setDelayValue(Number(event.target.value))}
              className="h-9 w-28 flex-none bg-black/40 text-white"
            />
            <select
              value={delayUnit}
              onChange={(event) => setDelayUnit(event.target.value as (typeof DELAY_UNITS)[number]["value"]) }
              className="h-9 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FA4616]"
            >
              {DELAY_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-white/40">after the trigger</span>
          </div>
          <Button onClick={handleAddEmail} className="self-start md:self-auto">
            Write email
          </Button>
        </div>
      </section>
    </div>
  );
}
