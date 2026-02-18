
'use server';

import { genkit, type GenkitError } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

/**
 * @fileOverview Product description generation flow.
 * 
 * - generateProductDescription - Wrapper function to call the AI generation flow.
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
 * Generates a detailed product description in Bengali using Gemini AI.
 * This function uses the user-provided API key from the database.
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

    const prompt = `You are an expert copywriter for an e-commerce store in Bangladesh called "Bangla Naturals". 
Your task is to write an engaging and detailed product description in Bengali, directly in Tiptap/ProseMirror JSON format.

Product Information:
- Name: ${name}
- Short Description: ${description || 'Not provided.'}
- Categories: ${categoryString}
- Origin: ${origin || 'Not provided.'}

Instructions:
1. Generate a JSON object conforming to the Tiptap schema. The root object must be {"type": "doc", "content": [...]}.
2. Use paragraphs for the main body text.
3. Use headings (level 2 or 3) for section titles like "উপকারিতা" (Benefits), "কেন আমাদের পণ্যটি সেরা?" (Why us?), etc.
4. Use bullet lists for features or benefits.
5. The description MUST be entirely in Bengali.
6. Highlight natural origins, purity, and health benefits.
7. CRITICAL: Output ONLY valid JSON. No markdown code blocks, no preamble, no chatter.`;

    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt,
      config: { 
        temperature: 0.7,
        maxOutputTokens: 2500,
      },
    });

    let text = response.text;
    
    // Robust JSON extraction: look for the first '{' and last '}'
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.error("AI output did not contain valid JSON object:", text);
        throw new Error('AI produced an invalid response format.');
    }
    
    const jsonString = jsonMatch[0];
    
    try {
        // Validate if the output is a valid JSON.
        JSON.parse(jsonString);
        return { longDescription: jsonString };
    } catch (parseError) {
        console.error("Failed to parse AI JSON:", jsonString);
        throw new Error('AI generated content was not in a valid JSON format. Please try again.');
    }

  } catch (e: any) {
    console.error("AI Generation Error:", e);
    
    if (e.message.includes('API key not valid') || e.message.includes('API_KEY_INVALID')) {
        throw new Error('The provided Gemini API key is not valid. Please check your AI settings.');
    }
    
    const genkitError = e as GenkitError;
    if (genkitError.code) {
        throw new Error(`AI Service Error: ${genkitError.message}`);
    }

    throw new Error(e.message || 'An unexpected error occurred during AI generation.');
  }
}
