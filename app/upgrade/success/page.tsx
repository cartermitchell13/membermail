import Link from "next/link";
import { CheckCircle } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

/**
 * Success page shown after a successful subscription purchase
 * This is where users land after completing payment
 */
export default function UpgradeSuccessPage() {
	return (
		<SidebarProvider>
			<div className="min-h-screen bg-black flex">
				<AppSidebar experienceId="" />
				<main className="relative flex-1 min-h-0 m-4 h-[calc(100vh-2rem)] rounded-2xl border border-white/10 bg-[#111111] text-white overflow-auto">
					<div className="flex items-center justify-center min-h-full p-8">
						<div className="max-w-lg w-full">
							<div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
								{/* Success icon */}
								<div className="flex justify-center mb-6">
									<div className="bg-[#FA4616]/10 rounded-full p-4 border border-[#FA4616]/20">
										<CheckCircle className="h-16 w-16 text-[#FA4616]" />
									</div>
								</div>

								{/* Success message */}
								<h1 className="text-3xl font-bold mb-4 text-white">
									Payment Successful!
								</h1>
								<p className="text-white/60 mb-8">
									Thank you for upgrading! Your subscription has been activated and you
									now have access to all premium features.
								</p>

								{/* What's next section */}
								<div className="bg-white/5 rounded-lg p-6 mb-8 text-left border border-white/10">
									<h2 className="font-semibold text-lg mb-3 text-white">
										What's Next?
									</h2>
									<ul className="space-y-2 text-sm text-white/70">
										<li className="flex items-start gap-2">
											<span className="text-[#FA4616] font-bold mt-0.5">•</span>
											<span>A confirmation email has been sent to your inbox</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="text-[#FA4616] font-bold mt-0.5">•</span>
											<span>You can manage your subscription anytime from your billing portal</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="text-[#FA4616] font-bold mt-0.5">•</span>
											<span>Premium features are now available across your dashboard</span>
										</li>
									</ul>
								</div>

								{/* Action buttons */}
								<div className="flex flex-col gap-3">
									<Link
										href="/dashboard"
										className="w-full px-6 py-3 bg-[#FA4616] text-white rounded-lg font-semibold hover:bg-[#E23F14] transition-colors"
									>
										Go to Dashboard
									</Link>
									<a
										href="https://whop.com/@me/settings/orders/"
										target="_blank"
										rel="noopener noreferrer"
										className="w-full px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
									>
										View Billing Portal
									</a>
								</div>
							</div>

							{/* Support section */}
							<div className="mt-6 text-center text-sm text-white/50">
								<p>
									Need help?{" "}
									<a href="mailto:support@yourdomain.com" className="text-[#FA4616] hover:underline">
										Contact Support
									</a>
								</p>
							</div>
						</div>
					</div>
				</main>
			</div>
		</SidebarProvider>
	);
}
