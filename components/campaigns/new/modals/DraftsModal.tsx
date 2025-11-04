"use client";

import { useEffect, useMemo, useState } from "react";
import { useCampaignComposer } from "../CampaignComposerProvider";

type CampaignRow = {
  id: number;
  subject: string;
  status: string | null;
  html_content: string | null;
  updated_at: string | null;
};

function formatTimeAgo(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function DraftsModal() {
  const {
    companyId,
    showDraftsModal,
    setShowDraftsModal,
  } = useCampaignComposer();

  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<CampaignRow[]>([]);

  // Load drafts when opened
  useEffect(() => {
    if (!showDraftsModal) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/campaigns?companyId=${companyId}&status=draft`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const list: CampaignRow[] = Array.isArray(data.campaigns) ? data.campaigns : [];
          setDrafts(list);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [showDraftsModal, companyId]);

  const mostRecent = useMemo(() => drafts[0] || null, [drafts]);

  if (!showDraftsModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex" onClick={() => setShowDraftsModal(false)}>
      <div
        className="m-auto w-full max-w-5xl max-h-[85vh] bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Drafts</h3>
          <button className="text-white/60 hover:text-white" onClick={() => setShowDraftsModal(false)}>Close</button>
        </div>
        <div className="p-5 overflow-auto space-y-5">
          {/* Resume last tile */}
          {mostRecent && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-white/60">Resume last updated</div>
                <div className="text-white font-medium">{mostRecent.subject || "Untitled"}</div>
                <div className="text-xs text-white/50">Updated {formatTimeAgo(mostRecent.updated_at)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 rounded bg-[#FA4616] text-white hover:bg-[#E23F14] text-sm"
                  onClick={async () => {
                    window.location.assign(`/dashboard/${companyId}/campaigns/new?campaignId=${mostRecent.id}`);
                  }}
                >
                  Open
                </button>
                <button
                  className="px-3 py-1.5 rounded border border-white/20 text-white hover:bg-white/10 text-sm"
                  onClick={async () => {
                    if (!confirm("Delete this draft?")) return;
                    await fetch(`/api/campaigns/${mostRecent.id}`, { method: 'DELETE' });
                    setDrafts((prev) => prev.filter((d) => d.id !== mostRecent.id));
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* List */}
          <div>
            {loading ? (
              <div className="text-white/60">Loading drafts...</div>
            ) : drafts.length === 0 ? (
              <div className="text-white/60">No drafts yet.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {drafts.map((d) => (
                  <div key={d.id} className="border border-white/10 rounded-lg overflow-hidden bg-white/5 flex flex-col">
                    <div className="p-3 space-y-1.5 flex-1 min-h-0">
                      <div className="text-sm text-white/60">Updated {d.updated_at ? formatTimeAgo(d.updated_at) : "-"}</div>
                      <div className="font-medium truncate text-white">{d.subject || "Untitled"}</div>
                      <div className="text-xs text-white/50 line-clamp-2" dangerouslySetInnerHTML={{ __html: d.html_content || "" }} />
                    </div>
                    <div className="p-3 flex gap-2 border-t border-white/10">
                      <button
                        className="px-3 py-1.5 rounded bg-[#FA4616] text-white hover:bg-[#E23F14] text-sm"
                        onClick={async () => {
                          window.location.assign(`/dashboard/${companyId}/campaigns/new?campaignId=${d.id}`);
                        }}
                      >
                        Open
                      </button>
                      <button
                        className="px-3 py-1.5 rounded border border-white/20 text-white hover:bg-white/10 text-sm"
                        onClick={async () => {
                          if (!confirm("Delete this draft?")) return;
                          await fetch(`/api/campaigns/${d.id}`, { method: 'DELETE' });
                          setDrafts((prev) => prev.filter((x) => x.id !== d.id));
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
