import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB
const BUCKET = "email-assets";
const ALLOWED_MIME = new Set([
	"image/png",
	"image/jpeg",
	"image/jpg",
	"image/gif",
	"image/webp",
	"image/svg+xml",
]);

function getExtFromMime(mime: string): string | null {
	const map: Record<string, string> = {
		"image/png": "png",
		"image/jpeg": "jpg",
		"image/jpg": "jpg",
		"image/gif": "gif",
		"image/webp": "webp",
		"image/svg+xml": "svg",
	};
	return map[mime] ?? null;
}

async function ensureBucket() {
	const admin = getAdminSupabaseClient();
	// Best-effort create; ignore if it already exists
	await admin.storage.createBucket(BUCKET, { public: true }).catch(() => undefined);
}

export async function POST(req: NextRequest) {
	const form = await req.formData().catch(() => null);
	if (!form) return new Response("Bad Request", { status: 400 });
	const file = form.get("file") as File | null;
	if (!file) return new Response("Missing file", { status: 400 });

	if (!ALLOWED_MIME.has(file.type)) {
		return new Response("Unsupported file type", { status: 415 });
	}
	if (file.size > MAX_BYTES) {
		return new Response("File too large (max 4MB)", { status: 413 });
	}

	// Resolve a stable user or fallback to mm_uid cookie
	let uid: string | null = null;
	try {
		const supabase = await getServerSupabaseClient();
		const { data } = await supabase.auth.getUser();
		uid = data.user?.id ?? null;
	} catch {
		// ignore
	}

	const cookieStore = await cookies();
	if (!uid) {
		let cookieUid = cookieStore.get("mm_uid")?.value;
		if (!cookieUid) {
			cookieUid = (globalThis as any).crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
			cookieStore.set({ name: "mm_uid", value: cookieUid, httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
		}
		uid = cookieUid;
	}

	const ext = getExtFromMime(file.type);
	if (!ext) return new Response("Unsupported extension", { status: 415 });

	await ensureBucket();
	const admin = getAdminSupabaseClient();

	const arrayBuffer = await file.arrayBuffer();
	// Convert to Buffer for Node runtime
	const buffer = Buffer.from(arrayBuffer);
	const id = (globalThis as any).crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
	const objectPath = `${uid}/${id}.${ext}`;

	const { error: uploadErr } = await admin.storage
		.from(BUCKET)
		.upload(objectPath, buffer, { contentType: file.type, upsert: false });
	if (uploadErr) {
		return new Response("Upload failed", { status: 500 });
	}

	const { data } = admin.storage.from(BUCKET).getPublicUrl(objectPath);
	return Response.json({ url: data.publicUrl });
}


