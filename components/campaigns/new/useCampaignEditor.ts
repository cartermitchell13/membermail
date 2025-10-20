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
            Placeholder.configure({ 
                placeholder: ({ node }) => {
                    // Show different placeholder for different node types
                    if (node.type.name === 'heading') {
                        return 'Heading';
                    }
                    return "Type '/' for commands";
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


