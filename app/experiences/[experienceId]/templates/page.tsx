import Link from "next/link";
import { headers } from "next/headers";
// Avoid importing client-only utilities in server components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Actions from "./Actions";

async function getTemplates(baseUrl: string) {
	const res = await fetch(`${baseUrl}/api/templates`, { cache: "no-store" });
	if (!res.ok) return [] as any[];
	const data = await res.json();
	return data.templates as any[];
}

export default async function TemplatesPage({ params }: { params: Promise<{ experienceId: string }> }) {
	const h = await headers();
	const proto = h.get("x-forwarded-proto") ?? "http";
	const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
	const baseUrl = `${proto}://${host}`;
	const templates = await getTemplates(baseUrl);
    const { experienceId } = await params;
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-4xl font-semibold tracking-tight">Templates</h1>
				<Link
					href="./templates/new"
					className={
						"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors " +
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA4616] disabled:pointer-events-none disabled:opacity-50 " +
						"bg-[#FA4616] text-white hover:bg-[#E23F14] h-9 px-4"
					}
				>
					New template
				</Link>
			</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Blank Draft Card */}
                <Card className="border-2 border-[#FA4616]/50 bg-[#FA4616]/10 hover:border-[#FA4616] transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span>Blank Draft</span>
                            <span className="text-2 rounded bg-[#FA4616] px-2 py-0.5">New</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-white/60 text-2 mb-3">Start from scratch</div>
                        <p className="text-sm text-white/50 mb-4">Create a new email with our rich text editor</p>
                        <Link
                            href={`./templates/draft`}
                            className={
                                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors " +
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA4616] disabled:pointer-events-none disabled:opacity-50 " +
                                "bg-[#FA4616] text-white hover:bg-[#E23F14] h-9 px-4"
                            }
                        >
                            Create
                        </Link>
                    </CardContent>
                </Card>
                {templates.map((t: any) => {
                    const isCurated = String(t.id).startsWith("cur-");
                    return (
                        <Card key={t.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="truncate">{t.name}</span>
                                    {isCurated ? (
                                        <span className="text-2 rounded bg-white/10 px-2 py-0.5">Curated</span>
                                    ) : null}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-white/60 text-2 mb-3">{t.category ?? "General"}</div>
                                {t.thumbnail ? (
                                    <div className="mb-3 overflow-hidden rounded-md border border-white/10 bg-white/5">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={t.thumbnail} alt="Template thumbnail" className="w-full h-32 object-cover" />
                                    </div>
                                ) : null}
                                <Actions id={String(t.id)} isCurated={isCurated} experienceId={experienceId} />
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
		</div>
	);
}


