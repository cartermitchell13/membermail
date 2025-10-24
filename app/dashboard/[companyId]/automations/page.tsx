"use client";

import { use, useEffect, useMemo, useState, useCallback } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  Brain,
  CreditCard,
  LifeBuoy,
  Megaphone,
  Repeat2,
  Sparkles,
  Target,
} from "lucide-react";

import { cn } from "@/lib/ui/cn";
import { SUPPORTED_AUTOMATION_EVENTS, getEventLabel } from "@/lib/automations/events";
import type { AutomationTriggerEvent } from "@/lib/automations/events";

type EmailPrefillCopy = {
  intro: string;
  bullets: string[];
  outro: string;
  cta?: { text: string; href: string };
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
    status: string;
    send_mode: string;
    automation_status: string;
  } | null;
};

type AutomationSequenceRecord = {
  id: number;
  name: string;
  description: string | null;
  trigger_event: string;
  trigger_label: string | null;
  status: "draft" | "active" | "paused" | "archived";
  timezone: string | null;
  automation_steps: AutomationStepRecord[] | null;
};

const EMAIL_PREFILL_COPY: Record<string, EmailPrefillCopy> = {
  "activation-7d": {
    intro: "Here are a few quick wins you can knock out today:",
    bullets: [
      "[Quick win #1: link or checklist that helps them use the product right away]",
      "[Quick win #2: community thread, template, or resource to explore]",
      "[Support reminder: where to ask questions if they get stuck]",
    ],
    outro: "Hit reply and let us know what you set up first - we read every note.",
    cta: {
      text: "[CTA text - e.g., Open your dashboard]",
      href: "[CTA link - e.g., https://example.com/dashboard]",
    },
  },
  "dunning-recovery": {
    intro: "You can fix this in less than a minute:",
    bullets: [
      "[Primary update payment link or instructions]",
      "[Backup option or alternate payment method you support]",
      "[What stays unlocked once the payment is current]",
    ],
    outro: "If you already updated things, reply so we can double check on our end.",
    cta: {
      text: "[CTA text - e.g., Update payment]",
      href: "[CTA link - e.g., https://example.com/billing]",
    },
  },
  "churn-save": {
    intro: "Before we close everything out, a couple quick options:",
    bullets: [
      "[Link to a one-question exit survey or ask for honest feedback]",
      "[Share a new feature or improvement they may have missed]",
      "[Offer a comeback incentive, grace period, or way to keep access]",
    ],
    outro: "Thanks for giving us a shot. Reply with any feedback and we will take note.",
    cta: {
      text: "[CTA text - e.g., Share your feedback]",
      href: "[CTA link - e.g., https://example.com/feedback]",
    },
  },
  "weekly-digest": {
    intro: "Here is what stood out since you last checked in:",
    bullets: [
      "[Highlight #1 - a popular post, lesson, or drop]",
      "[Highlight #2 - a resource or download worth catching up on]",
      "[Highlight #3 - an upcoming live session or event to RSVP for]",
    ],
    outro: "Log in for the full recap and let us know what you want to see next.",
    cta: {
      text: "[CTA text - e.g., View the latest highlights]",
      href: "[CTA link - e.g., https://example.com/community]",
    },
  },
  milestones: {
    intro: "You are on a roll - here is how to keep the momentum:",
    bullets: [
      "[Spell out the milestone they just unlocked and why it matters]",
      "[Suggest the next upgrade, challenge, or module to tackle]",
      "[Share proof or testimonials that reinforce the next step]",
    ],
    outro: "Reply if you want help planning the next milestone - our team is here.",
    cta: {
      text: "[CTA text - e.g., Unlock the next step]",
      href: "[CTA link - e.g., https://example.com/next]",
    },
  },
  "trial-to-paid": {
    intro: "Try these before your trial wraps up:",
    bullets: [
      "[Action #1 - feature or workflow that shows fast value]",
      "[Action #2 - result or transformation they can reach in minutes]",
      "[Upgrade incentive - limited bonus or time-limited offer]",
    ],
    outro: "We are excited to see what you build - ask us anything if you need a hand.",
    cta: {
      text: "[CTA text - e.g., Upgrade your account]",
      href: "[CTA link - e.g., https://example.com/upgrade]",
    },
  },
  "launch-promo": {
    intro: "Here is what just launched:",
    bullets: [
      "[Big benefit or headline promise of the offer]",
      "[Key feature, bonus, or scarcity detail to highlight]",
      "[Proof point or story showing why members are excited]",
    ],
    outro: "This window will not stay open long - reply with questions and we will help.",
    cta: {
      text: "[CTA text - e.g., Claim your spot]",
      href: "[CTA link - e.g., https://example.com/offer]",
    },
  },
};

