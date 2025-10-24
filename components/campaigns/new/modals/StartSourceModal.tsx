"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCampaignComposer } from "../CampaignComposerProvider";

/**
 * StartSourceModal
 *
 * Presented when opening the composer with no explicit source.
 * Offers three options:
 * - Start Blank: close modal and begin with empty editor
 * - Automation Preset: link to dashboard automations page
 * - From a Draft: opens Drafts modal
 */
export default function StartSourceModal() {
  const {
    companyId,
    showStartSourceModal,
    setShowStartSourceModal,
    setShowDraftsModal,
    editor,
    setSubject,
    setPreviewText,
    applyPrefillHtml,
  } = useCampaignComposer();

  // Defensive: if editor isn't ready yet, keep modal mount but do nothing special
  useEffect(() => {
    // no-op for now
  }, [editor]);

  if (!showStartSourceModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex" onClick={() => setShowStartSourceModal(false)}>
      <div
        className="m-auto w-full max-w-3xl bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Start a new campaign</h3>
          <button className="text-white/60 hover:text-white" onClick={() => setShowStartSourceModal(false)}>Close</button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Start Blank */}
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-4 text-left"
            onClick={() => {
              // Ensure we start from a clean slate
              applyPrefillHtml("");
              setSubject("");
              setPreviewText("");
              setShowStartSourceModal(false);
            }}
          >
            <div className="text-white font-medium mb-1">Start Blank</div>
            <div className="text-white/60 text-sm">Begin with an empty editor</div>
          </button>

          {/* Automation Preset */}
          <Link
            href={`/dashboard/${companyId}/automations`}
            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-4 no-underline"
            onClick={() => {
              // Navigation handled by link; modal will unmount on route change
            }}
          >
            <div className="text-white font-medium mb-1">Start from Automation Preset</div>
            <div className="text-white/60 text-sm">Pick a preset, then customize in the editor</div>
          </Link>

          {/* From a Draft */}
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-4 text-left"
            onClick={() => {
              setShowStartSourceModal(false);
              setShowDraftsModal(true);
            }}
          >
            <div className="text-white font-medium mb-1">From a Draft</div>
            <div className="text-white/60 text-sm">Open a saved draft</div>
          </button>
        </div>
      </div>
    </div>
  );
}

