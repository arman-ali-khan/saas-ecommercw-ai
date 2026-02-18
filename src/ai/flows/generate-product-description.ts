
'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

/**
 * @fileOverview Product description generation flow.
 * 
 * - generateProductDescription - Wrapper function to call the AI generation logic.
 * - GenerateProductDescriptionInput - Input schema for the flow.
 * - GenerateProductDescriptionOutput - Output schema for the flow.
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

/**
 * Generates a DETAILED and LONG product description in Bengali using Gemini AI.
 * This function handles dynamic API keys and ensures valid Tiptap JSON output.
 */
export async function generateProductDescription(input: GenerateProductDescriptionInput): Promise<GenerateProductDescriptionOutput> {
  try {
    const { apiKey, name, description, categories, origin } = input;

    if (!apiKey) {
      throw new Error('Gemini API key is missing. Please configure it in AI Settings.');
    }

    // Initialize Genkit dynamically with the user's specific API key
    const ai = genkit({
      plugins: [googleAI({ apiKey })],
    });
    
    const categoryString = categories && categories.length > 0 ? categories.join(', ') : 'সাধারণ';

    const prompt = `You are a premium e-commerce copywriter for "Bangla Naturals", a high-end organic brand in Bangladesh.
Your task is to write an EXTENSIVE, DETAILED, and ENGAGING product description in Bengali.

Product Information:
- Name: ${name}
- Short Summary: ${description || 'A pure natural product.'}
- Categories: ${categoryString}
- Sourcing/Origin: ${origin || 'Bangladesh'}

WRITING INSTRUCTIONS:
1. TONE: Persuasive, trustworthy, and informative.
2. LENGTH: The description must be LONG and thorough (at least 500-700 words).
3. STRUCTURE: You MUST include the following sections with headings:
   - "পণ্য পরিচিতি" (Detailed Introduction): Talk about the heritage and purity.
   - "প্রাকৃতিক বৈশিষ্ট্য ও গুণাগুণ" (Natural Features): Describe why this is unique.
   - "স্বাস্থ্য উপকারিতা" (Detailed Health Benefits): Provide at least 6-8 bullet points explaining the benefits.
   - "কেন আমাদের পণ্যটি সেরা?" (Our Quality Commitment): Focus on "direct from farmer" and "no chemicals".
   - "সংরক্ষণ পদ্ধতি ও ব্যবহারের নিয়ম" (Usage & Storage Tips).
4. FORMAT: Return the response ONLY as a valid Tiptap/ProseMirror JSON object.
   - Root MUST be: {"type": "doc", "content": [...]}.
   - Use headings (level 2) for section titles.
   - Use paragraphs for body text.
   - Use bulleted lists for benefits.
   - Use Bold marks for emphasis within text.

CRITICAL: Output ONLY the raw JSON. Do NOT include markdown code fences (like \`\`\`json), no preamble, and no conversational filler. Start with { and end with }.`;

    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt,
      config: { 
        temperature: 0.8,
        maxOutputTokens: 4096, // Increased for longer descriptions
      },
    });

    const text = response.text;
    
    // Robust JSON extraction: handle markdown fences or accidental text
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
        console.error("AI output did not contain valid braces:", text);
        throw new Error('AI produced an invalid response format.');
    }
    
    const jsonString = text.substring(firstBrace, lastBrace + 1);
    
    try {
        // Validate if the output is a valid JSON.
        JSON.parse(jsonString);
        return { longDescription: jsonString };
    } catch (parseError) {
        console.error("Failed to parse AI JSON. Raw response length:", text.length);
        throw new Error('AI generated content was not in a valid JSON format. Please try again.');
    }

  } catch (e: any) {
    console.error("AI Generation Error (Flow):", e);
    
    if (e.message.includes('API key not valid') || e.message.includes('API_KEY_INVALID')) {
        throw new Error('The provided Gemini API key is not valid. Please check your AI settings.');
    }

    throw new Error(e.message || 'An unexpected error occurred during AI generation.');
  }
}
