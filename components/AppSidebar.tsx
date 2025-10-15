"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

type SidebarProps = {
	experienceId: string;
};

function cx(...classes: Array<string | false | null | undefined>): string {
	return classes.filter(Boolean).join(" ");
}

export default function AppSidebar({ experienceId }: SidebarProps) {
	const pathname = usePathname();
	const base = `/experiences/${experienceId}`;

	const items = [
		{ label: "Campaigns", href: `${base}/campaigns`, match: `${base}/campaigns` },
		{ label: "New Email", href: `${base}/templates`, match: `${base}/templates` },
		{ label: "Members", href: `${base}/members`, match: `${base}/members` },
		{ label: "Settings", href: `${base}/settings`, match: `${base}/settings` },
	];

	return (
		<aside className="h-screen sticky top-0 w-60 shrink-0 bg-black">
			<div className="px-4 py-5">
				<Link href={`${base}/campaigns`} className="flex items-center gap-2">
					<Image src="/assets/logos/mm-logo.png" alt="MemberMail" width={28} height={28} className="rounded" />
					<span className="text-4 font-semibold">MemberMail</span>
				</Link>
			</div>
			<nav className="px-2 py-2 space-y-1">
				{items.map((it) => {
					const active = pathname?.startsWith(it.match);
					return (
						<Link
							key={it.href}
							href={it.href}
							className={cx(
								"block rounded-md px-3 py-2 text-3",
								active
									? "bg-white/10 text-white"
									: "text-white/70 hover:text-white hover:bg-white/5",
							)}
						>
							{it.label}
						</Link>
					);
				})}
			</nav>
			<div className="mt-auto px-4 py-4 text-white/40 text-2">
				<span>Powered by Whop</span>
			</div>
		</aside>
	);
}


