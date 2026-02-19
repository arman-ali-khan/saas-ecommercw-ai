'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

// 1. INITIALIZE ONCE (Outside the function)
// This is the most important change for Next.js stability.
const ai = genkit({
    plugins: [
        googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })
    ],
});

// --- SCHEMAS (Kept as you had them) ---
const GenerateProductDescriptionInputSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    categories: z.array(z.string()).optional(),
    origin: z.string().optional(),
});

function extractJson(text: string) {
    try {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON found');
        return text.substring(firstBrace, lastBrace + 1);
    } catch (e) {
        return null;
    }
}

/**
 * Generates description
 */
export async function generateProductDescription(input: any) {
    try {
        // Ensure the env var is actually there
        if (!process.env.GOOGLE_GENAI_API_KEY) {
            throw new Error("SERVER_CONFIG_ERROR: Missing API Key");
        }

        const { name, description, categories, origin } = input;
        const categoryString = categories?.length ? categories.join(', ') : 'সাধারণ';

        const prompt = `You are a premium e-commerce copywriter for "Bangla Naturals"... 
        [Rest of your prompt] ... 
        FORMAT: Return ONLY a valid Tiptap/ProseMirror JSON object: {"type": "doc", "content": [...]}.`;

        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            prompt,
            config: { temperature: 0.8, maxOutputTokens: 4096 },
        });

        const jsonStr = extractJson(response.text);
        if (!jsonStr) throw new Error("AI failed to return valid JSON");

        return { success: true, longDescription: jsonStr };
    } catch (e: any) {
        console.error("AI Generation Error:", e);
        // Return a plain object instead of throwing to avoid the Next.js "Digest" error
        return { success: false, error: e.message };
    }
}

/**
 * Beautifies details
 */
export async function beautifyProductDetails(input: any) {
    try {
        const { name, description, story, origin, categories } = input;
        const categoryString = categories?.length ? categories.join(', ') : 'সাধারণ';

        const prompt = `You are an expert SEO copywriter... [Rest of your prompt]`;

        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            prompt,
            config: { temperature: 0.7, maxOutputTokens: 4096 },
        });

        const cleanJson = extractJson(response.text);
        if (!cleanJson) throw new Error("Could not parse AI response");
        
        const resultJson = JSON.parse(cleanJson);
        
        return {
            success: true,
            name: resultJson.name,
            description: resultJson.description,
            story: resultJson.story,
            origin: resultJson.origin,
            longDescription: JSON.stringify(resultJson.longDescription),
        };
    } catch (e: any) {
        console.error("Beautify Error:", e);
        return { success: false, error: e.message };
    }
}