const DEFAULT_EMAIL_PREFILL: EmailPrefillCopy = {
  intro: "Here are a few talking points to customize for your audience:",
  bullets: [
    "[Insert key benefit or promise #1]",
    "[Insert key benefit or promise #2]",
    "[Share a proof point, testimonial, or support option]",
  ],
  outro: "Reply with any questions - we are here to help.",
  cta: {
    text: "[CTA text]",
    href: "[CTA link]",
  },
};

type AiPromptConfig = {
  audience: string;
  placeholders: string[];
  tone: string;
  reminders?: string[];
};

const AI_PROMPT_CONFIG: Record<string, AiPromptConfig> = {
  "activation-7d": {
    audience: "brand-new customers who just purchased and are logging in for the first time",
    placeholders: [
      "[Describe what members get access to right away]",
      "[Explain the first success action you want them to take]",
      "[Share a link to the best starter resource or template]",
      "[List the support channel or office hours they can use]",
      "[Define your brand voice or tone (e.g., upbeat, mentor-like)]",
      "[CTA destination URL or in-product location]",
    ],
    tone: "warm, celebratory, and action-oriented",
    reminders: ["Invite the reader to reply with their first win."],
  },
  "dunning-recovery": {
    audience: "existing members whose latest payment failed",
    placeholders: [
      "[Explain what caused the payment issue in plain language]",
      "[Include the primary link or instructions to update billing]",
      "[Offer an alternate payment path or support contact]",
      "[Mention what benefits remain available once payment is fixed]",
      "[Define the tone you want (e.g., calm and proactive)]",
      "[CTA destination URL for billing update]",
    ],
    tone: "clear, empathetic, and confidence-building",
    reminders: ["Reassure them you will keep access available once billing is current."],
  },
  "churn-save": {
    audience: "members who just canceled, refunded, or had access removed",
    placeholders: [
      "[Explain the main improvement or update worth highlighting]",
      "[Link to a short exit survey or feedback form]",
      "[Include a comeback incentive or bonus offer]",
      "[State how long any grace period lasts if applicable]",
      "[Define the tone, e.g., appreciative and open to feedback]",
      "[CTA destination URL for the survey or comeback offer]",
    ],
    tone: "appreciative, honest, and focused on help",
    reminders: ["Thank them sincerely and acknowledge their experience."],
  },
  "weekly-digest": {
    audience: "active members who have not seen the latest community updates this week",
    placeholders: [
      "[Summarize community highlight #1 with a link]",
      "[Summarize highlight #2 with a link]",
      "[Share an upcoming event or deadline worth attending]",
      "[Describe the voice, e.g., energetic curator]",
      "[CTA destination URL to view all updates]",
    ],
    tone: "curated, energetic, and concise",
    reminders: ["Encourage skim-friendly formatting that makes highlights easy to scan."],
  },
  milestones: {
    audience: "members who just hit a meaningful usage milestone",
    placeholders: [
      "[Describe the milestone they unlocked with a metric or badge]",
      "[Suggest the next feature, upgrade, or goal to chase]",
      "[Mention proof or testimonials supporting the next step]",
      "[Define the tone, e.g., proud coach]",
      "[CTA destination URL guiding them to the next step]",
    ],
    tone: "celebratory, aspirational, and directive",
    reminders: ["Offer help if they want support reaching the next milestone."],
  },
  "trial-to-paid": {
    audience: "trial users who have not converted to a paid plan yet",
    placeholders: [
      "[Describe the core product value or aha moment they should reach]",
      "[List a quick win they can achieve before the trial ends]",
      "[Offer the upgrade incentive or deadline detail]",
      "[Define the tone, e.g., encouraging and persuasive]",
      "[CTA destination URL for the upgrade checkout]",
    ],
    tone: "encouraging, confident, and urgency-aware",
    reminders: ["Make the upgrade deadline clear without sounding pushy."],
  },
  "launch-promo": {
    audience: "members or leads you are pitching a new launch offer to",
    placeholders: [
      "[Name the product, bundle, or launch offer]",
      "[Explain the biggest benefit or transformation]",
      "[Add a proof point or story about why it matters]",
      "[State the scarcity or deadline detail]",
      "[Define the tone, e.g., bold and exciting]",
      "[CTA destination URL to purchase or register]",
    ],
    tone: "excited, bold, and conversion-driven",
    reminders: ["Highlight urgency and exclusivity without sounding spammy."],
  },
};

