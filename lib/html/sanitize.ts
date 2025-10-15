// Minimal HTML sanitizer to reduce XSS risk in email previews without external deps.
// This is not a full HTML sanitizer; it targets common vectors used in email previews.

const SCRIPT_TAG_REGEX = /<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi;
const EVENT_HANDLER_ATTR_REGEX = /\son[a-z]+\s*=\s*(["']).*?\1/gi; // onload=, onclick=
const JAVASCRIPT_PROTOCOL_REGEX = /(href|src)\s*=\s*(["'])\s*javascript:[^\2]*\2/gi;

export function sanitizeEmailHtml(input: string): string {
    if (!input) return "";
    let output = input;
    // Remove script tags entirely
    output = output.replace(SCRIPT_TAG_REGEX, "");
    // Remove inline event handlers
    output = output.replace(EVENT_HANDLER_ATTR_REGEX, "");
    // Remove javascript: URLs in href/src
    output = output.replace(JAVASCRIPT_PROTOCOL_REGEX, "$1=\"#\"");
    return output;
}


