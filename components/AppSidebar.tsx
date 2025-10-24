"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Megaphone, BarChart3, Users, Settings as SettingsIcon, Crown, Bot } from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarRail } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

type SidebarProps = {
	experienceId?: string;
	companyId?: string;
};

export default function AppSidebar({ experienceId, companyId }: SidebarProps) {
	const pathname = usePathname();
	// Use dashboard path for company, experience path for experience
	const base = companyId ? `/dashboard/${companyId}` : `/experiences/${experienceId}`;
    const { open } = useSidebar();

    const items = [
        { label: "Campaigns", href: `${base}/campaigns`, match: `${base}/campaigns`, icon: Megaphone },
        { label: "Automations", href: `${base}/automations`, match: `${base}/automations`, icon: Bot },
        { label: "Metrics", href: `${base}/metrics`, match: `${base}/metrics`, icon: BarChart3 },
        { label: "Members", href: `${base}/members`, match: `${base}/members`, icon: Users },
        { label: "Settings", href: `${base}/settings`, match: `${base}/settings`, icon: SettingsIcon },
        { label: "Upgrade", href: `/upgrade`, match: `/upgrade`, icon: Crown, highlight: true },
    ];

	return (
		<TooltipProvider delayDuration={100}>
			<Sidebar collapsible="icon">
				<SidebarHeader>
					<Link href={`${base}/campaigns`} className="flex items-center gap-2 no-underline text-white hover:text-white">
						<Image src="/assets/logos/mm-logo.png" alt="MemberMail" width={28} height={28} className="rounded" />
						{open && <span className="text-4 font-semibold font-geist text-white">membermail</span>}
					</Link>
					<div className="mt-3">
						<SidebarTrigger aria-label="Toggle sidebar" />
					</div>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								{items.map((it) => {
									const active = pathname?.startsWith(it.match);
									const isHighlight = 'highlight' in it && it.highlight;
									return (
										<SidebarMenuItem key={it.href}>
											{!open ? (
												<Tooltip>
													<TooltipTrigger asChild>
                                                    <div className="relative">
                                                        <SidebarMenuButton asChild isActive={active} className={isHighlight ? "text-yellow-500 hover:text-yellow-600" : ""}>
                                                            <Link href={it.href} className="flex items-center gap-2 no-underline">
                                                                <it.icon className="h-4 w-4 text-white" />
                                                            </Link>
                                                        </SidebarMenuButton>
                                                    </div>
													</TooltipTrigger>
													<TooltipContent side="right">
														<p>{it.label}</p>
													</TooltipContent>
												</Tooltip>
											) : (
                                        <SidebarMenuButton asChild isActive={active} className={isHighlight ? "text-yellow-500 hover:text-yellow-600" : "text-white/80 hover:text-white"}>
                                            <Link href={it.href} className="flex items-center gap-2 no-underline">
                                                <it.icon className="h-4 w-4 text-white" />
                                                {open && <span className="text-white">{it.label}</span>}
                                            </Link>
                                        </SidebarMenuButton>
											)}
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter className="text-white/40 text-2">
					<span>Powered by Whop</span>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>
		</TooltipProvider>
	);
}
