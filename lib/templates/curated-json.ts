import type { EmailDoc } from "@/lib/email/render";

export type CuratedJsonTemplate = {
    id: string;
    name: string;
    category: string;
    thumbnail: string;
    content_json: EmailDoc;
    is_default: true;
};

const baseTheme = {
    primary: "#FA4616",
    fontFamily: "Geist, Arial, Helvetica, sans-serif",
    radius: 8,
    textColor: "#eaeaea",
    background: "#0b0b0b",
} as const;

const tTrading: EmailDoc = {
    type: "email",
    version: 1,
    theme: baseTheme,
    body: [
        {
            type: "section",
            background: "#141414",
            padding: 24,
            children: [
                { type: "text", html: "<h1>Weekly Trade Recap</h1><p>Key moves, wins, and lessons.</p>" },
                { type: "divider", color: "#1f2937", thickness: 1, spacing: 16 },
                { type: "columns", columns: [
                    { width: "100%", children: [
                        { type: "text", html: "<h3>Top Trades</h3><ul><li>XYZ +7.8%</li><li>ABC managed risk</li></ul>" },
                        { type: "button", label: "View Full Journal", url: "https://example.com" },
                    ] }
                ]}
            ],
        },
    ],
};

const tGeneral: EmailDoc = {
    type: "email",
    version: 1,
    theme: baseTheme,
    body: [
        {
            type: "section",
            background: "#141414",
            padding: 24,
            children: [
                { type: "text", html: "<h1>Community Update</h1><p>Quick wins, helpful resources, what's next.</p>" },
                { type: "spacer", height: 12 },
                { type: "button", label: "Read More", url: "https://example.com" },
            ],
        },
    ],
};

export function getCuratedJsonTemplatesWithIds(): CuratedJsonTemplate[] {
    return [
        {
            id: "cj-1",
            name: "Trading – Weekly Recap (Blocks)",
            category: "Trading",
            thumbnail: "/assets/templates/trading.svg",
            content_json: tTrading,
            is_default: true,
        },
        {
            id: "cj-2",
            name: "General – Clean (Blocks)",
            category: "General",
            thumbnail: "/assets/templates/general.svg",
            content_json: tGeneral,
            is_default: true,
        },
    ];
}

export function getCuratedJsonTemplateById(id: string): CuratedJsonTemplate | null {
    const list = getCuratedJsonTemplatesWithIds();
    return list.find((t) => t.id === id) ?? null;
}


