import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { getSubscriptionAccess } from "@/lib/subscriptions/access";

const ALLOWED_NODE_TYPES = new Set([
	"doc",
	"paragraph",
	"text",
	"heading",
	"blockquote",
	"bulletList",
	"orderedList",
	"listItem",
	"image",
	"youtube",
	"horizontalRule",
	"cta",
	"columns",
	"column",
	"variable",
 	// NOTE: The system prompt instructs the model to optionally emit a `linkPlaceholder` block
 	// node with attrs { suggestedText }. We include it here so validator accepts it.
 	"linkPlaceholder",
]);

// Additional attributes allowed on image nodes for AI-generated placeholders
const ALLOWED_IMAGE_ATTRS = new Set([
	"src",
	"alt",
	"title",
	"width",
	"height",
	"suggestedPrompt",
	"isPlaceholder",
]);

const ALLOWED_MARK_TYPES = new Set([
	"bold",
	"italic",
	"strike",
	"code",
	"underline",
	"link",
]);

// Minimal validator utilities (avoid zod to prevent runtime conflicts)
function isRecord(value: any): value is Record<string, any> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function validateAllowedNodes(node: any): boolean {
	if (!node || typeof node !== "object") return false;
	const type = String(node.type || "");
	if (!ALLOWED_NODE_TYPES.has(type)) return false;
	if (node.marks && Array.isArray(node.marks)) {
		for (const m of node.marks) {
			if (!m || typeof m !== "object") return false;
			const mt = String(m.type || "");
			if (!ALLOWED_MARK_TYPES.has(mt)) return false;
			if (mt === "link") {
				const href = m.attrs?.href;
				if (href && typeof href !== "string") return false;
			}
		}
	}
	if (type === "text") return typeof node.text === "string";

	// columns -> column+
	if (type === "columns") {
		const count = Number(node.attrs?.count ?? 2);
		if (![2, 3].includes(count)) return false;
		if (!Array.isArray(node.content) || node.content.length !== count) return false;
		for (const child of node.content) {
			if (!validateAllowedNodes(child)) return false;
			if (child.type !== "column") return false;
		}
		return true;
	}

	if (type === "column") {
		// columns validate children below, but enforce blocks here by recursive check
		if (node.content && Array.isArray(node.content)) {
			for (const child of node.content) {
				if (!validateAllowedNodes(child)) return false;
			}
		}
	}
	if (node.content && Array.isArray(node.content)) {
		for (const child of node.content) {
			if (!validateAllowedNodes(child)) return false;
		}
	}
	if (type === "heading") {
		const lvl = node.attrs?.level;
		if (lvl !== undefined && ![1, 2, 3].includes(Number(lvl))) return false;
	}
	if (type === "cta") {
		const v = node.attrs?.variant;
		const a = node.attrs?.align;
		if (v && ["primary", "secondary", "outline"].includes(String(v)) === false) return false;
		if (a && ["left", "center", "right"].includes(String(a)) === false) return false;
		const href = node.attrs?.href;
		if (href && typeof href !== "string") return false;
	}
	// Validate linkPlaceholder block nodes produced by the model when it suggests adding a link
	// without knowing the final URL. It should include a string `suggestedText` and typically has no content.
	if (type === "linkPlaceholder") {
		// Ensure attrs exist and suggestedText is a non-empty string
		const st = node.attrs?.suggestedText;
		if (typeof st !== "string" || st.trim().length === 0) return false;
	}
	if (type === "variable") {
		const varType = node.attrs?.type;
		if (varType && !["name", "email", "username", "company_name"].includes(String(varType))) return false;
	}
	if (type === "image") {
		// Validate image attributes
		if (node.attrs) {
			for (const key of Object.keys(node.attrs)) {
				if (!ALLOWED_IMAGE_ATTRS.has(key)) return false;
			}
			// If isPlaceholder is true, suggestedPrompt should be present
			if (node.attrs.isPlaceholder === true) {
				if (!node.attrs.suggestedPrompt || typeof node.attrs.suggestedPrompt !== "string") return false;
			}
		}
	}
	return true;
}

function isValidDoc(doc: any): doc is { type: "doc"; content: any[] } {
    if (!isRecord(doc)) return false;
    if (doc.type !== "doc") return false;
    if (doc.content === undefined) return true; // allow empty content by default
    if (!Array.isArray(doc.content)) return false;
    for (const n of doc.content) {
        if (!validateAllowedNodes(n)) return false;
    }
    return true;
}

