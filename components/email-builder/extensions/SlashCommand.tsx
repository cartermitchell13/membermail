"use client";

import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import type { Editor } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import SlashMenu from "../ui/SlashMenu";

// Type definition for menu items with optional icon and category
type Item = { 
  id: string; 
  title: string; 
  subtitle?: string; 
  category: string;
  icon: string;
  run: (editor: Editor) => void 
};

// Comprehensive list of available editor elements organized by category
const items: Item[] = [
  // Basics
  {
    id: "paragraph",
    title: "Paragraph",
    subtitle: "Start writing with plain text",
    category: "Basics",
    icon: "text",
    run: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: "bullet-list",
    title: "Bulleted List",
    subtitle: "Create a simple bulleted list",
    category: "Basics",
    icon: "list",
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "numbered-list",
    title: "Numbered List",
    subtitle: "Create a list with numbering",
    category: "Basics",
    icon: "list-ordered",
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "blockquote",
    title: "Blockquote",
    subtitle: "Capture a quote",
    category: "Basics",
    icon: "quote",
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "divider",
    title: "Divider",
    subtitle: "Visually divide blocks",
    category: "Basics",
    icon: "minus",
    run: (editor) => editor.commands.setHorizontalRule(),
  },
  {
    id: "columns-2",
    title: "Columns (2)",
    subtitle: "Insert a 2-column section",
    category: "Basics",
    icon: "columns",
    run: (editor) => editor.commands.insertColumns({ count: 2 }),
  },
  {
    id: "columns-3",
    title: "Columns (3)",
    subtitle: "Insert a 3-column section",
    category: "Basics",
    icon: "columns",
    run: (editor) => editor.commands.insertColumns({ count: 3 }),
  },
  {
    id: "cta",
    title: "Button",
    subtitle: "Insert a call-to-action button",
    category: "Basics",
    icon: "square",
    run: (editor) => editor.commands.insertCTA({}),
  },

  // Headings
  {
    id: "heading-1",
    title: "Heading 1",
    subtitle: "Big section heading",
    category: "Headings",
    icon: "heading-1",
    run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "heading-2",
    title: "Heading 2",
    subtitle: "Medium section heading",
    category: "Headings",
    icon: "heading-2",
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "heading-3",
    title: "Heading 3",
    subtitle: "Small section heading",
    category: "Headings",
    icon: "heading-3",
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "heading-4",
    title: "Heading 4",
    subtitle: "Tiny section heading",
    category: "Headings",
    icon: "heading-4",
    run: (editor) => editor.chain().focus().toggleHeading({ level: 4 }).run(),
  },
  {
    id: "heading-5",
    title: "Heading 5",
    subtitle: "Extra small heading",
    category: "Headings",
    icon: "heading-5",
    run: (editor) => editor.chain().focus().toggleHeading({ level: 5 }).run(),
  },
  {
    id: "heading-6",
    title: "Heading 6",
    subtitle: "Smallest heading",
    category: "Headings",
    icon: "heading-6",
    run: (editor) => editor.chain().focus().toggleHeading({ level: 6 }).run(),
  },

  // Media
  {
    id: "image",
    title: "Image",
    subtitle: "Upload or embed with a link",
    category: "Media",
    icon: "image",
    run: (editor) => {
      const url = window.prompt("Image URL");
      if (!url) return;
      editor.chain().focus().setImage({ src: url }).run();
    },
  },
  {
    id: "youtube",
    title: "YouTube",
    subtitle: "Embed a YouTube video",
    category: "Media",
    icon: "video",
    run: (editor) => {
      const url = window.prompt("YouTube URL");
      if (!url) return;
      editor.commands.setYoutubeVideo({ src: url });
    },
  },

  // Variables
  {
    id: "var-name",
    title: "Member Name",
    subtitle: "Insert {{name}} variable",
    category: "Variables",
    icon: "user",
    run: (editor) => editor.commands.insertVariable("name"),
  },
  {
    id: "var-email",
    title: "Email Address",
    subtitle: "Insert {{email}} variable",
    category: "Variables",
    icon: "at-sign",
    run: (editor) => editor.commands.insertVariable("email"),
  },
  {
    id: "var-username",
    title: "Username",
    subtitle: "Insert {{username}} variable",
    category: "Variables",
    icon: "user",
    run: (editor) => editor.commands.insertVariable("username"),
  },
  {
    id: "var-company",
    title: "Company Name",
    subtitle: "Insert {{company_name}} variable",
    category: "Variables",
    icon: "building",
    run: (editor) => editor.commands.insertVariable("company_name"),
  },
];

