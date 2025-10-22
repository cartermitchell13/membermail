import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

/**
 * CursorPlaceholder
 * ------------------
 * A lightweight Tiptap/ProseMirror extension that renders a placeholder string
 * as a widget decoration positioned exactly at the current caret location.
 *
 * Why this instead of the default Placeholder extension?
 * - The default extension uses a CSS ::before pseudo-element on empty nodes,
 *   which cannot follow the caret horizontally when alignment (e.g. center)
 *   changes. A widget decoration does follow the caret, so the placeholder
 *   appears exactly where the user is typing regardless of text alignment.
 */
const CursorPlaceholder = Extension.create({
  name: "cursorPlaceholder",

  addOptions() {
    return {
      // Placeholder text to render when the current textblock is empty.
      placeholder: "Type '/' for commands",
      // Predicate to decide whether to show the placeholder for the current state.
      // Defaults to showing on an empty paragraph-like text block.
      shouldShow: (params: {
        state: any;
        isEditable: boolean;
      }): boolean => {
        const { state, isEditable } = params;
        if (!isEditable) return false;

        const { selection } = state;
        // Only show on a cursor (not a range selection)
        if (!selection.empty) return false;

        const {$from} = selection;
        const node = $from.parent;

        // Only for textblocks (e.g. paragraph, heading, etc.)
        if (!node.isTextblock) return false;

        // Only if the node is empty (no text and no inline children)
        if (node.content.size > 0) return false;

        // Only when we're not inside code or a special node that should not show a placeholder
        if (node.type.spec.code) return false;

        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    const key = new PluginKey("cursorPlaceholder");

    return [
      new Plugin<{ deco: DecorationSet }>({
        key,
        state: {
          init: () => ({ deco: DecorationSet.empty }),
          apply: (tr, prev) => {
            // Recompute decorations on any transaction that affects selection or doc
            if (!tr.docChanged && !tr.selectionSet) return prev;
            return { deco: DecorationSet.empty };
          },
        },
        props: {
          decorations: (state) => {
            const view = this.editor?.view;
            const opts = this.options as any;
            const shouldShow = opts.shouldShow({ state, isEditable: this.editor?.isEditable ?? false });
            if (!shouldShow) return null;

            const { selection } = state;
            const pos = selection.from;

            // Create a widget decoration at the caret position. Because it is inline,
            // it adopts the current text alignment and flows with the caret.
            const widget = Decoration.widget(
              pos,
              () => {
                const span = document.createElement("span");
                span.textContent = String(opts.placeholder ?? "");
                // Styling to match a typical subtle placeholder within the editor.
                // Using Tailwind utility classes (already present in the project).
                span.className = "pointer-events-none select-none text-white/40 italic";
                // Keep zero width so it does not push content; margin-left helps separate
                // from the cursor a bit for readability.
                span.style.marginLeft = "0.1rem";
                return span;
              },
              {
                // Place the widget AFTER the cursor position so the caret appears
                // BEFORE the placeholder text. This matches the UX expectation
                // that typing begins at the start of the hint text location.
                side: 1,
              }
            );

            return DecorationSet.create(state.doc, [widget]);
          },
        },
      }),
    ];
  },
});

export default CursorPlaceholder;
