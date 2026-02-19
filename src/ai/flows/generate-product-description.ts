'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const ai = genkit({
    plugins: [
        googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })
    ],
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
 * Generates a detailed long description in Tiptap JSON format
 */
export async function generateProductDescription(input: any) {
    try {
        if (!process.env.GOOGLE_GENAI_API_KEY) {
            throw new Error("SERVER_CONFIG_ERROR: Missing API Key");
        }

        const { name, description, categories, origin } = input;
        const categoryString = categories?.length ? categories.join(', ') : 'সাধারণ';

        const prompt = `You are a premium e-commerce copywriter for "Bangla Naturals", specializing in organic and natural products.
        
        Task: Generate a beautiful, persuasive, and long detailed description for the product: "${name}".
        Context: ${description || ''}
        Origin: ${origin || 'Bangladesh'}
        Categories: ${categoryString}

        REQUIREMENTS:
        1. Language: Bengali.
        2. Tone: Trustworthy, Premium, and Emotional.
        3. Include: Product benefits, why it's pure, how to use it, and a story about its origin.
        4. Structure: Use headings, paragraphs, and lists.
        5. FORMAT: Return ONLY a valid Tiptap/ProseMirror JSON object: {"type": "doc", "content": [...]}.
        
        DO NOT include any markdown code blocks (like \`\`\`json) in your response. Just the raw JSON object.`;

        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            prompt,
            config: { temperature: 0.8, maxOutputTokens: 4096 },
        });

        const jsonStr = extractJson(response.text);
        if (!jsonStr) throw new Error("AI failed to return valid JSON. Response text was: " + response.text.substring(0, 100));

        return { success: true, longDescription: jsonStr };
    } catch (e: any) {
        console.error("AI Generation Error:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Beautifies all product details for SEO and conversion
 */
export async function beautifyProductDetails(input: any) {
    try {
        const { name, description, story, origin, categories } = input;
        const categoryString = categories?.length ? categories.join(', ') : 'সাধারণ';

        const prompt = `You are an expert SEO copywriter. Optimize and "Beautify" the following product information for high sales conversion and search ranking.
        
        Current Name: ${name}
        Current Short Description: ${description || 'N/A'}
        Current Story: ${story || 'N/A'}
        Current Origin: ${origin || 'N/A'}
        Categories: ${categoryString}

        Task: Return a JSON object with optimized versions of these fields.
        
        REQUIREMENTS:
        1. Language: Bengali.
        2. Name: Catchy and SEO optimized.
        3. Description: Short, impactful 2-3 lines.
        4. Story: A compelling narrative about tradition or purity.
        5. Origin: Clean location name.
        6. longDescription: A full, detailed Tiptap JSON document.

        FORMAT: Return ONLY a valid JSON object with keys: "name", "description", "story", "origin", "longDescription".
        "longDescription" MUST be a Tiptap JSON object (the raw object, not a string).
        
        Example JSON format:
        {
          "name": "...",
          "description": "...",
          "story": "...",
          "origin": "...",
          "longDescription": {"type": "doc", "content": [...]}
        }

        DO NOT include any markdown code blocks. Just the raw JSON object.`;

        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            prompt,
            config: { temperature: 0.7, maxOutputTokens: 4096 },
        });

        const cleanJson = extractJson(response.text);
        if (!cleanJson) throw new Error("Could not parse AI response as JSON");
        
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
