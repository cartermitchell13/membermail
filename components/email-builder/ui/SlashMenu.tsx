"use client";

import { useEffect, useMemo, useRef } from "react";

// Type definition for menu items with category and icon
type Item = { 
  id: string; 
  title: string; 
  subtitle?: string; 
  category: string;
  icon: string;
};

// Simple icon component for menu items
function MenuIcon({ name }: { name: string }) {
  // Map icon names to simple SVG paths
  const icons: Record<string, React.ReactNode> = {
    text: <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    list: <><circle cx="6" cy="6" r="1.5" fill="currentColor"/><circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="6" cy="18" r="1.5" fill="currentColor"/><path d="M10 6h10M10 12h10M10 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
    "list-ordered": <path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M5 14h-1v4l2 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
    quote: <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="currentColor"/>,
    minus: <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>,
    columns: <path d="M3 3h7v18H3zM14 3h7v18h-7z" stroke="currentColor" strokeWidth="2" fill="none"/>,
    square: <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>,
    "heading-1": <><path d="M6 4v16M18 4v16M6 12h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><text x="20" y="18" fontSize="10" fill="currentColor" fontWeight="bold">1</text></>,
    "heading-2": <><path d="M6 4v16M18 4v16M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><text x="20" y="18" fontSize="10" fill="currentColor" fontWeight="bold">2</text></>,
    "heading-3": <><path d="M6 4v16M18 4v16M6 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><text x="20" y="18" fontSize="10" fill="currentColor" fontWeight="bold">3</text></>,
    "heading-4": <><path d="M6 4v16M18 4v16M6 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><text x="20" y="18" fontSize="9" fill="currentColor">4</text></>,
    "heading-5": <><path d="M6 4v16M18 4v16M6 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><text x="20" y="18" fontSize="9" fill="currentColor">5</text></>,
    "heading-6": <><path d="M6 4v16M18 4v16M6 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><text x="20" y="18" fontSize="9" fill="currentColor">6</text></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>,
    video: <><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></>,
  };

  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {icons[name] || icons.text}
    </svg>
  );
}

export default function SlashMenu({ items, command, selectedIndex = 0 }: any) {
    const ref = useRef<HTMLDivElement | null>(null);
    const visible = items && items.length > 0;
    const selected = useMemo(() => Math.min(Math.max(0, selectedIndex), Math.max(0, (items?.length || 1) - 1)), [selectedIndex, items]);

    // Group items by category
    const groupedItems = useMemo(() => {
        if (!items) return {};
        const groups: Record<string, Item[]> = {};
        items.forEach((item: Item) => {
            if (!groups[item.category]) {
                groups[item.category] = [];
            }
            groups[item.category].push(item);
        });
        return groups;
    }, [items]);

    if (!visible) return null;

    let currentIndex = 0;

    return (
        <div ref={ref} className="w-[560px] rounded-lg border border-white/10 bg-[#1f1f1f] shadow-2xl">
            <div className="max-h-[500px] overflow-auto p-3">
                {Object.entries(groupedItems).map(([category, categoryItems]) => (
                    <div key={category} className="mb-3 last:mb-0">
                        <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
                            {category}
                        </h3>
                        <div className="grid grid-cols-3 gap-1.5">
                            {categoryItems.map((item) => {
                                const itemIndex = currentIndex++;
                                const isSelected = itemIndex === selected;
                                return (
                                    <button
                                        key={item.id}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                                            isSelected ? "bg-white/10" : "hover:bg-white/5"
                                        }`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (command) {
                                                command({ selectedIndex: itemIndex, items });
                                            }
                                        }}
                                    >
                                        <div className={`flex-shrink-0 ${
                                            isSelected ? "text-purple-400" : "text-white/60"
                                        }`}>
                                            <MenuIcon name={item.icon} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-white truncate">{item.title}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="text-white/50 text-center py-8">No results found</div>
                )}
            </div>
        </div>
    );
}


