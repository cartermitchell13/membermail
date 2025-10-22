"use client";

import { use } from "react";
import Link from "next/link";
import { Mail, Clock, GitBranch, PlayCircle, Home } from "lucide-react";

/**
 * Flow Canvas (MVP)
 *
 * This page renders a simple, non-draggable visualization of a flow so non-technical users
 * can see an intuitive left-to-right sequence. Email nodes are clickable and route into our
 * existing Campaign Creator with prefilled subject/content using URL params and sessionStorage.
 *
 * We intentionally keep the layout simple (cards with connectors) to test the UX quickly.
 * Upgrading to a draggable canvas (e.g., React Flow) can happen later without changing
 * the mental model exposed here.
 */

// A lightweight definition of a single built-in flow. In the future, this can be fetched
// from an API or Supabase (e.g., automations.graph_json). For now, we render static content.
const STANDARD_FLOW = {
  id: "standard",
  name: "Standard Onboarding Flow",
  description: "Welcome new members, wait, branch on engagement, and send a follow-up.",
  nodes: [
    { id: "trigger1", type: "trigger", title: "Trigger", subtitle: "New member joined (Whop)", icon: PlayCircle },
    { id: "email1", type: "email", title: "Email", subtitle: "Welcome email", icon: Mail },
    { id: "delay1", type: "delay", title: "Delay", subtitle: "Wait 2 days", icon: Clock },
    { id: "cond1", type: "condition", title: "Condition", subtitle: "Opened Welcome?", icon: GitBranch },
    { id: "exit1", type: "exit", title: "Exit", subtitle: "If opened", icon: PlayCircle },
    { id: "email2", type: "email", title: "Email", subtitle: "Nudge to upgrade", icon: Mail },
    { id: "exit2", type: "exit", title: "Exit", subtitle: "If not opened", icon: PlayCircle },
  ] as const,
  // Edges are represented implicitly in our simple layout; in a graph model they'd be explicit.
};

/**
 * Build preset email HTML for the clicked node. The content uses the same personalization
 * tokens already supported by lib/email/variables.ts (e.g., {{name}}, {{company_name}}).
 */
function buildEmailHtml(kind: "welcome" | "nudge") {
  const intro = `<p style="font-size:16px;line-height:1.6;margin:0 0 16px">Hi {{name}},</p>`;
  const sig = `<p style="font-size:14px;color:#9CA3AF;line-height:1.6;margin-top:24px">— The {{company_name}} Team</p>`;
  if (kind === "welcome") {
    return `
<div style="padding:24px">
  ${intro}
  <h1 style="font-size:24px;margin:0 0 12px">Welcome to {{company_name}} 🎉</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 12px">Here are quick-start steps to get value fast:</p>
  <ul style="margin:0 0 16px 20px;line-height:1.8">
    <li>Join the community</li>
    <li>Try your first feature</li>
    <li>Ask a question in support</li>
  </ul>
  ${sig}
</div>`;
  }
  return `
<div style="padding:24px">
  ${intro}
  <h1 style="font-size:24px;margin:0 0 12px">Still there? A quick tip 👋</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 12px">Here's one thing our most successful members do in their first week:</p>
  <ul style="margin:0 0 16px 20px;line-height:1.8">
    <li>Enable a premium feature</li>
    <li>Follow a short checklist</li>
  </ul>
  ${sig}
</div>`;
}

/**
 * Build subject lines for the preset emails.
 */
function buildSubject(kind: "welcome" | "nudge") {
  return kind === "welcome"
    ? "Welcome to {{company_name}}"
    : "Quick tip to get more out of {{company_name}}";
}

