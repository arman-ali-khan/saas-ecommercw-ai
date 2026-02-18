
'use server';

import { genkit, type GenkitError } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const GenerateProductDescriptionInputSchema = z.object({
    apiKey: z.string(),
    name: z.string(),
    description: z.string().optional(),
    categories: z.array(z.string()).optional(),
    origin: z.string().optional(),
});
type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
    longDescription: z.string(),
});
type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;


export async function generateProductDescription(input: GenerateProductDescriptionInput): Promise<GenerateProductDescriptionOutput> {
  try {
    const { apiKey, name, description, categories, origin } = input;

    if (!apiKey) {
      throw new Error('The Gemini API key is not configured. Please add it in your AI settings.');
    }

    // Initialize Genkit dynamically with the user's API key
    const dynamicGenerationFlow = genkit({
      plugins: [googleAI({ apiKey })],
    });
    
    const categoryString = categories && categories.length > 0 ? categories.join(', ') : 'general';

    const prompt = `You are an expert copywriter for an e-commerce store in Bangladesh called "Bangla Naturals". 
Your task is to write an engaging and detailed product description in Bengali, directly in Tiptap/ProseMirror JSON format.

Product Information:
- Name: ${name}
- Short Description: ${description || 'Not provided.'}
- Categories: ${categoryString}
- Origin: ${origin || 'Not provided.'}

Instructions:
1.  Generate a JSON object conforming to the Tiptap schema. The root object must be {"type": "doc", "content": [...]}.
2.  The content should be an array of nodes (e.g., paragraphs, headings, bullet lists).
3.  Use paragraphs for the main body text.
4.  Use headings (level 2 or 3) for section titles like "উপকারিতা" (Benefits), "কেন আমাদের পণ্যটি সেরা?" (Why us?), etc.
5.  Use bullet lists for features or benefits.
6.  The description MUST be entirely in Bengali.
7.  Highlight the product's natural origins, purity, and health benefits.
8.  Start with an engaging introduction and end with a call to action.
9.  CRITICAL: Your entire output must be ONLY the valid JSON object. Do not include any introductory text, explanations, or markdown code blocks (like \`\`\`json). The output must be valid JSON that can be parsed directly.`;

    const result = await dynamicGenerationFlow.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt,
      config: { 
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    let generatedJsonString = result.text;
    
    // Clean up potentially included markdown code blocks
    if (generatedJsonString.includes('```')) {
        generatedJsonString = generatedJsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    try {
        // Validate if the output is a valid JSON.
        JSON.parse(generatedJsonString);
        return { longDescription: generatedJsonString };
    } catch (parseError) {
        console.error("AI returned non-JSON text:", result.text);
        throw new Error('AI produced an invalid format. Please try generating again.');
    }

  } catch (e: any) {
    console.error("AI Generation Error:", e);
    
    if (e.message.includes('API key not valid')) {
        throw new Error('The provided Gemini API key is not valid. Please check your AI settings.');
    }
    
    const genkitError = e as GenkitError;
    if (genkitError.code) {
        throw new Error(`AI Error: ${genkitError.message}`);
    }

    throw e;
  }
}