const SlashCommand = Extension.create({
  name: "slashCommand",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        allowSpaces: true,
        allow: ({ editor, state, range }: any) => {
          // Always keep the menu open as long as the slash command is active
          // This prevents it from closing when hovering over other blocks
          return true;
        },
        command: ({ editor, range, props }: any) => {
          const item = props.items[props.selectedIndex];
          if (item) {
            // Call the dismiss callback if it exists
            if (props.dismiss) {
              props.dismiss();
            }
            item.run(editor);
            editor.chain().focus().deleteRange(range).run();
          }
        },
        items: ({ query }: { query: string }) => {
          // Always show all items if no query, otherwise filter
          if (!query || query.trim() === "") {
            return items;
          }
          const lowerQuery = query.toLowerCase();
          return items.filter((item) => 
            item.title.toLowerCase().includes(lowerQuery) || 
            item.subtitle?.toLowerCase().includes(lowerQuery)
          );
        },
        render: () => {
          let component: ReactRenderer | null = null;
          let popup: HTMLDivElement | null = null;
          let manuallyDismissed = false;

          // Click outside handler
          const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            
            // Don't close if clicking inside the popup menu
            if (popup && popup.contains(target)) {
              return;
            }
            
            // Don't close if clicking inside the editor
            const editorElement = document.querySelector('.ProseMirror');
            if (editorElement && editorElement.contains(target)) {
              return;
            }
            
            // Close if clicking truly outside both menu and editor
            manuallyDismissed = true;
            document.removeEventListener('mousedown', handleClickOutside, true);
            if (popup && popup.parentNode) {
              popup.parentNode.removeChild(popup);
            }
            if (component) {
              component.destroy();
            }
          };

          return {
            onStart: (props: any) => {
              manuallyDismissed = false;
              
              // Add dismiss callback to props
              const dismissCallback = () => {
                manuallyDismissed = true;
              };
              
              component = new ReactRenderer(SlashMenu, { 
                props: { ...props, dismiss: dismissCallback }, 
                editor: props.editor 
              });
              popup = document.createElement("div");
              popup.style.position = "fixed";
              popup.style.zIndex = "9999";
              document.body.appendChild(popup);
              
              // Add click outside listener immediately
              // Use capture phase to ensure we catch the event
              requestAnimationFrame(() => {
                document.addEventListener('mousedown', handleClickOutside, true);
              });
              const rect = props.clientRect?.();
              if (rect) {
                // Calculate position with viewport boundary detection
                const menuWidth = 560;
                const menuMaxHeight = 500;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Horizontal positioning: prefer left alignment, but adjust if it goes off-screen
                let left = rect.left;
                if (left + menuWidth > viewportWidth - 20) {
                  // Menu would go off right edge, align to right edge with padding
                  left = Math.max(20, viewportWidth - menuWidth - 20);
                }
                
                // Vertical positioning: prefer below cursor, but flip above if needed
                let top = rect.bottom + 8;
                if (top + menuMaxHeight > viewportHeight - 20) {
                  // Menu would go off bottom, try positioning above
                  top = rect.top - menuMaxHeight - 8;
                  if (top < 20) {
                    // Not enough space above either, position at top with padding
                    top = 20;
                  }
                }
                
                popup.style.left = `${left}px`;
                popup.style.top = `${top}px`;
                popup.replaceChildren(component.element);
              }
            },
            onUpdate: (props: any) => {
              if (!component || !popup) return;
              component.updateProps(props);
              const rect = props.clientRect?.();
              if (!rect) return;
              
              // Calculate position with viewport boundary detection
              const menuWidth = 560;
              const menuMaxHeight = 500;
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;
              
              // Horizontal positioning: prefer left alignment, but adjust if it goes off-screen
              let left = rect.left;
              if (left + menuWidth > viewportWidth - 20) {
                // Menu would go off right edge, align to right edge with padding
                left = Math.max(20, viewportWidth - menuWidth - 20);
              }
              
              // Vertical positioning: prefer below cursor, but flip above if needed
              let top = rect.bottom + 8;
              if (top + menuMaxHeight > viewportHeight - 20) {
                // Menu would go off bottom, try positioning above
                top = rect.top - menuMaxHeight - 8;
                if (top < 20) {
                  // Not enough space above either, position at top with padding
                  top = 20;
                }
              }
              
              popup.style.left = `${left}px`;
              popup.style.top = `${top}px`;
              popup.replaceChildren(component.element);
            },
            onKeyDown: (props: any) => {
              if (!component) return false;
              
              // Handle Escape key
              if (props.event.key === "Escape") {
                manuallyDismissed = true;
                document.removeEventListener('mousedown', handleClickOutside, true);
                if (popup && popup.parentNode) popup.parentNode.removeChild(popup);
                component?.destroy();
                return true;
              }
              
              // Allow default behavior for all other keys
              // This will let the Suggestion plugin handle backspace naturally
              // (closing the menu when slash is deleted)
              return false;
            },
            onExit: () => {
              // Always clean up the click listener
              document.removeEventListener('mousedown', handleClickOutside, true);
              
              // Always exit and clean up when Suggestion plugin calls onExit
              // This happens when slash is deleted or range becomes invalid
              if (popup && popup.parentNode) {
                popup.parentNode.removeChild(popup);
              }
              if (component) {
                component.destroy();
              }
            },
          };
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, ...this.options.suggestion })];
  },
});

export default SlashCommand;


