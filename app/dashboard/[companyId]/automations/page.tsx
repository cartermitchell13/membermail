"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SUPPORTED_AUTOMATION_EVENTS, getEventLabel, isCourseAutomationEvent } from "@/lib/automations/events";
import type { AutomationTriggerEvent } from "@/lib/automations/events";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

// Icons as simple SVG components for better visual communication
const PlayIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DraftIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const TriggerIcon = ({ event }: { event: string }) => {
  const isCourse = isCourseAutomationEvent(event as AutomationTriggerEvent);
  
  if (isCourse) {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  }
  
  if (event.includes("payment") || event.includes("refund")) {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    );
  }
  
  if (event.includes("member")) {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
};

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

export default function AutomationsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const router = useRouter();
  const [sequences, setSequences] = useState<AutomationSequenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState<AutomationTriggerEvent>(
    SUPPORTED_AUTOMATION_EVENTS[0]?.code ?? "member.created",
  );
  const [creating, setCreating] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  const fetchSequences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/automations/sequences?companyId=${companyId}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setSequences(Array.isArray(data.sequences) ? data.sequences : []);
      setError(null);
    } catch (err) {
      console.error("Failed to load sequences", err);
      setError("Unable to load automations right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  const handleCreateSequence = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const response = await fetch(`/api/automations/sequences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, name: newName.trim(), triggerEvent: newTrigger }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setNewName("");
      await fetchSequences();
    } catch (err) {
      console.error("Failed to create sequence", err);
      setError("Could not create the flow. Double-check the name and try again.");
    } finally {
      setCreating(false);
    }
  };

  // Group sequences by status for better organization
  const activeSequences = useMemo(() => sequences.filter((s) => s.status === "active"), [sequences]);
  const draftSequences = useMemo(() => sequences.filter((s) => s.status === "draft"), [sequences]);
  const pausedSequences = useMemo(() => sequences.filter((s) => s.status === "paused"), [sequences]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-[#0A0A0A]">
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        {/* Header with improved visual hierarchy */}
        <header className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">Automations</h1>
                <SparklesIcon />
              </div>
              <p className="max-w-2xl text-base text-white/70">
                Build powerful email sequences that trigger automatically from Whop events. Set it and forget it.
              </p>
            </div>
            
            {/* Quick Stats */}
            {sequences.length > 0 && (
              <div className="flex gap-3">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{activeSequences.length}</div>
                  <div className="text-xs text-emerald-300/70">Active</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-center">
                  <div className="text-2xl font-bold text-white">{sequences.length}</div>
                  <div className="text-xs text-white/50">Total Flows</div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
        </header>

        {/* Create New Flow Section - More prominent */}
        <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#FA4616]/10 via-black/40 to-black/40 p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-2">
            <PlusIcon />
            <h2 className="text-lg font-semibold text-white">Create New Flow</h2>
          </div>
          <form onSubmit={handleCreateSequence} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-white/50">Flow Name</label>
              <Input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="e.g., Welcome Series, Payment Recovery..."
                className="bg-black/40 text-white placeholder:text-white/30"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-white/50">Trigger Event</label>
              <Select
                value={newTrigger}
                onChange={(value) => setNewTrigger(value as AutomationTriggerEvent)}
                options={SUPPORTED_AUTOMATION_EVENTS.map((definition) => ({
                  value: definition.code,
                  label: definition.label,
                }))}
              />
            </div>
            <Button type="submit" disabled={creating} className="sm:mb-0.5 sm:px-8">
              {creating ? "Creating…" : "Create Flow"}
            </Button>
          </form>
        </section>

        {/* Flows List */}
        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-white/10 bg-black/40 p-12">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
              <p className="text-sm text-white/60">Loading your flows...</p>
            </div>
          </div>
        ) : sequences.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {/* Active Flows */}
            {activeSequences.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                    <PlayIcon />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Active Flows</h2>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                    {activeSequences.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {activeSequences.map((sequence) => (
                    <SequenceCard
                      key={sequence.id}
                      sequence={sequence}
                      companyId={companyId}
                      onRefresh={fetchSequences}
                      router={router}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Draft Flows */}
            {draftSequences.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                    <DraftIcon />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Drafts</h2>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/60">
                    {draftSequences.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {draftSequences.map((sequence) => (
                    <SequenceCard
                      key={sequence.id}
                      sequence={sequence}
                      companyId={companyId}
                      onRefresh={fetchSequences}
                      router={router}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Paused Flows */}
            {pausedSequences.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20">
                    <PauseIcon />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Paused Flows</h2>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                    {pausedSequences.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {pausedSequences.map((sequence) => (
                    <SequenceCard
                      key={sequence.id}
                      sequence={sequence}
                      companyId={companyId}
                      onRefresh={fetchSequences}
                      router={router}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Learn More Section - Collapsible */}
        <details
          className="group rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm"
          open={showLearnMore}
          onToggle={(event) => setShowLearnMore(event.currentTarget.open)}
        >
          <summary className="cursor-pointer p-4 text-base font-semibold text-white transition-colors hover:text-white/80">
            <span className="inline-flex items-center gap-2">
              Learn more about automations
              <svg className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </summary>
          <div className="space-y-4 border-t border-white/10 p-4 text-sm text-white/70">
            <div>
              <h3 className="mb-2 font-semibold text-white">How it works</h3>
              <p className="text-white/60">
                Automations connect directly to Whop events like payments succeeding, access being revoked, or a member
                joining. Every flow is a series of steps: wait for a delay, send the next email, and repeat until the
                sequence completes.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-white">Common use cases</h3>
              <ul className="space-y-1 text-white/60">
                <li className="flex items-start gap-2">
                  <span className="text-[#FA4616]">•</span>
                  <span><strong className="text-white/80">Activation flow:</strong> Welcome → setup checklist → case study</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FA4616]">•</span>
                  <span><strong className="text-white/80">Dunning flow:</strong> Failed payment → quick fix → final reminder</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FA4616]">•</span>
                  <span><strong className="text-white/80">Course engagement:</strong> Lesson reminders → progress check-ins → completion rewards</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-white">Resources</h3>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="https://docs.whop.com/docs/api-reference/webhooks"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white transition-colors hover:border-[#FA4616] hover:bg-[#FA4616]/10"
                >
                  Whop Webhooks Docs
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

// Empty State Component with helpful guidance
function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-white/20 bg-gradient-to-br from-black/40 to-black/20 p-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FA4616]/20 to-[#FA4616]/5">
          <SparklesIcon />
        </div>
        <h3 className="mb-3 text-xl font-semibold text-white">No automation flows yet</h3>
        <p className="mb-6 text-white/60">
          Create your first automation to start sending perfectly-timed emails based on member behavior. Set it up once,
          and it runs forever.
        </p>
        
        <div className="grid gap-4 text-left sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-2 text-2xl">👋</div>
            <h4 className="mb-1 text-sm font-semibold text-white">Welcome Series</h4>
            <p className="text-xs text-white/50">Onboard new members with a sequence of helpful emails</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-2 text-2xl">💳</div>
            <h4 className="mb-1 text-sm font-semibold text-white">Payment Recovery</h4>
            <p className="text-xs text-white/50">Automatically follow up on failed payments</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-2 text-2xl">📚</div>
            <h4 className="mb-1 text-sm font-semibold text-white">Course Engagement</h4>
            <p className="text-xs text-white/50">Keep learners engaged with progress-based emails</p>
          </div>
        </div>
        
        <p className="mt-6 text-sm text-white/40">
          Use the "Create New Flow" section above to get started
        </p>
      </div>
    </div>
  );
}

type SequenceCardProps = {
  sequence: AutomationSequenceRecord;
  companyId: string;
  onRefresh: () => Promise<void>;
  router: ReturnType<typeof useRouter>;
};

function SequenceCard({ sequence, companyId, onRefresh, router }: SequenceCardProps) {
  const [delayValue, setDelayValue] = useState(0);
  const [delayUnit, setDelayUnit] = useState<(typeof DELAY_UNITS)[number]["value"]>("days");
  const [timezone, setTimezone] = useState(sequence.timezone ?? "UTC");
  const [quietEnabled, setQuietEnabled] = useState(Boolean(sequence.quiet_hours_enabled));
  const [quietStart, setQuietStart] = useState(sequence.quiet_hours_start ?? DEFAULT_QUIET_START);
  const [quietEnd, setQuietEnd] = useState(sequence.quiet_hours_end ?? DEFAULT_QUIET_END);
  const [savingSettings, setSavingSettings] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const steps = useMemo(
    () => (sequence.automation_steps ?? []).slice().sort((a, b) => a.position - b.position),
    [sequence.automation_steps],
  );

  useEffect(() => {
    setTimezone(sequence.timezone ?? "UTC");
    setQuietEnabled(Boolean(sequence.quiet_hours_enabled));
    setQuietStart(sequence.quiet_hours_start ?? DEFAULT_QUIET_START);
    setQuietEnd(sequence.quiet_hours_end ?? DEFAULT_QUIET_END);
  }, [sequence]);

  const updateSequence = useCallback(
    async (payload: Record<string, unknown>) => {
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
        await onRefresh();
      } catch (err) {
        console.error("Failed to update sequence", err);
      } finally {
        setSavingSettings(false);
      }
    },
    [onRefresh, sequence.id],
  );

  const handleStatusToggle = async () => {
    setUpdatingStatus(true);
    try {
      const nextStatus = sequence.status === "active" ? "paused" : "active";
      if (sequence.status === "draft") {
        // Drafts must be explicitly activated.
        await updateSequence({ status: "active" });
      } else {
        await updateSequence({ status: nextStatus });
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddEmail = () => {
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
    const delta = direction === "up" ? -1 : 1;
    const newPosition = step.position + delta;
    if (newPosition < 1) return;
    if (newPosition > steps.length) return;
    await fetch(`/api/automations/sequences/${sequence.id}/steps/${step.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position: newPosition }),
    });
    await onRefresh();
  };

  const handleRemoveStep = async (step: AutomationStepRecord) => {
    const confirmed = window.confirm("Remove this step and delete the attached email?");
    if (!confirmed) return;
    await fetch(`/api/automations/sequences/${sequence.id}/steps/${step.id}`, {
      method: "DELETE",
    });
    await onRefresh();
  };

  const handleQuietToggle = async (enabled: boolean) => {
    setQuietEnabled(enabled);
    await updateSequence({
      quiet_hours_enabled: enabled,
      quiet_hours_start: quietStart,
      quiet_hours_end: quietEnd,
    });
  };

  const handleQuietBlur = async (field: "quiet_hours_start" | "quiet_hours_end", value: number) => {
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
    const next = timezone.trim() || "UTC";
    setTimezone(next);
    await updateSequence({ timezone: next });
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/automations/sequences/${sequence.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setShowDeleteConfirm(false);
      await onRefresh();
    } catch (err) {
      console.error("Failed to delete flow", err);
      alert("Failed to delete flow. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const triggerLabel = sequence.trigger_label ?? getEventLabel(sequence.trigger_event as AutomationTriggerEvent);
  const statusLabel = sequence.status === "draft" ? "Activate" : sequence.status === "active" ? "Pause" : "Resume";
  
  // Status badge styling
  const statusConfigs = {
    active: {
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/40",
      text: "text-emerald-300",
      icon: <PlayIcon />,
      label: "Active",
    },
    paused: {
      bg: "bg-amber-500/20",
      border: "border-amber-500/40",
      text: "text-amber-300",
      icon: <PauseIcon />,
      label: "Paused",
    },
    draft: {
      bg: "bg-white/10",
      border: "border-white/20",
      text: "text-white/60",
      icon: <DraftIcon />,
      label: "Draft",
    },
    archived: {
      bg: "bg-white/5",
      border: "border-white/10",
      text: "text-white/40",
      icon: <DraftIcon />,
      label: "Archived",
    },
  } as const;
  
  const statusConfig = statusConfigs[sequence.status as keyof typeof statusConfigs] ?? statusConfigs.draft;

  return (
    <article className="group rounded-xl border border-white/10 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm transition-all hover:border-white/20 hover:shadow-xl">
      {/* Card Header */}
      <div className="border-b border-white/10 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-3">
            {/* Title and Status Row */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/dashboard/${companyId}/automations/flows/${sequence.id}`}
                className="text-xl font-semibold text-white transition-colors hover:text-[#FA4616]"
              >
                {sequence.name}
              </Link>
              <div className={`flex items-center gap-1.5 rounded-full ${statusConfig.bg} ${statusConfig.border} border px-3 py-1`}>
                {statusConfig.icon}
                <span className={`text-xs font-medium ${statusConfig.text}`}>{statusConfig.label}</span>
              </div>
            </div>
            
            {/* Trigger Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                <TriggerIcon event={sequence.trigger_event} />
                <span className="text-sm text-white/80">{triggerLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <ClockIcon />
                <span>{steps.length} {steps.length === 1 ? "step" : "steps"}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
              className="text-white/70 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Button>
            <Button 
              variant={sequence.status === "active" ? "secondary" : "default"}
              size="sm" 
              onClick={handleStatusToggle} 
              disabled={updatingStatus}
            >
              {updatingStatus ? "Updating…" : statusLabel}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDelete} 
              disabled={deleting}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
              title="Delete flow"
            >
              {deleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/20 border-t-red-400"></div>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </Button>
          </div>
        </div>

        {/* Settings Panel (Collapsible) */}
        {showSettings && (
          <div className="mt-4 space-y-4 rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-white/50">Timezone</label>
                <input
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  onBlur={handleTimezoneBlur}
                  className="h-9 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-[#FA4616] focus:outline-none focus:ring-1 focus:ring-[#FA4616]"
                  placeholder="UTC"
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/50">
                  <input
                    type="checkbox"
                    checked={quietEnabled}
                    onChange={(event) => handleQuietToggle(event.target.checked)}
                    className="h-4 w-4 rounded border border-white/40 bg-black/40"
                  />
                  Quiet Hours
                </label>
                {quietEnabled && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={quietStart}
                      onChange={(event) => setQuietStart(Number(event.target.value))}
                      onBlur={(event) => handleQuietBlur("quiet_hours_start", Number(event.target.value))}
                      className="h-9 w-20 bg-black/40 text-sm text-white"
                      placeholder="Start"
                    />
                    <span className="text-white/40">to</span>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={quietEnd}
                      onChange={(event) => setQuietEnd(Number(event.target.value))}
                      onBlur={(event) => handleQuietBlur("quiet_hours_end", Number(event.target.value))}
                      className="h-9 w-20 bg-black/40 text-sm text-white"
                      placeholder="End"
                    />
                  </div>
                )}
              </div>
            </div>
            {savingSettings && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <div className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white"></div>
                Saving settings...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Flow Visualization */}
      <div className="p-5">
        {steps.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/20 bg-black/20 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
              <EmailIcon />
            </div>
            <p className="text-sm text-white/50">No steps yet. Add your first email below to start the sequence.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Trigger Start Node */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FA4616]/30 to-[#FA4616]/10 ring-2 ring-[#FA4616]/20">
                <TriggerIcon event={sequence.trigger_event} />
              </div>
              <div className="flex-1 rounded-lg border border-[#FA4616]/30 bg-[#FA4616]/10 px-4 py-2">
                <div className="text-xs font-medium uppercase tracking-wide text-[#FA4616]/80">Trigger</div>
                <div className="text-sm text-white/90">{triggerLabel}</div>
              </div>
            </div>

            {/* Steps with Visual Flow */}
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Connection Line */}
                <div className="absolute left-5 top-0 h-full w-0.5 bg-gradient-to-b from-white/20 to-white/5" style={{ height: "calc(100% + 12px)", top: "-12px" }}></div>
                
                <div className="relative flex items-start gap-3">
                  {/* Step Number Badge */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/10 ring-2 ring-white/10">
                    <span className="text-sm font-bold text-white">{index + 1}</span>
                  </div>
                  
                  {/* Step Card */}
                  <div className="flex-1 rounded-lg border border-white/10 bg-black/40 transition-all hover:border-white/20 hover:bg-black/50">
                    <div className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-white/40">
                            <ClockIcon />
                            <span>Wait {step.delay_value} {step.delay_unit}</span>
                          </div>
                          <div className="font-medium text-white">{step.campaign?.subject ?? "Untitled email"}</div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/dashboard/${companyId}/campaigns/${step.campaign_id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white transition-colors hover:border-[#FA4616] hover:bg-[#FA4616]/10"
                          >
                            <EmailIcon />
                            Edit
                          </Link>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleMoveStep(step, "up")}
                            disabled={index === 0}
                            className="h-7 px-2 text-white/50"
                            title="Move up"
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleMoveStep(step, "down")}
                            disabled={index === steps.length - 1}
                            className="h-7 px-2 text-white/50"
                            title="Move down"
                          >
                            ↓
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleRemoveStep(step)}
                            className="h-7 px-2 text-red-400 hover:text-red-300"
                            title="Remove"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Step Section */}
        <div className="mt-4 rounded-lg border border-dashed border-white/20 bg-gradient-to-br from-white/5 to-transparent p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-white/40">+ Add Email</span>
              <span className="text-xs text-white/30">Wait</span>
              <Input
                type="number"
                min={0}
                value={delayValue}
                onChange={(event) => setDelayValue(Number(event.target.value))}
                className="h-9 w-20 bg-black/40 text-center text-white"
              />
              <Select
                value={delayUnit}
                onChange={(value) => setDelayUnit(value as (typeof DELAY_UNITS)[number]["value"])}
                options={DELAY_UNITS.map((unit) => ({
                  value: unit.value,
                  label: unit.label,
                }))}
              />
              <span className="text-xs text-white/30">then send email</span>
            </div>
            <Button onClick={handleAddEmail} size="sm" className="sm:px-6">
              <PlusIcon />
              Create Email
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Automation Flow"
        message={`Are you sure you want to delete "${sequence.name}"?\n\nThis will permanently delete the flow and all ${steps.length} email step${steps.length === 1 ? "" : "s"}. This action cannot be undone.`}
        confirmText="Delete Flow"
        cancelText="Cancel"
        confirmVariant="destructive"
        isLoading={deleting}
      />
    </article>
  );
}
