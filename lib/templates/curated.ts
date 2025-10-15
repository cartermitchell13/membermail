export type CuratedTemplate = {
    name: string;
    category: string;
    thumbnail: string;
    html_content: string;
};

// Minimal, clean HTML emails for each niche. Keep inline styles for broad client compatibility.
export const curatedTemplates: CuratedTemplate[] = [
    {
        name: "Trading – Weekly Recap",
        category: "Trading",
        thumbnail: "/assets/templates/trading.svg",
        html_content:
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;color:#eaeaea;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px"><tr><td style="padding:16px 0;text-align:center"><div style="font-size:22px;font-weight:700">Weekly Trade Recap</div><div style="color:#9ca3af;font-size:13px;margin-top:4px">Key moves, wins, and lessons</div></td></tr><tr><td style="background:#141414;border:1px solid #1f2937;border-radius:12px;padding:20px"><h2 style="margin:0 0 10px 0;font-size:18px">Market Overview</h2><p style="margin:0 0 12px 0;line-height:1.6">S&P closed higher with increased volatility. Here’s what mattered most for our strategy this week.</p><h3 style="margin:16px 0 8px 0;font-size:16px">Top Trades</h3><ul style="margin:0;padding-left:18px"><li>Entry: <strong>XYZ</strong> at 42.10 – Exit 45.40 (+7.8%)</li><li>Entry: <strong>ABC</strong> at 18.20 – Exit 17.10 (risk-managed)</li></ul><div style="margin-top:16px"><a href="https://example.com" style="display:inline-block;background:#FA4616;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">View Full Journal</a></div></td></tr><tr><td style="padding-top:14px;color:#6b7280;font-size:12px;text-align:center">You’re receiving this as a member of our trading community.</td></tr></table></td></tr></table>',
    },
    {
        name: "Sports Betting – Weekly Picks",
        category: "Sports Betting",
        thumbnail: "/assets/templates/sports.svg",
        html_content:
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;color:#eaeaea;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px"><tr><td style="padding:16px 0;text-align:center"><div style="font-size:22px;font-weight:700">Weekly Picks & Results</div><div style="color:#9ca3af;font-size:13px;margin-top:4px">Premium card with disciplined unit sizing</div></td></tr><tr><td style="background:#141414;border:1px solid #1f2937;border-radius:12px;padding:20px"><h2 style="margin:0 0 10px 0;font-size:18px">This Week\'s Card</h2><ol style="margin:0;padding-left:18px"><li>NYK -3.5 (1u)</li><li>LAL ML (0.5u)</li><li>GSW o228.5 (1u)</li></ol><div style="margin-top:16px"><a href="https://example.com" style="display:inline-block;background:#FA4616;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">Track Results</a></div></td></tr><tr><td style="padding-top:14px;color:#6b7280;font-size:12px;text-align:center">Bet responsibly. 18+ only.</td></tr></table></td></tr></table>',
    },
    {
        name: "Fitness – Transformation Spotlight",
        category: "Fitness",
        thumbnail: "/assets/templates/fitness.svg",
        html_content:
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;color:#eaeaea;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px"><tr><td style="padding:16px 0;text-align:center"><div style="font-size:22px;font-weight:700">Member Transformation</div><div style="color:#9ca3af;font-size:13px;margin-top:4px">Weekly highlight + coach tips</div></td></tr><tr><td style="background:#141414;border:1px solid #1f2937;border-radius:12px;padding:20px"><h2 style="margin:0 0 10px 0;font-size:18px">Spotlight: Alex</h2><p style="margin:0 0 12px 0;line-height:1.6">Down 8lbs in 4 weeks. Focused on protein targets and consistent training.</p><ul style="margin:0;padding-left:18px"><li>Program: PPL 4x/week</li><li>Nutrition: 180g protein/day</li><li>Tip: Walk 8–10k steps daily</li></ul><div style="margin-top:16px"><a href="https://example.com" style="display:inline-block;background:#FA4616;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">Start This Week\'s Plan</a></div></td></tr><tr><td style="padding-top:14px;color:#6b7280;font-size:12px;text-align:center">You\'re receiving this as part of your coaching membership.</td></tr></table></td></tr></table>',
    },
    {
        name: "Reselling – Flip of the Week",
        category: "Reselling",
        thumbnail: "/assets/templates/reselling.svg",
        html_content:
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;color:#eaeaea;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px"><tr><td style="padding:16px 0;text-align:center"><div style="font-size:22px;font-weight:700">Flip of the Week</div><div style="color:#9ca3af;font-size:13px;margin-top:4px">Sourcing tips and margins</div></td></tr><tr><td style="background:#141414;border:1px solid #1f2937;border-radius:12px;padding:20px"><h2 style="margin:0 0 10px 0;font-size:18px">Featured Find</h2><p style="margin:0 0 12px 0;line-height:1.6">Vintage jacket sourced at $35, sold for $120. Here\'s where and how.</p><ul style="margin:0;padding-left:18px"><li>Source: Local thrift</li><li>Prep: Gentle clean, new photos</li><li>List: eBay with keywords and measurements</li></ul><div style="margin-top:16px"><a href="https://example.com" style="display:inline-block;background:#FA4616;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">See Sourcing Guide</a></div></td></tr><tr><td style="padding-top:14px;color:#6b7280;font-size:12px;text-align:center">You\'re receiving this as part of our reselling community.</td></tr></table></td></tr></table>',
    },
    {
        name: "General – Clean Newsletter",
        category: "General",
        thumbnail: "/assets/templates/general.svg",
        html_content:
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;color:#eaeaea;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px"><tr><td style="padding:16px 0;text-align:center"><div style="font-size:22px;font-weight:700">Community Update</div><div style="color:#9ca3af;font-size:13px;margin-top:4px">Concise, clean, and readable</div></td></tr><tr><td style="background:#141414;border:1px solid #1f2937;border-radius:12px;padding:20px"><h2 style="margin:0 0 10px 0;font-size:18px">What\'s New</h2><p style="margin:0 0 12px 0;line-height:1.6">Welcome to this week\'s update. Quick wins, helpful resources, and what\'s coming next.</p><ul style="margin:0;padding-left:18px"><li>New content</li><li>Upcoming events</li><li>Member shoutouts</li></ul><div style="margin-top:16px"><a href="https://example.com" style="display:inline-block;background:#FA4616;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">Read More</a></div></td></tr><tr><td style="padding-top:14px;color:#6b7280;font-size:12px;text-align:center">Sent with MemberMail.</td></tr></table></td></tr></table>',
    },
];

export function getCuratedTemplatesWithIds() {
    return curatedTemplates.map((t, index) => ({
        id: `cur-${index + 1}`,
        ...t,
        is_default: true as const,
    }));
}

export function getCuratedTemplateById(id: string) {
    if (!id.startsWith("cur-")) return null;
    const idx = Number.parseInt(id.replace("cur-", ""), 10) - 1;
    if (Number.isNaN(idx) || idx < 0 || idx >= curatedTemplates.length) return null;
    const t = curatedTemplates[idx];
    return { id, ...t, is_default: true as const };
}


