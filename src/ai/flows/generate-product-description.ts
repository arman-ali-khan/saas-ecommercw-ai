'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

/**
 * @fileOverview Product content generation and optimization flows.
 * 
 * - generateProductDescription - Generates a structured long description.
 * - beautifyProductDetails - Optimizes all product fields (Title, Short Desc, Story, Origin, Long Desc).
 */

const GenerateProductDescriptionInputSchema = z.object({
    apiKey: z.string(),
    name: z.string(),
    description: z.string().optional(),
    categories: z.array(z.string()).optional(),
    origin: z.string().optional(),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
    longDescription: z.string(),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

// Schema for Beautifying all details
const BeautifyProductInputSchema = z.object({
    apiKey: z.string(),
    name: z.string(),
    description: z.string().optional(),
    story: z.string().optional(),
    origin: z.string().optional(),
    categories: z.array(z.string()).optional(),
});
export type BeautifyProductInput = z.infer<typeof BeautifyProductInputSchema>;

const BeautifyProductOutputSchema = z.object({
    name: z.string(),
    description: z.string(),
    story: z.string(),
    origin: z.string(),
    longDescription: z.string(), // This will be Tiptap JSON string
});
export type BeautifyProductOutput = z.infer<typeof BeautifyProductOutputSchema>;

/**
 * Robustly extract JSON from AI response string.
 */
function extractJson(text: string) {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('AI produced an invalid response format.');
    }
    return text.substring(firstBrace, lastBrace + 1);
}

/**
 * Generates a DETAILED and LONG product description in Bengali using Gemini AI.
 */
export async function generateProductDescription(input: GenerateProductDescriptionInput) {export async function generateProductDescription(input: GenerateProductDescriptionInput) {
  try {
    const { apiKey, name, description, categories, origin } = input;
    if (!apiKey) throw new Error('Gemini API key is missing.');

    const ai = genkit({ plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })] });
    const categoryString = categories?.length ? categories.join(', ') : 'সাধারণ';

    const prompt = `You are a premium e-commerce copywriter for "Bangla Naturals".
Generate an EXTENSIVE, DETAILED, and ENGAGING product description in Bengali for "${name}".

Context:
- Short Summary: ${description || 'A pure natural product.'}
- Categories: ${categoryString}
- Sourcing/Origin: ${origin || 'Bangladesh'}

STRUCTURE:
1. "পণ্য পরিচিতি" (Introduction)
2. "প্রাকৃতিক বৈশিষ্ট্য ও গুণাগুণ" (Features)
3. "স্বাস্থ্য উপকারিতা" (6-8 bullet points)
4. "কেন আমাদের পণ্যটি সেরা?" (Quality Commitment)
5. "সংরক্ষণ পদ্ধতি ও ব্যবহারের নিয়ম" (Tips)

FORMAT: Return ONLY a valid Tiptap/ProseMirror JSON object: {"type": "doc", "content": [...]}.
Do NOT use markdown code fences.`;

    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt,
      config: { temperature: 0.8, maxOutputTokens: 4096 },
    });

    return { longDescription: extractJson(response.text) };
  } catch (e: any) {
    console.error("AI Generation Error:", e);
    throw new Error(e.message || 'AI generation failed.');
  }
}

/**
 * Optimizes all product details for SEO and conversion.
 */
export async function beautifyProductDetails(input: BeautifyProductInput): Promise<BeautifyProductOutput> {
    try {
        const { apiKey, name, description, story, origin, categories } = input;
        if (!apiKey) throw new Error('Gemini API key is missing.');

        const ai = genkit({ plugins: [googleAI({ apiKey })] });
        const categoryString = categories?.length ? categories.join(', ') : 'সাধারণ';

        const prompt = `You are an expert SEO copywriter and e-commerce strategist.
Your task is to take the following raw product information and "BEAUTIFY" it for a premium organic brand.

Raw Details:
- Current Name: ${name}
- Current Short Desc: ${description || 'N/A'}
- Current Story: ${story || 'N/A'}
- Current Origin: ${origin || 'N/A'}
- Categories: ${categoryString}

INSTRUCTIONS:
1. NAME: Make it catchy, SEO-friendly, and professional in Bengali.
2. SHORT DESCRIPTION: Write a 2-3 sentence persuasive summary.
3. STORY: Rewrite the "Our Story" section to be emotionally resonant and trustworthy.
4. ORIGIN: Format the origin nicely (e.g., "রাজশাহীর বাগান থেকে সরাসরি").
5. LONG DESCRIPTION: Generate a full, structured description in Tiptap JSON format.

OUTPUT FORMAT: Return ONLY a raw JSON object with these keys:
{
  "name": "optimized name",
  "description": "optimized short summary",
  "story": "optimized story",
  "origin": "formatted origin",
  "longDescription": {"type": "doc", "content": [...]}
}

CRITICAL: Everything except keys must be in Bengali. Return ONLY the JSON object. No preamble.`;

        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            prompt,
            config: { temperature: 0.7, maxOutputTokens: 4096 },
        });

        const resultJson = JSON.parse(extractJson(response.text));
        
        return {
            name: resultJson.name,
            description: resultJson.description,
            story: resultJson.story,
            origin: resultJson.origin,
            longDescription: JSON.stringify(resultJson.longDescription),
        };
    } catch (e: any) {
        console.error("Beautify Error:", e);
        throw new Error(e.message || 'Beautification failed.');
    }
}