"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Actions({
	id,
	isCurated,
	experienceId,
}: {
	id: string;
	isCurated: boolean;
	experienceId: string;
}) {
	const router = useRouter();

	async function duplicate() {
		const res = await fetch(`/api/templates/${id}/duplicate`, { method: "POST" });
		if (res.ok) {
			router.refresh();
		}
	}

	async function remove() {
		if (!confirm("Delete this template?")) return;
		const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
		if (res.ok) router.refresh();
	}

	return (
		<div className="flex flex-wrap gap-2">
			<Link
				href={`../campaigns/new?templateId=${id}`}
				className={
					"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors " +
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA4616] disabled:pointer-events-none disabled:opacity-50 " +
					"bg-[#FA4616] text-white hover:bg-[#E23F14] h-9 px-4"
				}
			>
				Use
			</Link>
			{isCurated ? (
				<>
					<Link
						href={`./templates/${id}?preview=1`}
						className={
							"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors " +
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-9 disabled:pointer-events-none disabled:opacity-50 " +
							"border border-white/20 bg-transparent text-white hover:bg-white/10 h-9 px-4"
						}
					>
						Preview
					</Link>
					<button
						onClick={duplicate}
						className={
							"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors " +
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-9 disabled:pointer-events-none disabled:opacity-50 " +
							"bg-white/10 text-white hover:bg-white/20 h-9 px-4"
						}
					>
						Duplicate
					</button>
				</>
			) : (
				<>
					<Link
						href={`./templates/${id}`}
						className={
							"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors " +
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-9 disabled:pointer-events-none disabled:opacity-50 " +
							"bg-white/10 text-white hover:bg-white/20 h-9 px-4"
						}
					>
						Edit
					</Link>
					<Link
						href={`./templates/${id}?preview=1`}
						className={
							"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors " +
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-9 disabled:pointer-events-none disabled:opacity-50 " +
							"border border-white/20 bg-transparent text-white hover:bg-white/10 h-9 px-4"
						}
					>
						Preview
					</Link>
					<button
						onClick={remove}
						className={
							"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors " +
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-9 disabled:pointer-events-none disabled:opacity-50 " +
							"border border-white/20 bg-transparent text-white hover:bg-white/10 h-9 px-4"
						}
					>
						Delete
					</button>
				</>
			)}
		</div>
	);
}


