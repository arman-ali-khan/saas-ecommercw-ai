
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

    const localAi = genkit({
      plugins: [googleAI({ apiKey: apiKey })],
      model: 'googleai/gemini-2.5-flash',
    });
    
    const categoryString = categories ? categories.join(', ') : 'general';

    const prompt = `You are an expert copywriter for an e-commerce store in Bangladesh. Your task is to write an engaging and detailed product description in Bengali, directly in Tiptap/ProseMirror JSON format.

Product Information:
- Name: ${name}
- Short Description: ${description || 'Not provided.'}
- Categories: ${categoryString}
- Origin: ${origin || 'Not provided.'}

Instructions:
1.  Generate a JSON object conforming to the Tiptap schema. The root object must be \`{"type": "doc", "content": [...]}\`.
2.  The content should be an array of nodes (e.g., paragraphs, headings, bullet lists).
3.  Use paragraphs for the main body text. For example: \`{"type": "paragraph", "content": [{"type": "text", "text": "আপনার লেখা এখানে।"}]}\`.
4.  Use headings (level 2 or 3) for section titles. For example: \`{"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "শিরোনাম"}]}\`.
5.  Use bullet lists for features or benefits. For example: \`{"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "একটি বুলেট পয়েন্ট।"}]}]}]}\`.
6.  Use marks for bold (\`"marks": [{"type": "bold"}]\`) and italic (\`"marks": [{"type": "italic"}]\`) text.
7.  The description MUST be in Bengali.
8.  Highlight the product's natural origins, benefits, and unique qualities.
9.  Start with an engaging introduction and end with a call to action.
10. DO NOT include the product name in the description itself.
11. CRITICAL: Your entire output must be ONLY the JSON object. Do not include any introductory text, explanations, or markdown code fences. The output must be valid JSON that can be parsed directly.`;

    const result = await localAi.generate({
      prompt,
      config: { temperature: 0.7 },
    });

    const generatedJsonString = result.text;
    
    try {
        // Validate if the output is a valid JSON.
        JSON.parse(generatedJsonString);
        return { longDescription: generatedJsonString };
    } catch (jsonError) {
        console.error("AI returned invalid JSON:", jsonError, "Raw output:", generatedJsonString);
        throw new Error('AI produced an invalid format. Please try generating again.');
    }

  } catch (e: any) {
    console.error("AI Generation Error:", e);
    if (e.isGenkitError) {
      const genkitError = e as GenkitError;
      throw new Error(`AI Error: ${genkitError.message} (Code: ${genkitError.code})`);
    }
    if (e.message.includes('API key not valid')) {
      throw new Error('The provided Gemini API key is not valid. Please check your AI settings.');
    }
    if (e.message.includes('AI produced an invalid format')) {
        throw e;
    }
    throw new Error('Failed to generate description due to an unexpected error.');
  }
}
