import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { GoogleGenAI } from "@google/genai";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * API endpoint for generating images using Google Gemini
 * This endpoint accepts a text prompt and returns a generated image URL
 */
export async function POST(req: NextRequest) {
	try {
		// Parse request body
		const body = await req.json().catch(() => ({}));
		const prompt = String(body?.prompt || "").trim();
		const aspectRatio = String(body?.aspectRatio || "16:9");

		console.log("=== IMAGE GENERATION REQUEST ===");
		console.log("Prompt:", prompt);
		console.log("Aspect Ratio:", aspectRatio);
		console.log("API Key present:", !!env.GEMINI_API_KEY);

		// Validate inputs
		if (!prompt) {
			return new Response("Missing prompt", { status: 400 });
		}

		if (!env.GEMINI_API_KEY) {
			return new Response("GEMINI_API_KEY not configured", { status: 500 });
		}

		// Validate aspect ratio
		const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
		if (!validAspectRatios.includes(aspectRatio)) {
			return new Response("Invalid aspect ratio. Must be one of: 1:1, 3:4, 4:3, 9:16, 16:9", { status: 400 });
		}

		// Initialize Google GenAI client with API key
		const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

		console.log("[Image Generation] Calling Gemini API...");

		// Generate content with image
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash-image",
			contents: prompt,
			config: {
				responseModalities: ["Image"],
				imageConfig: {
					aspectRatio: aspectRatio,
				},
			},
		});

		console.log("[Image Generation] Response received");
		console.log("[Image Generation] Candidates:", response.candidates?.length || 0);

		// Extract the generated image from response
		if (!response.candidates || response.candidates.length === 0) {
			console.error("No candidates in response");
			return new Response("No image data returned from API", { status: 502 });
		}

		// Find the image part in the response
		const parts = response.candidates[0]?.content?.parts || [];
		const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith("image/"));

		if (!imagePart?.inlineData?.data) {
			console.error("No image found in parts");
			return new Response("No image data in API response", { status: 502 });
		}

		// The image is returned as base64-encoded data
		const imageBase64 = imagePart.inlineData.data;
		const mimeType = imagePart.inlineData.mimeType || "image/png";

		console.log("[Image Generation] Successfully extracted image, mimeType:", mimeType);
		
		// Upload to Supabase Storage for permanent hosting
		const supabase = getAdminSupabaseClient();
		
		// Convert base64 to buffer
		const buffer = Buffer.from(imageBase64, 'base64');
		
		// Generate unique filename with extension based on mime type
		const extension = mimeType.split('/')[1] || 'png';
		const fileName = `generated-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
		
		console.log("[Image Generation] Uploading to storage:", fileName);
		
		// Upload to storage bucket (same bucket as manually uploaded images)
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from('email-assets')
			.upload(fileName, buffer, {
				contentType: mimeType,
				cacheControl: '3600',
				upsert: false,
			});
		
		if (uploadError) {
			console.error("[Image Generation] Upload error:", uploadError);
			return new Response(`Failed to upload image: ${uploadError.message}`, { status: 500 });
		}
		
		console.log("[Image Generation] Upload successful:", uploadData.path);
		
		// Get public URL
		const { data: { publicUrl } } = supabase.storage
			.from('email-assets')
			.getPublicUrl(fileName);
		
		console.log("[Image Generation] Public URL:", publicUrl);
		
		// Return the public HTTPS URL (not base64)
		return Response.json({
			url: publicUrl,
			metadata: {
				prompt: prompt,
				aspectRatio: aspectRatio,
				generatedAt: new Date().toISOString(),
				storagePath: uploadData.path,
			}
		});

	} catch (error) {
		console.error("Image generation error:", error);
		
		// Handle rate limit errors specifically
		if (error instanceof Error && error.message.includes("exceeded your current quota")) {
			return new Response(
				"Rate limit exceeded. Please wait a few seconds and try again, or upgrade your Gemini API plan for higher limits.",
				{ status: 429 }
			);
		}
		
		const message = error instanceof Error ? error.message : "Failed to generate image";
		return new Response(message, { status: 500 });
	}
}
