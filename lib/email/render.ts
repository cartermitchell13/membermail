type Block =
  | { type: "section"; background?: string; padding?: number; children?: Block[] }
  | { type: "text"; html: string; align?: "left" | "center" | "right"; color?: string }
  | { type: "image"; src: string; alt?: string; width?: number; align?: "left" | "center" | "right" }
  | { type: "button"; label: string; url: string; color?: string; radius?: number; align?: "left" | "center" | "right" }
  | { type: "divider"; color?: string; thickness?: number; spacing?: number }
  | { type: "spacer"; height?: number }
  | { type: "columns"; columns: Array<{ width?: string; children?: Block[] }> };

type EmailDoc = {
  type: "email";
  version: number;
  theme?: {
    primary?: string;
    fontFamily?: string;
    radius?: number;
    textColor?: string;
    background?: string;
  };
  body: Block[];
};

function escAttr(s: string) {
  return s.replace(/"/g, "&quot;");
}

function renderAlign(align?: "left" | "center" | "right") {
  if (align === "center") return "margin:0 auto;text-align:center;";
  if (align === "right") return "margin-left:auto;text-align:right;";
  return "";
}

function renderBlocks(blocks: Block[], theme: Required<NonNullable<EmailDoc["theme"]>>): string {
  return blocks.map((b) => renderBlock(b, theme)).join("");
}

function renderBlock(block: Block, theme: Required<NonNullable<EmailDoc["theme"]>>): string {
  switch (block.type) {
    case "section": {
      const pad = Math.max(0, block.padding ?? 24);
      const bg = block.background ?? "#141414";
      return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bg}"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:${bg};padding:${pad}px">
    <tr><td style="text-align:left">
      ${renderBlocks(block.children ?? [], theme)}
    </td></tr>
  </table>
</td></tr></table>`;
    }
    case "text": {
      const color = block.color ?? theme.textColor;
      const align = renderAlign(block.align);
      return `<div style="${align}color:${color};font-family:${escAttr(theme.fontFamily)};line-height:1.6">${block.html}</div>`;
    }
    case "image": {
      const width = block.width ?? 560;
      const align = renderAlign(block.align);
      const alt = escAttr(block.alt ?? "");
      return `<div style="${align}"><img src="${escAttr(block.src)}" alt="${alt}" width="${width}" style="display:block;max-width:100%;height:auto;border:0;" /></div>`;
    }
    case "button": {
      const radius = block.radius ?? theme.radius;
      const color = block.color ?? theme.primary;
      const align = renderAlign(block.align);
      return `
<table role="presentation" cellpadding="0" cellspacing="0" style="${align}"><tr><td>
  <a href="${escAttr(block.url)}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:10px 16px;border-radius:${radius}px;font-weight:600;font-family:${escAttr(theme.fontFamily)}">${escAttr(block.label)}</a>
</td></tr></table>`;
    }
    case "divider": {
      const height = Math.max(1, block.thickness ?? 1);
      const color = block.color ?? "#1f2937";
      const spacing = Math.max(0, block.spacing ?? 16);
      return `<div style="height:${spacing}px"></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-bottom:${height}px solid ${color};line-height:0;font-size:0;">&nbsp;</td></tr></table><div style="height:${spacing}px"></div>`;
    }
    case "spacer": {
      const h = Math.max(0, block.height ?? 16);
      return `<div style="height:${h}px;line-height:${h}px;font-size:0;">&nbsp;</div>`;
    }
    case "columns": {
      const cols = block.columns ?? [];
      // 1–2 columns, stack on mobile via width 100%
      const inner = cols.map((c) => {
        const width = c.width ?? "50%";
        return `<td width="${escAttr(width)}" style="vertical-align:top;padding:0 16px">${renderBlocks(c.children ?? [], theme)}</td>`;
      }).join("");
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${inner}</tr></table>`;
    }
  }
}

export function renderEmail(doc: EmailDoc): string {
  const theme: Required<NonNullable<EmailDoc["theme"]>> = {
    primary: doc.theme?.primary ?? "#FA4616",
    fontFamily: doc.theme?.fontFamily ?? "Geist, Arial, Helvetica, sans-serif",
    radius: doc.theme?.radius ?? 8,
    textColor: doc.theme?.textColor ?? "#eaeaea",
    background: doc.theme?.background ?? "#0b0b0b",
  };

  const body = renderBlocks(doc.body ?? [], theme);
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.background};color:${theme.textColor}"><tr><td align="center">
  ${body}
</td></tr></table>`;
}

export type { EmailDoc, Block };


