"use client";

import { use } from "react";
import Link from "next/link";

// This page lists preset automation starters (Welcome, Upgrade, Trial, Dunning, Win-back)
// and routes into the existing Campaign Creator. On click, we prefill the editor content
// by placing HTML into sessionStorage under the key "draft_email_content" which the
// CampaignComposerProvider already reads on load. We also pass optional subject/preview
// via query params (prefillSubject, prefillPreview), which are handled in the provider.

function buildHtml(kind: string): string {
  // Provide simple, opinionated starter HTML for each automation type. These are
  // safe defaults that users will immediately customize in the editor. We include
  // variables like {{name}} and {{company_name}} which are later replaced at send-time.
  const baseIntro = `<p style="font-size:16px;line-height:1.6;margin:0 0 16px">Hi {{name}},</p>`;
  const signature = `<p style="font-size:14px;color:#9CA3AF;line-height:1.6;margin-top:24px">— The {{company_name}} Team</p>`;

  switch (kind) {
    case "welcome":
      return `
<div style="padding:24px">
  ${baseIntro}
  <h1 style="font-size:24px;margin:0 0 12px">Welcome to {{company_name}} 🎉</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 12px">We're excited to have you! Here are a few quick links to get started:</p>
  <ul style="margin:0 0 16px 20px;line-height:1.8">
    <li>Read the community guidelines</li>
    <li>Introduce yourself</li>
    <li>Try your first feature</li>
  </ul>
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px">If you need anything, just reply to this email.</p>
  ${signature}
</div>`;
    case "upgrade":
      return `
<div style="padding:24px">
  ${baseIntro}
  <h1 style="font-size:24px;margin:0 0 12px">You're upgraded! 🚀</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 12px">Thanks for upgrading — here’s what you’ve unlocked and how to access it:</p>
  <ul style="margin:0 0 16px 20px;line-height:1.8">
    <li>New feature A</li>
    <li>Premium resource B</li>
    <li>Priority support</li>
  </ul>
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px">Need help? Reply and we’ll set you up.</p>
  ${signature}
</div>`;
    case "trial":
      return `
<div style="padding:24px">
  ${baseIntro}
  <h1 style="font-size:24px;margin:0 0 12px">Your {{company_name}} trial starts now ⏳</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 12px">Try these in the first 10 minutes:</p>
  <ol style="margin:0 0 16px 20px;line-height:1.8">
    <li>Do quick win #1</li>
    <li>Do quick win #2</li>
    <li>Join the community</li>
  </ol>
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px">We’re here to help you succeed.</p>
  ${signature}
</div>`;
    case "dunning":
      return `
<div style="padding:24px">
  ${baseIntro}
  <h1 style="font-size:24px;margin:0 0 12px">Payment issue — action needed</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 12px">We couldn’t process your recent payment. Please update your billing details to avoid interruptions.</p>
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px"><a href="#" style="color:#FA4616;text-decoration:underline">Update payment</a></p>
  ${signature}
</div>`;
    case "winback":
      return `
<div style="padding:24px">
  ${baseIntro}
  <h1 style="font-size:24px;margin:0 0 12px">We’d love to have you back 💌</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 12px">A lot has improved at {{company_name}} since you left. Here’s what’s new:</p>
  <ul style="margin:0 0 16px 20px;line-height:1.8">
    <li>Improvement 1</li>
    <li>New resource 2</li>
    <li>Popular event 3</li>
  </ul>
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px">Have feedback? Just hit reply.</p>
  ${signature}
</div>`;
    default:
      return `
<div style="padding:24px">
  ${baseIntro}
  <h1 style="font-size:24px;margin:0 0 12px">New automation email</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px">Start writing your message here.</p>
  ${signature}
</div>`;
  }
}

function buildSubject(kind: string): string {
  // Provide sensible subject defaults per preset. Users can edit these in the editor.
  switch (kind) {
    case "welcome":
      return "Welcome to {{company_name}}";
    case "upgrade":
      return "You’ve unlocked more — thanks for upgrading";
    case "trial":
      return "Your trial just started — quick wins inside";
    case "dunning":
      return "Action needed: update your payment details";
    case "winback":
      return "We miss you — here’s what’s new";
    default:
      return "";
  }
}

export default function AutomationsPage({ params }: { params: Promise<{ experienceId: string }> }) {
  // Read the dynamic route param for company/experience context.
  const { experienceId } = use(params);

  // Helper to construct a link that also seeds the editor content via sessionStorage.
  function makeHref(kind: string) {
    // Only build the URL here; do not touch sessionStorage in render.
    const subject = encodeURIComponent(buildSubject(kind));
    const preview = encodeURIComponent("");
    return `/experiences/${experienceId}/campaigns/new?prefillSubject=${subject}&prefillPreview=${preview}`;
  }

  const items: { key: string; title: string; description: string }[] = [
    { key: "welcome", title: "Welcome", description: "Onboard new members with quick wins and key links." },
    { key: "upgrade", title: "Upgrade", description: "Congratulate and point to newly unlocked value." },
    { key: "trial", title: "Trial", description: "Guide trials to value in the first week." },
    { key: "dunning", title: "Dunning", description: "Recover failed payments with clear CTAs." },
    { key: "winback", title: "Win-back", description: "Re‑engage canceled members with updates." },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Automations</h1>
          <p className="text-sm text-muted-foreground">Start from a preset and customize in the email editor.</p>
        </div>
        <Link
          href={makeHref("custom")}
          onClick={() => {
            // Provide an empty-but-structured starter for custom sequences.
            try { sessionStorage.setItem("draft_email_content", buildHtml("custom")); } catch {}
          }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:opacity-90"
        >
          New custom email
        </Link>
      </div>

      {/* Standard Flow CTA */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Standard Onboarding Flow</div>
            <div className="text-sm text-white/60">Visualize: New member → Welcome → Delay → Opened? Yes → Exit, No → Nudge → Exit</div>
          </div>
          <Link
            href={`/experiences/${experienceId}/automations/flows/standard`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:opacity-90"
          >
            Open Flow
          </Link>
        </div>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <Link
            key={it.key}
            href={makeHref(it.key)}
            onClick={() => {
              // Seed the editor with the appropriate preset HTML before navigation.
              try { sessionStorage.setItem("draft_email_content", buildHtml(it.key)); } catch {}
            }}
            className="block rounded-lg border border-white/10 hover:border-white/20 transition p-4 bg-white/5 hover:bg-white/[0.06]"
          >
            <div className="flex flex-col gap-2">
              <div className="text-lg font-medium">{it.title}</div>
              <div className="text-sm text-muted-foreground">{it.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
