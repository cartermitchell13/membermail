# AI Image Generation Setup Guide

## Overview

The newsletter builder now supports **smart placeholder images** with AI generation using Google Gemini 2.0 Flash with image generation capabilities. When users generate newsletters with AI, the system will insert placeholder images with suggested prompts that can be generated on-demand.

## ✅ What's Been Implemented

1. **Enhanced AI Newsletter System Prompt**
   - AI now generates image placeholder nodes with detailed prompts
   - Placeholders include `suggestedPrompt`, `alt`, and `isPlaceholder` attributes

2. **Gemini Image Generation API Endpoint**
   - Location: `/app/api/ai/generate-image/route.ts`
   - Accepts: `{ prompt: string, aspectRatio: string }`
   - Returns: `{ url: string, metadata: {...} }`

3. **Custom TipTap Image Extension**
   - Location: `/components/email-builder/extensions/ImageWithPlaceholder.ts`
   - Supports both regular images and placeholder images
   - Uses React NodeView for interactive placeholder UI

4. **Placeholder UI Component**
   - Location: `/components/email-builder/ui/ImagePlaceholderView.tsx`
   - Shows dashed border with "Generate with AI" button
   - Expandable dialog for editing prompts and selecting aspect ratio
   - Options to generate, upload, or remove placeholder

5. **Updated Editor Configuration**
   - Replaced standard Image extension with ImageWithPlaceholder
   - All existing image functionality preserved

## 🚀 Setup Instructions

### Step 1: Install Required Package

The `@google/genai` SDK has been installed automatically. If you need to reinstall:

```bash
npm install @google/genai
```

### Step 2: Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy the generated API key

**Note:** Gemini API has a free tier with generous limits. Check [pricing here](https://ai.google.dev/pricing).

### Step 3: Add Environment Variable

Add your Gemini API key to your `.env.local` file:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

**Important:** This environment variable has already been added to the schema in `/lib/env.ts`, so no code changes are needed.

### Step 3: Test the Implementation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Create a new campaign

3. Open the AI compose dialog

4. Enter a prompt like: "Create a newsletter about a new drum kit release"

5. The AI should generate a newsletter with 1-2 image placeholders

6. Click "Generate with AI" on any placeholder to create the image

## 📝 How It Works

### User Flow

1. **Generate Newsletter** → AI creates content with image placeholders
2. **Review Placeholders** → See suggested prompts for each image
3. **Generate or Skip** → Click to generate, upload your own, or remove
4. **Refine Prompt** → Edit the suggested prompt before generating
5. **Select Aspect Ratio** → Choose 16:9, 1:1, 4:3, or 3:4
6. **Image Inserted** → Generated image replaces placeholder

### API Response Structure

The Gemini API currently returns base64-encoded images. The implementation uses data URLs for immediate display.

**For Production:** You should upload generated images to permanent storage (Supabase Storage, S3, etc.). See commented code in `/app/api/ai/generate-image/route.ts` for an example.

## 🔧 Customization Options

### Adjust Number of Images

In `/app/api/ai/newsletter/route.ts`, line 148:

```typescript
// Current: "Use 1-2 strategic images per newsletter, not too many."
// Customize as needed for your use case
```

### Change Default Aspect Ratio

In `/components/email-builder/ui/ImagePlaceholderView.tsx`, line 23:

```typescript
const [aspectRatio, setAspectRatio] = useState<string>("16:9"); // Change default here
```

### Modify Prompt Instructions

In `/app/api/ai/newsletter/route.ts`, line 148:

Edit the prompt instructions to guide the AI toward different image styles, e.g.:
- "Use photorealistic images only"
- "Prefer illustrations and graphics"
- "Include brand colors in all images"

## 🎨 Storage Integration (Recommended for Production)

The current implementation uses data URLs, which work but have limitations:
- Large in size (base64 encoding)
- Not cacheable
- Stored in the document JSON

### Supabase Storage Integration

Uncomment and configure the code in `/app/api/ai/generate-image/route.ts` (lines 88-113):

1. Create a storage bucket: `campaign-images`
2. Set bucket to public
3. Update the bucket name in the code
4. The API will automatically upload and return public URLs

### Alternative Storage Solutions

- **AWS S3**: Use `aws-sdk` package
- **Cloudinary**: Use `cloudinary` package
- **Vercel Blob**: Use `@vercel/blob` package

## 📊 Cost Considerations

**Gemini Imagen Pricing (as of 2024):**
- Free tier: 50 images/day
- Paid tier: ~$0.04 per image (check current pricing)

**Recommendations:**
- Enable generation only for paid users
- Add rate limiting to prevent abuse
- Cache popular generated images
- Offer image upload as alternative

## 🐛 Troubleshooting

### "GEMINI_API_KEY not configured"
- Make sure you added the key to `.env.local`
- Restart your dev server after adding env variables

### "Invalid API key"
- Verify the key is correct in Google AI Studio
- Check for extra spaces or characters

### "Rate limit exceeded"
- You've hit the free tier limit (50/day)
- Wait 24 hours or upgrade to paid tier

### Images not showing in editor
- Check browser console for errors
- Verify the NodeView is rendering (React DevTools)
- Make sure data URLs are valid

## 🎯 Next Steps

1. **Add Storage Integration** - Move from data URLs to permanent storage
2. **Rate Limiting** - Add user-based rate limits for image generation
3. **Image Library** - Cache and reuse popular generated images
4. **Style Presets** - Add brand-specific style options
5. **Batch Generation** - Allow generating all placeholders at once
6. **Image Editing** - Add basic editing tools (crop, resize, filters)

## 📚 Related Documentation

- [Google Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Imagen API Reference](https://ai.google.dev/gemini-api/docs/image-generation)
- [TipTap NodeView Guide](https://tiptap.dev/guide/node-views/react)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)

---

## Summary

✅ **Implementation Complete** - Core functionality is ready to use  
🔑 **Action Required** - Add `GEMINI_API_KEY` to `.env.local`  
🚀 **Production Ready** - Add storage integration for production use  
💰 **Cost Effective** - Free tier covers most development needs  

Enjoy building better newsletters with AI-powered image generation! 🎨
