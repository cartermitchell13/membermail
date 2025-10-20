"use client";

import { useCampaignComposer } from "../CampaignComposerProvider";

export default function YoutubeDialog() {
    const { showYoutubeInput, setShowYoutubeInput, youtubeUrl, setYoutubeUrl, ytRef, confirmYoutube } = useCampaignComposer();
    if (!showYoutubeInput) return null;
    return (
        <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
            <div className="mt-10 w-[520px] pointer-events-auto bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="text-sm font-medium">Insert YouTube Video</div>
                    <button onClick={() => setShowYoutubeInput(false)} className="text-white/60 hover:text-white">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <input
                        ref={ytRef}
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="Paste or type a YouTube URL"
                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") confirmYoutube();
                            if (e.key === "Escape") setShowYoutubeInput(false);
                        }}
                    />
                    <div className="flex justify-end gap-2">
                        <button className="px-3 py-1.5 text-sm rounded border border-white/20" onClick={() => setShowYoutubeInput(false)}>Cancel</button>
                        <button className="px-3 py-1.5 text-sm rounded bg-[#FA4616] hover:bg-[#E23F14]" onClick={confirmYoutube}>Insert</button>
                    </div>
                </div>
            </div>
        </div>
    );
}


