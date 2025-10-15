"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { sanitizeEmailHtml } from "@/lib/html/sanitize";

type Device = "desktop" | "mobile";

export default function EmailPreview({ html }: { html: string }) {
    const [device, setDevice] = useState<Device>("desktop");
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [docHeight, setDocHeight] = useState<number>(800);

    const srcDoc = useMemo(() => {
        const safe = sanitizeEmailHtml(html || "");
        const viewportMeta = `<meta name="viewport" content="width=device-width, initial-scale=1">`;
        
        // Add responsive CSS for email tables
        const responsiveStyles = device === "mobile" ? `
            <style>
                table { max-width: 100% !important; width: 100% !important; }
                img { max-width: 100% !important; height: auto !important; }
                td, th { word-wrap: break-word !important; }
                body { -webkit-text-size-adjust: 100% !important; }
            </style>
        ` : '';
        
        return `<!doctype html><html><head>${viewportMeta}` +
            `<meta name="color-scheme" content="light dark">${responsiveStyles}</head>` +
            `<body style="margin:0; padding:0; background:#0b0b0b; width:100%; overflow-x:hidden;">${safe}</body></html>`;
    }, [html, device]);

    // Auto-resize the iframe to the email's content height
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        function resize() {
            try {
                if (!iframe) return;
                const body = iframe.contentDocument?.body;
                const doc = iframe.contentDocument?.documentElement;
                const height = Math.max(
                    body?.scrollHeight || 0,
                    body?.offsetHeight || 0,
                    doc?.clientHeight || 0,
                    doc?.scrollHeight || 0,
                    doc?.offsetHeight || 0,
                );
                if (height) setDocHeight(height);
            } catch {
                // ignore
            }
        }
        const onLoad = () => resize();
        iframe.addEventListener("load", onLoad);
        const id = window.setInterval(resize, 400);
        return () => {
            iframe.removeEventListener("load", onLoad);
            window.clearInterval(id);
        };
    }, [srcDoc]);

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-[#0A0A0A] to-[#111111]">
            {/* Preview Controls */}
            <div className="px-4 md:px-8 py-4 md:py-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 bg-black/20 backdrop-blur-sm">
                <div>
                    <h2 className="text-base md:text-lg font-semibold text-white">Live Preview</h2>
                    <p className="text-xs md:text-sm text-white/50 mt-0.5 hidden sm:block">See how your email looks to recipients</p>
                </div>
                <div className="inline-flex rounded-lg border border-white/10 p-0.5 md:p-1 bg-black/40 shadow-lg">
                    <button
                        onClick={() => setDevice("desktop")}
                        className={
                            "h-8 md:h-9 px-3 md:px-5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 " +
                            (device === "desktop" 
                                ? "bg-[#FF5722] text-white shadow-lg shadow-[#FF5722]/20" 
                                : "text-white/70 hover:text-white hover:bg-white/5")
                        }
                    >
                        Desktop
                    </button>
                    <button
                        onClick={() => setDevice("mobile")}
                        className={
                            "h-8 md:h-9 px-3 md:px-5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 " +
                            (device === "mobile" 
                                ? "bg-[#FF5722] text-white shadow-lg shadow-[#FF5722]/20" 
                                : "text-white/70 hover:text-white hover:bg-white/5")
                        }
                    >
                        Mobile
                    </button>
                </div>
            </div>

            {/* Preview Canvas */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
                <div className="flex items-start justify-center min-h-full">
                    <div 
                        className="transition-all duration-300 ease-in-out w-full mx-auto"
                        style={{ 
                            maxWidth: device === "desktop" ? "900px" : "min(375px, 100%)"
                        }}
                    >
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-white/5 bg-black/40 backdrop-blur-sm">
                            {/* Email Client Header Mockup */}
                            <div className="bg-black/60 border-b border-white/10 px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/70" />
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/70" />
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/70" />
                                </div>
                                <div className="flex-1 text-center text-[10px] md:text-xs text-white/40 font-medium">
                                    {device === "mobile" ? "iPhone 14 Pro" : "Email Preview"}
                                </div>
                            </div>
                            
                            {/* Email Content */}
                            <div className="bg-[#0b0b0b] relative" style={{ overflow: 'hidden' }}>
                                {device === "mobile" && (
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/20 rounded-full z-10" />
                                )}
                                <iframe
                                    ref={iframeRef}
                                    title="Email preview"
                                    className="w-full border-none block"
                                    scrolling="no"
                                    style={{ 
                                        height: docHeight,
                                        overflow: 'hidden'
                                    }}
                                    srcDoc={srcDoc}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


