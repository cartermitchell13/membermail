"use client";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Blockquote from "@tiptap/extension-blockquote";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import HorizontalRule from "@tiptap/extension-horizontal-rule";

// App-specific extensions
import CTA from "@/components/email-builder/extensions/CTA";
import Columns from "@/components/email-builder/extensions/Columns";
import SlashCommand from "@/components/email-builder/extensions/SlashCommand";
import AICompose from "@/components/email-builder/extensions/AICompose";
import Variable from "@/components/email-builder/extensions/Variable";
import ImageWithPlaceholder from "@/components/email-builder/extensions/ImageWithPlaceholder";
import LinkWithPlaceholder from "@/components/email-builder/extensions/LinkWithPlaceholder";
// Caret-following placeholder that positions the text at the exact cursor location
import CursorPlaceholder from "@/components/email-builder/extensions/CursorPlaceholder";

export function useCampaignEditor() {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({ blockquote: false }),
            Blockquote.configure({ HTMLAttributes: { class: "mm-blockquote" } }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: "text-[#FA4616] underline" },
            }),
            ImageWithPlaceholder.configure({ HTMLAttributes: { class: "max-w-full h-auto rounded" } }),
            // Keep the built-in Placeholder only for headings so that paragraphs
            // use the caret-following CursorPlaceholder instead. Returning an
            // empty string for non-heading nodes effectively disables the visual
            // placeholder for them.
            Placeholder.configure({ 
                placeholder: ({ node }) => {
                    if (node.type.name === 'heading') {
                        return 'Heading';
                    }
                    return '';
                },
                showOnlyWhenEditable: true,
                showOnlyCurrent: false,
            }),
            Youtube.configure({ controls: true, nocookie: true }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            HorizontalRule.configure({ HTMLAttributes: { class: "mm-hr" } }),
            Columns,
            CTA,
            Variable,
            AICompose,
            SlashCommand,
            LinkWithPlaceholder,
            // Render the caret-following placeholder for empty text blocks so the
            // text like "Type '/' for commands" follows the caret and aligns with
            // center/right alignment modes.
            CursorPlaceholder.configure({ placeholder: "Type '/' for commands" }),
            // React DragHandle is mounted separately where needed (not an extension)
        ],
        content: "",
        editorProps: {
            attributes: {
                class:
                    "prose prose-invert max-w-none focus:outline-none min-h-[400px] px-6 py-4",
            },
        },
    });

    return editor;
}