export default function FlowCanvasPage({ params }: { params: Promise<{ experienceId: string; flowId: string }> }) {
  // Extract dynamic route params for company context and flow selection.
  const { experienceId, flowId } = use(params);
  const flow = STANDARD_FLOW; // Only one flow for MVP (id: "standard")

  // Helper to navigate to the existing email editor with seeded content.
  function emailHref(kind: "welcome" | "nudge") {
    const subject = encodeURIComponent(buildSubject(kind));
    const preview = encodeURIComponent("");
    return `/experiences/${experienceId}/campaigns/new?prefillSubject=${subject}&prefillPreview=${preview}`;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header: Breadcrumbs + Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-white/70">
          <Link href={`/experiences/${experienceId}/automations`} className="inline-flex items-center gap-1 hover:text-white">
            <Home className="w-4 h-4" /> Automations
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-white">{flow.name}</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/50">Powered by Whop webhooks</div>
        </div>
      </div>

      {/* Canvas intro */}
      <div className="rounded-lg border border-white/10 bg-black/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{flow.name}</div>
            <div className="text-sm text-white/60">{flow.description}</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="rounded bg-white/5 px-2 py-1 border border-white/10">New member joined</span>
            <span className="rounded bg-white/5 px-2 py-1 border border-white/10">Opened email</span>
          </div>
        </div>
      </div>

      {/* Simple left-to-right rails: we layout nodes in rows with connecting lines */}
      <div className="overflow-x-auto">
        <div className="min-w-[1000px] grid grid-cols-[220px_80px_220px_80px_220px_80px_220px] gap-x-4 items-start">
          {/* Row 1: Trigger → Email → Delay → Condition */}
          <div className="">
            <FlowNodeTrigger title="Trigger" subtitle="New member joined" />
          </div>
          <FlowEdge />
          <div>
            <FlowNodeEmail
              title="Welcome"
              subtitle="Email"
              href={emailHref("welcome")}
              onClick={() => {
                try { sessionStorage.setItem("draft_email_content", buildEmailHtml("welcome")); } catch {}
              }}
            />
          </div>
          <FlowEdge />
          <div>
            <FlowNodeDelay title="Delay" subtitle="2 days" />
          </div>
          <FlowEdge />
          <div>
            <FlowNodeCondition title="Opened Welcome?" />
          </div>

          {/* Row 2: Branch Yes (top) to Exit, No (bottom) to Nudge → Exit. We fake rows using CSS margins */}
          {/* YES branch (top) */}
          <div className="col-start-5 col-span-1 mt-4">
            <FlowEdge label="Yes" subtle />
          </div>
          <div className="col-start-7 col-span-1 mt-0">
            <FlowNodeExit title="Exit" subtitle="If opened" />
          </div>

          {/* NO branch (bottom) */}
          <div className="col-start-5 col-span-1 mt-28">
            <FlowEdge label="No" subtle />
          </div>
          <div className="col-start-7 col-span-1 mt-24">
            <FlowNodeEmail
              title="Nudge to upgrade"
              subtitle="Email"
              href={emailHref("nudge")}
              onClick={() => {
                try { sessionStorage.setItem("draft_email_content", buildEmailHtml("nudge")); } catch {}
              }}
            />
          </div>
          <div className="col-start-7 col-span-1 mt-24">
            <FlowNodeExit title="Exit" subtitle="If not opened" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Below are tiny presentational components for each node type and a connecting edge.
 * These are purely visual for MVP; later we can attach menus, metrics, and editing drawers.
 */
function FlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-black/40 p-3 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function NodeHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon: any }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-[#FA4616]" />
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
      </div>
    </div>
  );
}

function FlowNodeTrigger({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <FlowCard>
      <NodeHeader title={title} subtitle={subtitle} icon={PlayCircle} />
      <div className="mt-2 text-xs text-white/60">Webhook: member.created</div>
    </FlowCard>
  );
}

function FlowNodeEmail({ title, subtitle, href, onClick }: { title: string; subtitle?: string; href: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="block group">
      <FlowCard className="transition-colors group-hover:border-white/20">
        <NodeHeader title={title} subtitle={subtitle} icon={Mail} />
        <div className="mt-2 text-xs text-white/60">Click to edit in Email Builder</div>
      </FlowCard>
    </Link>
  );
}

function FlowNodeDelay({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <FlowCard>
      <NodeHeader title={title} subtitle={subtitle} icon={Clock} />
      <div className="mt-2 text-xs text-white/60">Execution waits before next step</div>
    </FlowCard>
  );
}

function FlowNodeCondition({ title }: { title: string }) {
  return (
    <FlowCard>
      <NodeHeader title={title} icon={GitBranch} />
      <div className="mt-2 text-xs text-white/60">Branch Yes / No based on engagement</div>
    </FlowCard>
  );
}

function FlowNodeExit({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <FlowCard>
      <NodeHeader title={title} subtitle={subtitle} icon={PlayCircle} />
      <div className="mt-2 text-xs text-white/60">Flow ends here</div>
    </FlowCard>
  );
}

function FlowEdge({ label, subtle = false }: { label?: string; subtle?: boolean }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className={`h-[2px] w-full ${subtle ? "bg-white/20" : "bg-gradient-to-r from-[#FA4616]/60 to-white/20"}`}>
        {label && (
          <div className="-mt-3 text-xs text-white/60 text-center">{label}</div>
        )}
      </div>
    </div>
  );
}
