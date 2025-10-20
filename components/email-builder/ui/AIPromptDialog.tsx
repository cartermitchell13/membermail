"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function AIPromptDialog({
	onClose,
	onSubmit,
}: {
	onClose: () => void;
	onSubmit: (prompt: string) => void;
}) {
	const [value, setValue] = useState("");
	const [loading, setLoading] = useState(false);

	async function submit() {
		if (!value.trim()) return;
		setLoading(true);
		try {
			await onSubmit(value.trim());
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
			<div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
				<h2 className="text-xl font-semibold text-white mb-4">Ask AI to write</h2>
				<div className="space-y-3">
					<label className="block text-sm font-medium text-white/80">What should the newsletter cover?</label>
					<Textarea
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder="e.g., Weekly update on new features, personalized greeting, CTA to join beta"
						className="bg-white/5 border-white/10 text-white min-h-32"
						onKeyDown={(e) => {
							if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
						}}
					/>
					<div className="p-3 rounded-lg bg-[#FA4616]/10 border border-[#FA4616]/30">
						<div className="text-xs font-medium text-[#FA4616] mb-1.5">💡 Personalization Tip</div>
						<div className="text-xs text-white/70">
							AI can use personalization variables like <code className="px-1 py-0.5 rounded bg-white/10 text-[#FA4616] font-mono">{`{{name}}`}</code>, <code className="px-1 py-0.5 rounded bg-white/10 text-[#FA4616] font-mono">{`{{email}}`}</code>, <code className="px-1 py-0.5 rounded bg-white/10 text-[#FA4616] font-mono">{`{{username}}`}</code>, and <code className="px-1 py-0.5 rounded bg-white/10 text-[#FA4616] font-mono">{`{{company_name}}`}</code> to make emails more personal.
						</div>
					</div>
					<div className="flex justify-end gap-3">
						<Button variant="outline" onClick={onClose}>Cancel</Button>
						<Button onClick={submit} disabled={loading || !value.trim()}>
							{loading ? "Writing…" : "Write"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}