const SYSTEM_PROMPT = `You are a newsletter writing assistant.

RESPONSE FORMATS:
1. GENERATE mode (new document): { "doc": <tiptapDoc> }
2. EDIT mode (selected text): { "editedContent": "<html>" }
3. SMART EDIT mode (Cursor-style): { "structuredEdits": [ { nodePath, action, newNode } ] }

Do not add code fences or extra text. Do NOT output Markdown (no **bold** or 1. item inline).

IMPORTANT: Include 1-2 image placeholders in EVERY newsletter for visual appeal.

<tiptapDoc> must be a Tiptap JSON document with:
- Root { type: "doc", content: Node[] }
- Allowed nodes: doc, paragraph, text, heading(level 1-3), blockquote, bulletList, orderedList, listItem, image, youtube, horizontalRule, cta, columns, column, variable, linkPlaceholder
- Allowed marks: bold, italic, strike, code, underline, link(href)
- Headings: use level 1 for the title, level 2 for sections, level 3 for small subsections
- Lists: use orderedList/bulletList with listItem children. Each listItem wraps a paragraph. NEVER put numbered text inside a paragraph.
- Columns: when presenting side-by-side content (features, highlights, stats), use { type: "columns", attrs: { count: 2|3 }, content: [ { type: "column", content: Block[] }, ... ] }. Use 2 columns most often.
- Line breaks: avoid hard line breaks inside a paragraph; use multiple paragraphs and lists instead.
- Sectioning: insert a horizontalRule between major sections where helpful.
- CTA: near the end, include a cta node with attrs { href, variant: "primary"|"secondary"|"outline", align: "center" preferred } and button label as its text content.
- Links: use the link mark with { href } on text ranges; use HTTPS urls.
- Link Placeholders: When you want to suggest a link but don't have the exact URL, use { type: "linkPlaceholder", attrs: { suggestedText: "text for the link" } } as a block node. This creates an interactive placeholder where the user can enter the URL. Example: { type: "linkPlaceholder", attrs: { suggestedText: "Read the full article" } }. Use sparingly, only when a link would be valuable but the URL isn't known.
- Variables: for personalization, use { type: "variable", attrs: { type: "name"|"email"|"username"|"company_name" } } inline nodes. These will be replaced with actual member data. Use naturally in greetings or signatures. Example: { type: "variable", attrs: { type: "name" } } for member's name.
- Images: When an image would enhance the content (hero images, product showcases, feature highlights), insert an image placeholder node with a detailed generation prompt. IMPORTANT: Leave src empty and set isPlaceholder to true. Provide a detailed, specific suggestedPrompt that describes the desired image in detail. Example: { type: "image", attrs: { src: "", alt: "Modern drum kit in professional studio", suggestedPrompt: "Professional product photo of a modern electronic drum kit in a dark moody music studio, studio lighting, wide angle shot, high quality, 16:9 aspect ratio, cinematic", isPlaceholder: true } }. The suggestedPrompt should include: subject, setting/environment, lighting, style/mood, technical specs (aspect ratio, quality). Use 1-2 strategic images per newsletter, not too many.
- Keep paragraphs short (1-3 sentences) and skimmable.

Example showing IMAGE PLACEHOLDER (REQUIRED):
{
  "doc": {
    "type": "doc",
    "content": [
      { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Weekly Update" }] },
      { "type": "image", "attrs": { "src": "", "alt": "Hero image for newsletter", "suggestedPrompt": "Modern abstract background with geometric shapes, gradient colors, professional, clean, 16:9 aspect ratio, high quality", "isPlaceholder": true } },
      { "type": "paragraph", "content": [{ "type": "text", "text": "Hi " }, { "type": "variable", "attrs": { "type": "name" } }, { "type": "text", "text": "," }] },
      { "type": "paragraph", "content": [{ "type": "text", "text": "Quick highlights from this week." }] },
      { "type": "columns", "attrs": { "count": 2 }, "content": [
        { "type": "column", "content": [ { "type": "heading", "attrs": { "level": 3 }, "content": [{ "type": "text", "text": "Feature A" }] }, { "type": "paragraph", "content": [{ "type": "text", "text": "Short blurb." }] } ] },
        { "type": "column", "content": [ { "type": "heading", "attrs": { "level": 3 }, "content": [{ "type": "text", "text": "Feature B" }] }, { "type": "paragraph", "content": [{ "type": "text", "text": "Short blurb." }] } ] }
      ] },
      { "type": "horizontalRule" },
      { "type": "cta", "attrs": { "href": "https://example.com/join", "variant": "primary", "align": "center" }, "content": [{ "type": "text", "text": "Join the Beta" }] }
    ]
  }
}
`;

