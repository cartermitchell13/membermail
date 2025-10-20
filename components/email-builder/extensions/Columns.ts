"use client";

import { Extension, Node, mergeAttributes } from "@tiptap/core";
import type { Editor } from "@tiptap/core";

export type ColumnsCount = 2 | 3;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columns: {
      insertColumns: (options: { count: ColumnsCount }) => ReturnType;
      setColumnsCount: (count: ColumnsCount) => ReturnType;
    };
  }
}

function findParentNodeOfType(editor: Editor, typeName: string): { depth: number; pos: number } | null {
  const { state } = editor;
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === typeName) {
      const pos = $from.before(depth);
      return { depth, pos };
    }
  }
  return null;
}

function widthForCount(count: ColumnsCount): string {
  return count === 3 ? "33.333%" : "50%";
}

const ColumnNode = Node.create({
  name: "column",
  content: "block+",
  defining: true,
  isolating: true,
  selectable: false,
  // Allow clicking into columns without selecting the parent
  atom: false,
  addAttributes() {
    return {
      width: {
        default: null as string | null,
        parseHTML: (element) => (element instanceof HTMLElement ? element.style.width || element.getAttribute("width") || null : null),
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width, style: `vertical-align:top;width:${attrs.width}` } : { style: "vertical-align:top;width:50%" }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "td[data-column]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["td", mergeAttributes({ "data-column": "" }, HTMLAttributes), 0];
  },
});

const ColumnsNode = Node.create({
  name: "columns",
  group: "block",
  content: "column+",
  defining: true,
  isolating: false,
  draggable: true,
  selectable: true,
  // Allow arrow navigation and proper focus management
  allowGapCursor: false,
  addAttributes() {
    return {
      count: {
        default: 2 as ColumnsCount,
        parseHTML: (element) => {
          if (!(element instanceof HTMLElement)) return 2;
          const c = Number(element.getAttribute("data-columns") || 2);
          return c === 3 ? 3 : 2;
        },
        renderHTML: (attrs) => ({ "data-columns": String(attrs.count) }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "table[data-columns]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const count = (node.attrs.count as ColumnsCount) || 2;
    const attrs = mergeAttributes(
      { role: "presentation", class: "mm-columns", cellpadding: "0", cellspacing: "0", width: "100%" },
      HTMLAttributes,
      { "data-columns": String(count) },
    );
    // Children (columns) are rendered inside the <tr> via the 0 placeholder
    return ["table", attrs, ["tr", 0]];
  },
  addCommands() {
    return {
      insertColumns:
        (options) => ({ editor, commands, tr, state }) => {
          const count: ColumnsCount = options.count === 3 ? 3 : 2;
          const width = widthForCount(count);
          const content = Array.from({ length: count }).map(() => ({
            type: "column",
            attrs: { width },
            content: [{ type: "paragraph" }],
          }));
          
          // Insert the columns structure
          const inserted = commands.insertContent({ type: this.name, attrs: { count }, content });
          
          // After insertion, focus into the first column's first paragraph
          if (inserted) {
            // Use a small delay to ensure the DOM is updated
            setTimeout(() => {
              const { state } = editor;
              const { $from } = state.selection;
              
              // Find the columns node we just inserted
              for (let depth = $from.depth; depth >= 0; depth--) {
                const node = $from.node(depth);
                if (node.type.name === this.name) {
                  // Position at the start of the first column's content
                  const pos = $from.before(depth) + 2; // +2 to get inside first column's first paragraph
                  editor.commands.focus(pos);
                  break;
                }
              }
            }, 10);
          }
          
          return inserted;
        },
      setColumnsCount:
        (newCount) => ({ editor, tr, state, dispatch }) => {
          const target = findParentNodeOfType(editor, this.name);
          if (!target) return false;
          const { pos } = target;
          const columnsNode = state.doc.nodeAt(pos);
          if (!columnsNode) return false;
          const currentCount = Math.max(1, columnsNode.childCount);
          const desired: ColumnsCount = newCount === 3 ? 3 : 2;
          if (currentCount === desired && (columnsNode.attrs.count as number) === desired) {
            // Nothing to change
            if (dispatch) dispatch(tr);
            return true;
          }

          const schema = state.schema;
          const colType = schema.nodes.column;
          const paraType = schema.nodes.paragraph;
          if (!colType || !paraType) return false;

          const width = widthForCount(desired);

          // Collect existing columns
          const cols: any[] = [];
          for (let i = 0; i < columnsNode.childCount; i++) {
            const c = columnsNode.child(i);
            cols.push(c);
          }

          let newCols: any[] = [];
          if (desired === 3) {
            if (cols.length === 3) {
              newCols = cols.map((c) => colType.create({ width }, c.content));
            } else if (cols.length === 2) {
              const empty = colType.create({ width }, paraType.create());
              newCols = [
                colType.create({ width }, cols[0].content),
                colType.create({ width }, cols[1].content),
                empty,
              ];
            } else {
              // Fallback: create exactly 3 with last empty
              const base = colType.create({ width }, paraType.create());
              newCols = [base, base.copy(base.content), base.copy(base.content)];
            }
          } else {
            // desired === 2
            if (cols.length >= 2) {
              const first = cols[0];
              const second = cols[1];
              let mergedSecond = second;
              if (cols.length > 2) {
                const last = cols[2];
                const mergedContent = second.content.append(last.content);
                mergedSecond = colType.create({ width }, mergedContent);
              } else {
                mergedSecond = colType.create({ width }, second.content);
              }
              newCols = [colType.create({ width }, first.content), mergedSecond];
            } else if (cols.length === 1) {
              newCols = [colType.create({ width }, cols[0].content), colType.create({ width }, paraType.create())];
            } else {
              const base = colType.create({ width }, paraType.create());
              newCols = [base, base.copy(base.content)];
            }
          }

          const newColumnsNode = schema.nodes.columns.create({ count: desired }, newCols);
          if (dispatch) {
            tr = tr.replaceWith(pos, pos + columnsNode.nodeSize, newColumnsNode);
            dispatch(tr);
          }
          return true;
        },
    };
  },
});

const Columns = Extension.create({
  name: "columnsExtension",
  addExtensions() {
    return [ColumnsNode, ColumnNode];
  },
});

export default Columns;


