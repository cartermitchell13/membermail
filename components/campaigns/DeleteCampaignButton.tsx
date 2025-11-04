"use client";

import { useRouter } from "next/navigation";

export default function DeleteCampaignButton({ id }: { id: number }) {
  const router = useRouter();
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert("Failed to delete draft");
    }
  };
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center px-2 py-1.5 rounded-md border border-white/20 text-xs text-white/80 hover:bg-white/10"
      title="Delete draft"
    >
      Delete
    </button>
  );
}