export async function POST(req: NextRequest) {
	let body: any;
	try {
		body = await req.json();
	} catch {
        return new Response("Invalid JSON", { status: 400 });
	}
	const prompt = String(body?.prompt || "").trim();
	if (!prompt) return new Response("Missing prompt", { status: 400 });
	if (!env.OPENAI_API_KEY) return new Response("OPENAI_API_KEY not configured", { status: 400 });

	const companyId = typeof body?.companyId === "string" ? body.companyId : null;
	const access = await getSubscriptionAccess({ companyId });
	if (!access.canUseAI) {
		return Response.json(
			{
				success: false,
				error: "AI features require a Pro or Enterprise subscription",
				tier: access.tier,
			},
			{ status: 402 },
		);
	}

	// Extract context for iterative editing
	const mode = body?.mode || "generate"; // generate | edit | insert
	const selectedText = body?.selectedText || null;
	const currentContent = body?.currentContent || null;
	const editorJson = body?.editorJson || null; // Tiptap JSON structure for surgical edits
	const conversationHistory = body?.conversationHistory || []; // Previous messages for context

	// Build context-aware user prompt based on mode
	let userPrompt: string;
	
	// Determine if we should use smart editing (Cursor-style)
	// Use smart edit when: no selection, but has conversation history and existing content
	const useSmartEdit = !selectedText && conversationHistory.length > 0 && editorJson && mode === "generate";
	
	if (useSmartEdit) {
		// Smart edit mode: AI identifies and edits specific nodes (like Cursor)
		userPrompt = `You are helping iteratively edit a newsletter. The user is making a request WITHOUT selecting specific text, so you need to intelligently identify what to change.

CURRENT DOCUMENT STRUCTURE (Tiptap JSON):
${JSON.stringify(editorJson, null, 2)}

USER'S REQUEST: ${prompt}

YOUR TASK:
Analyze the document structure and identify which specific node(s) need to be edited based on the user's request.

Return format:
{
  "structuredEdits": [
    {
      "nodePath": [2, 1],  // Array of indices: doc.content[2].content[1]
      "action": "replace",  // "replace", "delete", or "insertAfter"
      "newNode": { type: "paragraph", content: [...] }  // Tiptap node
    }
  ],
  "explanation": "Changed tip #3 to focus on time blocking. Want me to update the others too?"
}

EXPLANATION GUIDELINES:
- Be specific about what changed: "Changed tip #3..." not "Updated content"
- Be concise but friendly: conversational, not robotic
- Sometimes (not always) add a contextual follow-up question that makes sense
- Vary your phrasing - don't be repetitive

GOOD EXAMPLES:
- "Changed tip #3 from the 20-5 rule to time blocking. Want me to adjust any of the others?"
- "Made the title shorter (12 → 6 words). Better, or should I trim more?"
- "Removed the CTA as requested."
- "Added a PS at the end with a personal touch. Should I make it more casual?"
- "Made the second paragraph more conversational and added some humor."

BAD EXAMPLES:
- "I've updated your newsletter based on your request." (too generic)
- "Done! Let me know if you need anything else!" (too needy)
- "I changed what you asked for. Is there anything else?" (robotic)

Be precise - only edit what the user asks for. Don't rewrite the whole document.`;
	} else if (mode === "generate" && conversationHistory.length === 0) {
		// Fresh generation from scratch
		userPrompt = `Write an email newsletter. Audience: general members. Tone: clear, friendly, professional.

User prompt: ${prompt}

REQUIRED: Include 1-2 image placeholder nodes with detailed suggestedPrompt attributes. Place images strategically (after title, before sections, etc.).

Return format:
{
  "doc": <tiptapDoc>,
  "explanation": "Created a newsletter about [topic] with [#] sections. Want me to adjust the tone or length?"
}

Make the explanation conversational and specific - mention what you created.`;

	} else if (mode === "edit" && selectedText) {
		// Edit selected text - return just the edited fragment
		userPrompt = `You are helping edit a newsletter. The user has selected this specific text that needs to be rewritten:

SELECTED TEXT TO MODIFY:
"${selectedText}"

USER'S EDITING INSTRUCTION (this is a command, NOT content to include):
"${prompt}"

CONTEXT (full newsletter for reference only):
${currentContent ? `${currentContent}` : "(empty document)"}

YOUR TASK:
1. Take the SELECTED TEXT above
2. Follow the USER'S EDITING INSTRUCTION to modify it
3. Return ONLY the rewritten version of that selected text
4. Do NOT write a new newsletter
5. Do NOT mention the user's instruction in the output
6. Do NOT write about what the user said - just apply their edits

EXAMPLE:
If selected text is: "Try the 20-5 rule: work 20 minutes, break 5 minutes"
And instruction is: "give a different quick tip instead"
Return: "Try the Pomodoro technique: work 25 minutes, then take a 5-minute break"
(Notice: We replaced the tip, we did NOT write "You don't like the 20-5 rule...")

Return format: 
{ 
  "editedContent": "<p>Your rewritten text here...</p>",
  "explanation": "Replaced the 20-5 rule with a tip about the Pomodoro technique."
}

Use proper HTML tags. Keep similar structure to the original (if it was 2 paragraphs, return 2 paragraphs).

EXPLANATION: Be specific but concise. Sometimes add a contextual follow-up question. Examples:
- "Made your selection more casual and conversational."
- "Shortened this from 3 sentences to 1. Too terse?"
- "Added humor and made it more engaging. Want me to dial it back?"
- "Rewrote this to focus on time blocking instead."`;


	} else if (mode === "insert" && selectedText) {
		// Insert new content after selection
		userPrompt = `The user has this content in their newsletter:
"${selectedText}"

They want you to insert new content after this section based on: ${prompt}

Current full newsletter content for context:
${currentContent ? `<currentContent>${currentContent}</currentContent>` : "(empty document)"}

Return a complete newsletter document with new content intelligently inserted after the selected portion. Maintain flow and coherence.

Return only JSON as specified.`;
	} else {
		// Fallback: treat as refinement of entire document
		userPrompt = `The user has this newsletter:
${currentContent || "(empty document)"}

They want you to improve it based on: ${prompt}

Return an improved version of the complete newsletter as JSON.`;
	}

    try {
        // Build messages array with conversation history
        const messages: any[] = [
            { role: "system", content: SYSTEM_PROMPT },
        ];

        // Add conversation history if present
        if (conversationHistory.length > 0) {
            messages.push(...conversationHistory);
        }

        // Add current user prompt
        messages.push({ role: "user", content: userPrompt });

        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-5",
                response_format: { type: "json_object" },
                messages,
            }),
        });
        const raw = await resp.text();
        if (!resp.ok) {
            // Surface OpenAI error details for debugging
            return new Response(raw || "AI error", { status: resp.status });
        }
        let completion: any;
        try {
            completion = JSON.parse(raw);
        } catch {
            return new Response("AI response parse error", { status: 502 });
        }
        const content = completion?.choices?.[0]?.message?.content?.trim() || "";
		if (!content) return new Response("Empty response", { status: 502 });
        let json: any;
        try {
            json = JSON.parse(content);
        } catch {
            return new Response("Non-JSON response from AI", { status: 502 });
        }
        
        // Debug logging to help troubleshoot
        console.log("[AI Newsletter] Generated response:");
        console.log(JSON.stringify(json, null, 2));
        
        // Handle different response types based on mode
        if (json.structuredEdits && Array.isArray(json.structuredEdits)) {
            // Smart edit mode: return node-path-based edits
            console.log(`[AI Newsletter] Returning ${json.structuredEdits.length} structured edit(s)`);
            return Response.json({ 
                structuredEdits: json.structuredEdits,
                explanation: json.explanation || "I've updated your newsletter based on your request."
            });
        } else if (mode === "edit" && json.editedContent) {
            // Edit mode: return edited HTML fragment
            if (typeof json.editedContent !== "string") {
                console.error("[AI Newsletter] editedContent must be a string");
                return new Response("Invalid editedContent format", { status: 422 });
            }
            console.log(`[AI Newsletter] Returning edited HTML fragment (${json.editedContent.length} chars)`);
            return Response.json({ 
                editedContent: json.editedContent,
                explanation: json.explanation || "Updated your selection."
            });
        } else if (json.doc) {
            // Generate/Insert mode: return full Tiptap document
            if (!isRecord(json) || !isValidDoc(json.doc)) {
                console.error("[AI Newsletter] Document validation failed");
                return new Response("Invalid document", { status: 422 });
            }
            
            // Count image placeholders
            let imagePlaceholderCount = 0;
            const countImages = (node: any) => {
                if (node.type === "image" && node.attrs?.isPlaceholder) {
                    imagePlaceholderCount++;
                }
                if (node.content && Array.isArray(node.content)) {
                    node.content.forEach(countImages);
                }
            };
            if (json.doc?.content) {
                json.doc.content.forEach(countImages);
            }
            console.log(`[AI Newsletter] Found ${imagePlaceholderCount} image placeholders`);
            
            return Response.json({ 
                doc: json.doc,
                explanation: json.explanation || "Created your newsletter!"
            });
        } else {
            console.error("[AI Newsletter] Response missing both doc and editedContent");
            return new Response("Invalid response format", { status: 422 });
        }
	} catch (err) {
        const message = err instanceof Error ? err.message : "AI error";
        return new Response(message, { status: 500 });
	}
}


