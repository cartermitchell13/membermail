"use client";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
const EmailPreview = dynamic(() => import("../EmailPreview"), { ssr: false });

export default function TemplateEditorPage({ params }: { params: Promise<{ experienceId: string; id: string }> }) {
    const { experienceId, id } = use(params);
    const [template, setTemplate] = useState<any>(null);
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [html, setHtml] = useState("");
    const [saving, setSaving] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        (async () => {
            const res = await fetch(`/api/templates/${id}`);
            if (res.ok) {
                const data = await res.json();
                setTemplate(data.template);
                setName(data.template.name ?? "");
                setCategory(data.template.category ?? "");
                setHtml(data.template.html_content ?? "");
            }
        })();
    }, [id]);

    async function save() {
        setSaving(true);
        await fetch(`/api/templates/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, category, html_content: html }),
        });
        setSaving(false);
    }

    const showPreview = searchParams.get("preview") === "1";

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
                <div className="px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold text-white">Edit Template</h1>
                            <p className="text-sm text-white/50">Customize your email template</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="border-white/10 hover:bg-white/5">
                            Cancel
                        </Button>
                        <Button disabled={saving} onClick={save} className="bg-[#FF5722] hover:bg-[#FF5722]/90 text-white">
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Sidebar with template info */}
                <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 bg-black/20 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-white/80">Template Name</label>
                            <Input 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="e.g., Weekly Recap"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-white/80">Category</label>
                            <Input 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="e.g., Trading, Fitness, etc."
                            />
                        </div>
                    </div>

                    <div className="hidden md:block pt-4 border-t border-white/10">
                        <div className="space-y-3">
                            <div className="text-sm font-medium text-white/80">Template Info</div>
                            <div className="space-y-2 text-sm text-white/50">
                                <div className="flex justify-between">
                                    <span>Status</span>
                                    <span className="text-green-400">Active</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Created</span>
                                    <span>{template?.created_at ? new Date(template.created_at).toLocaleDateString() : "-"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Area - Takes up remaining space */}
                <div className="flex-1 overflow-hidden">
                    <EmailPreview html={html} />
                </div>
            </div>
        </div>
    );
}