const DEFAULT_AI_PROMPT: AiPromptConfig = {
  audience: "members who should receive this automation",
  placeholders: [
    "[Describe what you offer and why it matters]",
    "[List the main action you want them to take]",
    "[Add proof or credibility that supports the promise]",
    "[Define the voice or tone you want the email to use]",
    "[CTA destination URL]",
  ],
  tone: "clear and supportive",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPrefillHtml(sequence: SequenceBlueprint) {
  const title = escapeHtml(sequence.title);
  const tagline = escapeHtml(sequence.tagline);
  const copy = EMAIL_PREFILL_COPY[sequence.id] ?? DEFAULT_EMAIL_PREFILL;
  const intro = escapeHtml(copy.intro);
  const bullets = copy.bullets
    .map((bullet) => `<li style="margin:4px 0">${escapeHtml(bullet)}</li>`)
    .join("");
  const outro = escapeHtml(copy.outro);
  const ctaMarkup = copy.cta
    ? `<p style="font-size:15px;line-height:1.6;margin:16px 0"><a href="${escapeHtml(
        copy.cta.href,
      )}" style="color:#FA4616;text-decoration:underline">${escapeHtml(copy.cta.text)}</a></p>`
    : "";

  return `
<div style="padding:24px">
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px">Hi {{first_name | default: "there"}},</p>
  <h1 style="font-size:24px;line-height:1.3;margin:0 0 12px">${title}</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px">${tagline}</p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 12px">${intro}</p>
  <ul style="padding-left:20px;font-size:15px;line-height:1.6;margin:0 0 16px">
    ${bullets}
  </ul>
  ${ctaMarkup}
  <p style="font-size:15px;line-height:1.6;margin:0 0 16px">${outro}</p>
  <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:24px 0 0">- The {{company_name}} team</p>
</div>`.trim();
}

function buildAiPrompt(sequence: SequenceBlueprint) {
  const config = AI_PROMPT_CONFIG[sequence.id] ?? DEFAULT_AI_PROMPT;
  const highlightActions = sequence.schedule
    .map((step) => {
      const parts = step.split("->");
      return parts.length === 2 ? parts[1].trim() : step.trim();
    })
    .filter((item) => item.length > 0)
    .map((item) => `- ${item}`);

  const placeholderLines = config.placeholders.map((item) => `- ${item}`);
  const goalsLines = sequence.goals.map((goal) => `- ${goal}`);
  const reminderLines = config.reminders?.map((item) => `- ${item}`) ?? [];

  return [
    `You are drafting the "${sequence.title}" automation email.`,
    `Audience: ${config.audience}`,
    `Lifecycle focus: ${sequence.tagline}`,
    `Primary goals:`,
    ...goalsLines,
    highlightActions.length ? "Moments to reinforce (do not mention timing):" : "",
    ...highlightActions,
    `Before you send this prompt, replace each bracketed note with specifics about the business:`,
    ...placeholderLines,
    `Writing instructions:`,
    `- Keep the voice ${config.tone}.`,
    `- Write about 180 words with clear paragraphs (bullet list optional).`,
    `- Include one CTA sentence or button that references [CTA destination URL].`,
    `- Finish with a friendly sign-off such as "- The {{company_name}} team".`,
    ...reminderLines,
    `Return only the email body in HTML-ready paragraphs (no <html> or <body> tags).`,
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

type SequenceBlueprint = {
  id: string;
  title: string;
  tagline: string;
  icon: LucideIcon;
  trigger: string;
  goals: string[];
  schedule: string[];
  safeguards: string[];
  whopData: string[];
  metrics: string[];
  ctaSubject: string;
  ctaPreview?: string;
  prefillHtml?: string;
};

const SEQUENCE_BLUEPRINTS: SequenceBlueprint[] = [
  {
    id: "activation-7d",
    title: "New buyer 7-day activation",
    tagline: "Guide new members to their first habit inside the first week.",
    icon: Sparkles,
    trigger: "payment.succeeded / access granted",
    goals: [
      "Drive the first meaningful action",
      "Establish a day-7 usage habit",
      "Invite replies for qualitative signal",
    ],
    schedule: [
      "T+0 min -> Welcome + one simple win",
      "T+24 h -> Setup checklist with 3 quick tasks",
      "T+72 h -> Case study + template to copy",
      "T+7 d -> Nudge with progress recap + reply ask",
    ],
    safeguards: [
      "Pause if the member completes the activation metric",
      "Respect local quiet hours before 8am and after 8pm",
      "Exit automatically if plan is canceled or refunded",
    ],
    whopData: ["member:basic:read", "member:email:read", "plan:basic:read", "access_pass:basic:read"],
    metrics: ["Day-7 activation %", "Reply rate", "First action completion time"],
    ctaSubject: "Welcome to {{company_name}} - quick wins inside",
    ctaPreview: "Here is how to get value in your first week.",
  },
  {
    id: "dunning-recovery",
    title: "Dunning & failed renewals",
    tagline: "Recover failed payments with fast links and retries.",
    icon: CreditCard,
    trigger: "payment.failed + retry events",
    goals: [
      "Collect updated billing details",
      "Keep service access uninterrupted",
      "Flag high-risk accounts for follow-up",
    ],
    schedule: [
      "Immediately -> Payment failed alert with 1-click update link",
      "T+24 h -> Reminder + alternate payment options",
      "T+72 h -> Final notice + downgrade warning",
    ],
    safeguards: [
      "Cancel queued messages if payment later succeeds",
      "Throttle to one recovery sequence per billing period",
      "Escalate to manual review after final failure",
    ],
    whopData: ["payment:basic:read", "payment:manage"],
    metrics: ["Recovery rate", "Average time to recover", "Churn prevented value"],
    ctaSubject: "Action needed: update your {{company_name}} payment",
    ctaPreview: "One click to update billing and keep access active.",
  },
  {
    id: "churn-save",
    title: "Churn save & win-back",
    tagline: "Collect feedback and pitch a targeted return offer.",
    icon: LifeBuoy,
    trigger: "access pass removed / refund issued / cancellation",
    goals: [
      "Capture an exit survey response",
      "Extend goodwill with a 7-day grace access",
      "Present a tailored win-back offer at day 14",
    ],
    schedule: [
      "Immediate -> Exit survey + confirm offboarding",
      "T+3 d -> Share improvements + quick comeback link",
      "T+14 d -> Win-back incentive aligned to plan",
    ],
    safeguards: [
      "Stop sequence if access is restored",
      "Ensure offer respects previous discounts",
      "Record opt-outs to the global unsubscribe list",
    ],
    whopData: ["access_pass:basic:read", "plan:basic:read", "payment:basic:read"],
    metrics: ["Win-back rate", "Exit survey completion %", "Offer redemption revenue"],
    ctaSubject: "We'd love to keep you close - quick exit survey",
    ctaPreview: "Tell us how we can improve and unlock a personalized return offer.",
  },
  {
    id: "weekly-digest",
    title: "Content & activity digest",
    tagline: "Keep members in the loop with top posts and upcoming events.",
    icon: Repeat2,
    trigger: "Weekly cron + forum/post/event aggregation",
    goals: [
      "Surface the most relevant new content",
      "Drive members back to community touchpoints",
      "Highlight upcoming live events",
    ],
    schedule: [
      "Weekly -> Top three posts + new files + upcoming event CTA",
      "Optional follow-up -> Reminder for no-show segments",
    ],
    safeguards: [
      "Skip if a member engaged in the last 24 hours",
      "Respect per-member frequency caps",
      "Validate continued access before sending",
    ],
    whopData: ["member:basic:read", "plan:basic:read", "access_pass:basic:read", "discover:basic:read"],
    metrics: ["Click-through rate", "Community session count", "Event RSVP uplift"],
    ctaSubject: "Your {{company_name}} weekly digest is here",
    ctaPreview: "Highlights you missed plus what is coming up next.",
  },
  {
    id: "milestones",
    title: "Milestones & usage nudges",
    tagline: "Celebrate key milestones and prompt the next best action.",
    icon: Target,
    trigger: "Product milestone (course complete, N logins, referrals)",
    goals: [
      "Recognize meaningful progress instantly",
      "Suggest the next step or upsell add-on",
      "Encourage social sharing or referrals",
    ],
    schedule: [
      "Milestone -> Congrats email + next action CTA",
      "Optional -> Wait 3 days -> Upgrade prompt or referral ask",
    ],
    safeguards: [
      "Prevent duplicate sends for the same milestone",
      "Hold if member has an open support ticket",
      "Respect per-user max sends per week",
    ],
    whopData: ["member:basic:read", "experience:basic:read", "payment:basic:read"],
    metrics: ["Upgrade conversion", "Referral submissions", "Milestone completion velocity"],
    ctaSubject: "Huge milestone unlocked at {{company_name}}",
    ctaPreview: "Celebrate the win and line up the next best step.",
  },
  {
    id: "trial-to-paid",
    title: "Trial to paid conversion",
    tagline: "Convert trials that stall before the paywall.",
    icon: Brain,
    trigger: "Free role added or $0 plan with 48h inactivity",
    goals: [
      "Get trials to their first aha moment",
      "Address upgrade objections",
      "Drive paid conversion within 7 days",
    ],
    schedule: [
      "T+48 h inactivity -> Highlight easy wins + checklist",
      "T+5 d -> Limited-time upgrade incentive",
      "T+7 d -> Final reminder with social proof",
    ],
    safeguards: [
      "Stop if the trial upgrades or cancels",
      "Limit incentives per user to avoid stacking",
      "Enforce quiet hours for global audiences",
    ],
    whopData: ["plan:basic:read", "payment:basic:read", "member:basic:read"],
    metrics: ["Trial-to-paid conversion %", "Time to convert", "Upgrade offer usage"],
    ctaSubject: "Still exploring {{company_name}}? Here's what to try next",
    ctaPreview: "Start with three quick wins to make the most of your trial.",
  },
  {
    id: "launch-promo",
    title: "Launch & promo drips",
    tagline: "Coordinate timed announcements, reminders, and last chances.",
    icon: Megaphone,
    trigger: "Creator-initiated promo start",
    goals: [
      "Drive awareness of the new offer",
      "Maximize signups during the promo window",
      "Close with urgency at last call",
    ],
    schedule: [
      "Day 0 -> Launch announcement",
      "Mid-campaign -> Reminder with social proof",
      "Final 24 h -> Last chance + scarcity clock",
    ],
    safeguards: [
      "Exclude members who already purchased",
      "Respect campaign-level frequency caps",
      "Sync offer expiration with Whop product setup",
    ],
    whopData: ["payment:basic:read", "plan:basic:read", "invoice:basic:read"],
    metrics: ["Promo revenue", "Conversion rate per send", "Offer redemption count"],
    ctaSubject: "We just launched something new at {{company_name}}",
    ctaPreview: "Get the inside track before this launch window closes.",
  },
];

const BUILDER_STEPS = [
  {
    key: "trigger",
    title: "Trigger",
    description: "Choose the event source: Whop webhook, scheduled job, or manual enrollment.",
  },
  {
    key: "audience",
    title: "Audience",
    description: "Layer filters (plan, last payment status, last seen, tags) to qualify members.",
  },
  {
    key: "steps",
    title: "Steps",
    description: "Sequence emails, waits, and conditional branches that react to real engagement.",
  },
  {
    key: "safeguards",
    title: "Safeguards",
    description: "Set send windows, frequency caps, stop conditions, and global unsubscribe handling.",
  },
  {
    key: "review",
    title: "Review & start",
    description: "Preview per-member, send a test to yourself, and activate the sequence.",
  },
] as const;


function SequenceManager({ companyId }: { companyId: string }) {
  const [sequences, setSequences] = useState<AutomationSequenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEvent, setNewEvent] = useState<AutomationTriggerEvent>(SUPPORTED_AUTOMATION_EVENTS[0]?.code ?? "member.created");

  const fetchSequences = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/automations/sequences?companyId=${companyId}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSequences(Array.isArray(data.sequences) ? data.sequences : []);
      setError(null);
    } catch (err) {
      console.error("Failed to load sequences", err);
      setError("Unable to load sequences");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  const sortedSequences = useMemo(
    () =>
      sequences.map((sequence) => ({
        ...sequence,
        automation_steps: (sequence.automation_steps ?? []).slice().sort((a, b) => a.position - b.position),
      })),
    [sequences],
  );

  const handleCreateSequence = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/automations/sequences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, name: newName.trim(), triggerEvent: newEvent }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNewName("");
      setError(null);
      await fetchSequences();
    } catch (err) {
      console.error("Failed to create sequence", err);
      setError("Unable to create sequence");
    } finally {
      setCreating(false);
    }
  };

  const toggleSequenceStatus = async (sequence: AutomationSequenceRecord) => {
    const nextStatus: AutomationSequenceRecord["status"] = sequence.status === "active" ? "paused" : "active";
    const previousStatus = sequence.status;
    setSequences((prev) => prev.map((item) => (item.id === sequence.id ? { ...item, status: nextStatus } : item)));
    try {
      const res = await fetch(`/api/automations/sequences/${sequence.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      console.error("Failed to update sequence", err);
      setSequences((prev) => prev.map((item) => (item.id === sequence.id ? { ...item, status: previousStatus } : item)));
      setError("Unable to update sequence status");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Automation sequences</h2>
          <p className="text-sm text-white/60">Create multi-email flows that react to Whop events.</p>
        </div>
        <form onSubmit={handleCreateSequence} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Sequence name"
            className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FA4616] sm:w-48"
          />
          <select
            value={newEvent}
            onChange={(event) => setNewEvent(event.target.value as AutomationTriggerEvent)}
            className="rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FA4616]"
          >
            {SUPPORTED_AUTOMATION_EVENTS.map((event) => (
              <option key={event.code} value={event.code}>
                {event.label}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={creating} className="sm:w-auto">
            {creating ? "Creating..." : "Create sequence"}
          </Button>
        </form>
      </div>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>
      )}

      {loading ? (
        <div className="rounded border border-white/10 bg-black/40 p-6 text-white/60 text-sm">Loading sequences...</div>
      ) : sortedSequences.length === 0 ? (
        <div className="rounded border border-white/10 bg-black/40 p-6 text-white/60 text-sm">
          No automation sequences yet. Create your first sequence to start automating lifecycle messaging.
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedSequences.map((sequence) => (
            <div key={sequence.id} className="rounded-lg border border-white/10 bg-black/30 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{sequence.name}</h3>
                    <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"}>
                      {sequence.status}
                    </span>
                  </div>
                  <div className="text-xs text-white/60">
                    Trigger: {sequence.trigger_label ?? getEventLabel(sequence.trigger_event as AutomationTriggerEvent)}
                  </div>
                  <div className="text-xs text-white/50">Timezone: {sequence.timezone ?? "UTC"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/${companyId}/campaigns/new?automationSequenceId=${sequence.id}`}
                    className="inline-flex items-center rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                  >
                    Add automation email
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toggleSequenceStatus(sequence)}
                    className="border-white/20 text-white/70 hover:bg-white/10"
                  >
                    {sequence.status === "active" ? "Pause" : "Activate"}
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {(sequence.automation_steps ?? []).length === 0 ? (
                  <div className="rounded border border-white/10 bg-black/50 px-3 py-2 text-xs text-white/60">
                    No emails linked yet. Use "Add automation email" to build the flow.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(sequence.automation_steps ?? []).map((step) => (
                      <div key={step.id} className="rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-xs text-white/50">Step {step.position}</div>
                            <div className="font-medium text-white">
                              {step.campaign?.subject ?? "Untitled email"}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/60">
                            <span>Delay: {step.delay_value} {step.delay_unit}</span>
                            {step.campaign && (
                              <Link
                                href={`/dashboard/${companyId}/campaigns/${step.campaign_id}`}
                                className="inline-flex items-center rounded-md bg-white/5 px-2 py-1 text-xs text-white hover:bg-white/10"
                              >
                                Open email
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
const PIPELINE_CHECKLIST = [
  {
    title: "Event pipeline",
    bullets: [
      "Ingest `payment.succeeded`, `payment.failed`, and access events via Whop webhooks",
      "Write events to an idempotent jobs table queued by `event.id`",
      "Map events to segments, then sequences; enqueue follow-up jobs with run_at timestamps",
    ],
  },
  {
    title: "Data & permissions",
    bullets: [
      "Authenticate creators via Whop OAuth and issue SDK tokens for app access",
      "Request `member:basic:read`, `member:email:read`, `plan:basic:read`, and financial scopes as needed",
      "Check `checkIfUserHasAccessToCompany/Experience` before linking to gated content",
    ],
  },
  {
    title: "Rendering & delivery",
    bullets: [
      "Render emails with React/MJML templates and Liquid-style variables (`{{first_name}}`)",
      "Deduplicate sends on `(user_id, sequence_id, step)` and pause on hard bounces",
      "Respect local-time quiet hours and per-sequence frequency caps",
    ],
  },
] as const;

export default function AutomationsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const [selectedSequenceId, setSelectedSequenceId] = useState(SEQUENCE_BLUEPRINTS[0]?.id ?? "");

  const selectedSequence = useMemo(() => {
    return SEQUENCE_BLUEPRINTS.find((sequence) => sequence.id === selectedSequenceId) ?? SEQUENCE_BLUEPRINTS[0];
  }, [selectedSequenceId]);

  const SelectedIcon = selectedSequence.icon;

  const selectedSequencePrefillHtml = useMemo(() => buildPrefillHtml(selectedSequence), [selectedSequence]);
  const selectedSequenceAiPrompt = useMemo(() => buildAiPrompt(selectedSequence), [selectedSequence]);

  function automationHref(sequence: SequenceBlueprint) {
    const base = `/dashboard/${companyId}/campaigns/new`;
    const search = new URLSearchParams({
      fromAutomation: sequence.id,
      prefillSubject: sequence.ctaSubject,
    });
    const preview = sequence.ctaPreview ?? sequence.tagline;
    if (preview) {
      search.set("prefillPreview", preview);
    }
    return `${base}?${search.toString()}`;
  }

  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">Automations control center</h1>
          <p className="max-w-2xl text-sm text-white/70">
            Ship lifecycle sequences that mirror the Whop blueprint: ingest webhooks, segment members, schedule jobs,
            and deliver guardrailed messaging that compounds retention and revenue.
          </p>
        </div>
        <Link
          href={automationHref(selectedSequence)}
          onClick={() => {
            try {
              const payload = {
                sequenceId: selectedSequence.id,
                title: selectedSequence.title,
                schedule: selectedSequence.schedule,
                goals: selectedSequence.goals,
                prefillSubject: selectedSequence.ctaSubject,
                prefillPreview: selectedSequence.ctaPreview ?? selectedSequence.tagline,
                prefillHtml: selectedSequencePrefillHtml,
                aiPromptTemplate: selectedSequenceAiPrompt,
              };
              sessionStorage.setItem("automation_blueprint_prefill", JSON.stringify(payload));
              if (selectedSequencePrefillHtml) {
                sessionStorage.setItem("draft_email_content", selectedSequencePrefillHtml);
              }
            } catch {
              // no-op if storage is unavailable
            }
          }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Start with "{selectedSequence.title}"
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <SequenceManager companyId={companyId} />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Lifecycle blueprints</h2>
            <span className="text-xs uppercase tracking-wide text-white/40">Inspired by Whop playbooks</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {SEQUENCE_BLUEPRINTS.map((sequence) => {
              const isSelected = sequence.id === selectedSequence.id;
              const Icon = sequence.icon;
              return (
                <button
                  key={sequence.id}
                  type="button"
                  onClick={() => setSelectedSequenceId(sequence.id)}
                  className={cn(
                    "flex h-full flex-col gap-2 rounded-lg border bg-gradient-to-br p-4 text-left transition",
                    "from-white/5 via-black/40 to-black/60",
                    isSelected ? "border-white/40 shadow-lg shadow-black/20" : "border-white/10 hover:border-white/30",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-primary/20 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-white/50">Sequence</div>
                      <div className="text-sm font-medium text-white">{sequence.title}</div>
                    </div>
                  </div>
                  <p className="text-xs text-white/60">{sequence.tagline}</p>
                  <div className="text-[11px] font-medium text-white/40">Trigger → {sequence.trigger}</div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-lg border border-white/10 bg-black/40 p-4 shadow-inner shadow-black/20">
          <div className="flex items-start gap-3">
            <SelectedIcon className="mt-1 h-4 w-4 text-primary" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">{selectedSequence.title}</h3>
              <p className="text-xs text-white/60">{selectedSequence.tagline}</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wide text-white/60">
                Trigger: {selectedSequence.trigger}
              </div>
            </div>
          </div>

          <dl className="mt-4 grid gap-4 text-sm text-white/70">
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/40">Goals</dt>
              <dd className="mt-1 space-y-1 text-xs">
                {selectedSequence.goals.map((goal) => (
                  <div key={goal} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                    <span>{goal}</span>
                  </div>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/40">Guardrail schedule</dt>
              <dd className="mt-1 space-y-1 text-xs">
                {selectedSequence.schedule.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                    <span>{item}</span>
                  </div>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/40">Safeguards</dt>
              <dd className="mt-1 space-y-1 text-xs">
                {selectedSequence.safeguards.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                    <span>{item}</span>
                  </div>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/40">Primary metrics</dt>
              <dd className="mt-1 space-y-1 text-xs">
                {selectedSequence.metrics.map((metric) => (
                  <div key={metric} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                    <span>{metric}</span>
                  </div>
                ))}
              </dd>
            </div>
          </dl>

          <div className="mt-4 space-y-2">
            <div className="text-[11px] uppercase tracking-wide text-white/40">Whop data & scopes</div>
            <div className="flex flex-wrap gap-1">
              {selectedSequence.whopData.map((scope) => (
                <span
                  key={scope}
                  className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70"
                >
                  {scope}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-white/10 bg-black/40 p-4 shadow-inner shadow-black/30">
        <div className="flex items-center gap-2 text-white">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Sequence builder blueprint</h2>
        </div>
        <p className="mt-1 text-xs text-white/60">
          The builder follows a five-step flow so creators can deploy automations without touching underlying jobs or
          templates.
        </p>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          {BUILDER_STEPS.map((step, index) => (
            <li key={step.key} className="rounded-lg border border-white/10 bg-black/30 p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/40">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                  {index + 1}
                </span>
                {step.title}
              </div>
              <p className="mt-2 text-xs text-white/70">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-white/10 bg-black/50 p-4 shadow-inner shadow-black/30">
        <div className="flex items-center gap-2 text-white">
          <Repeat2 className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Delivery pipeline checklist</h2>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {PIPELINE_CHECKLIST.map((item) => (
            <div key={item.title} className="rounded-lg border border-white/10 bg-black/40 p-3">
              <h3 className="text-sm font-medium text-white">{item.title}</h3>
              <ul className="mt-2 space-y-2 text-xs text-white/70">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-white">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Operational safeguards</h2>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-white/70">
            <li>Deduplicate sends on `(user_id, sequence_id, step)` to stay idempotent.</li>
            <li>Respect global unsubscribe + one-click opt-out links even inside sequences.</li>
            <li>Track bounce/complaint events and pause messaging for impacted members.</li>
            <li>Snapshot template versions so edits do not retroactively change in-flight steps.</li>
          </ul>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-white">
            <Megaphone className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Helpful resources</h2>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-white/70">
            <li>
              <Link
                href="https://docs.whop.com/docs/api-reference/webhooks"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Whop webhook reference
              </Link>{" "}
              - event payloads for payments, access passes, and more.
            </li>
            <li>
              <Link
                href="https://docs.whop.com/sdk/iframe-setup"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                iFrame SDK setup guide
              </Link>{" "}
              - open checkouts or deep links directly from your automations.
            </li>
            <li>
              <Link
                href="https://docs.whop.com/api-reference/overview"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                API permission matrix
              </Link>{" "}
              - confirm scopes before requesting OAuth grants.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}











