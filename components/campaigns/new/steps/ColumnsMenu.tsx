"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";

/**
 * Custom menu that appears at the top-center of columns when cursor is inside
 * Positioned relative to the columns element itself, not the cursor
 */
export default function ColumnsMenu({ editor }: { editor: Editor | null }) {
    const [show, setShow] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [columnCount, setColumnCount] = useState(2);
    const [mounted, setMounted] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Ensure we're mounted on the client
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!editor || !mounted) return;

        const updateMenu = () => {
            // Use requestAnimationFrame to ensure DOM is stable
            requestAnimationFrame(() => {
                const { state } = editor;
                const { $from } = state.selection;
                
                // Check if cursor is inside a columns or column node
                let columnsNode = null;
                let columnsDepth = -1;
                
                for (let depth = $from.depth; depth > 0; depth--) {
                    const node = $from.node(depth);
                    if (node.type.name === 'columns') {
                        columnsNode = node;
                        columnsDepth = depth;
                        break;
                    } else if (node.type.name === 'column') {
                        // Keep checking up for the parent columns node
                        const parentNode = $from.node(depth - 1);
                        if (parentNode && parentNode.type.name === 'columns') {
                            columnsNode = parentNode;
                            columnsDepth = depth - 1;
                            break;
                        }
                    }
                }

                if (columnsNode && columnsDepth >= 0) {
                    // Get the position of the columns node
                    const pos = $from.before(columnsDepth);
                    
                    // Find all columns elements
                    const allColumnsElements = editor.view.dom.querySelectorAll('table.mm-columns[data-columns]');
                    
                    // Find the one that corresponds to our cursor position
                    let columnsElement: HTMLElement | null = null;
                    for (const el of Array.from(allColumnsElements)) {
                        if (el instanceof HTMLElement) {
                            // Use the first one we find (we'll improve this if needed)
                            columnsElement = el;
                            break;
                        }
                    }
                    
                    if (columnsElement) {
                        const rect = columnsElement.getBoundingClientRect();
                        
                        // Position at top-center of the columns element
                        setPosition({
                            top: rect.top - 45, // Above the columns
                            left: rect.left + rect.width / 2, // Center horizontally
                        });
                        
                        // Get column count from attributes
                        const count = Number(columnsNode.attrs.count || 2);
                        setColumnCount(count);
                        setShow(true);
                    } else {
                        setShow(false);
                    }
                } else {
                    setShow(false);
                }
            });
        };

        // Update on selection change and content updates
        editor.on("selectionUpdate", updateMenu);
        editor.on("update", updateMenu);
        
        // Also update on scroll
        const handleScroll = () => {
            if (show) updateMenu();
        };
        window.addEventListener("scroll", handleScroll, true);

        return () => {
            editor.off("selectionUpdate", updateMenu);
            editor.off("update", updateMenu);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [editor, show, mounted]);

    if (!show || !editor || !mounted) return null;

    const menuContent = (
        <div
            ref={menuRef}
            style={{
                position: "fixed",
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: "translateX(-50%)", // Center the menu
                zIndex: 50,
            }}
            className="mm-bubble"
        >
            <div className="flex items-center gap-2">
                <button 
                    type="button" 
                    className={`mm-bubble-btn ${columnCount === 2 ? 'is-active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.commands.setColumnsCount(2 as any)}
                    title="2 Columns"
                >
                    2
                </button>
                <button 
                    type="button" 
                    className={`mm-bubble-btn ${columnCount === 3 ? 'is-active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.commands.setColumnsCount(3 as any)}
                    title="3 Columns"
                >
                    3
                </button>
                <div className="mm-bubble-sep" />
                <button
                    type="button"
                    className="mm-bubble-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().setImagePlaceholder({ 
                        alt: "Image", 
                        suggestedPrompt: "Describe what you want to see in this image" 
                    }).run()}
                    title="Insert Image"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2 2.5l3-4l4.5 6H6l2.5-4.5zM8 8a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3z"/>
                    </svg>
                </button>
                <button
                    type="button"
                    className="mm-bubble-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.commands.insertCTA({})}
                    title="Insert CTA"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M4 5h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-7l-3 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>
                    </svg>
                </button>
                <div className="mm-bubble-sep" />
                <button
                    type="button"
                    className="mm-bubble-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                        const ok = editor.commands.deleteNode('columns');
                        if (!ok) {
                            const { state, view } = editor;
                            const $from = state.selection.$from;
                            for (let depth = $from.depth; depth > 0; depth--) {
                                const node = $from.node(depth);
                                if (node.type.name === 'columns') {
                                    const pos = $from.before(depth);
                                    view.dispatch(state.tr.delete(pos, pos + node.nodeSize));
                                    break;
                                }
                            }
                        }
                    }}
                    title="Delete columns"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M6 7h12l-1 12H7L6 7zm3-3h6l1 2H8l1-2z"/>
                    </svg>
                </button>
            </div>
        </div>
    );

    // Use portal to render outside the React tree to avoid DOM insertion issues
    return createPortal(menuContent, document.body);
}
