
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

    const prompt = `You are an expert copywriter for an e-commerce store in Bangladesh that sells natural and organic products. Your task is to write an engaging and detailed product description in Bengali.

    Product Name: ${name}
    Short Description: ${description || 'Not provided.'}
    Categories: ${categoryString}
    Origin: ${origin || 'Not provided.'}

    Based on this information, write a compelling, long-form product description. The description should be structured in multiple paragraphs. It should be suitable for a rich text editor, so use markdown for formatting like headings (e.g., ## শিরোনাম), bold text (e.g., **গুরুত্বপূর্ণ**), and bullet points (e.g., * একটি বুলেট).

    Highlight the product's natural origins, benefits, and unique qualities. Make it sound appealing to customers in Bangladesh. Start with an engaging introduction and end with a call to action. Do not include the product name in the description itself, as it's already in the title.`;

    const result = await localAi.generate({
      prompt,
      config: { temperature: 0.7 },
    });

    const generatedText = result.text;
    
    // Convert markdown-like text to Tiptap/ProseMirror JSON
    const paragraphs = generatedText.split('\n').filter(p => p.trim() !== '');
    const content = paragraphs.map(p => {
        if (p.startsWith('## ')) {
            return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: p.substring(3) }] };
        }
        if (p.startsWith('* ')) {
            return { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: p.substring(2) }] }] };
        }
        // Basic bold and italic handling
        const textContent: any[] = [];
        const parts = p.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        parts.forEach(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                textContent.push({ type: 'text', text: part.slice(2, -2), marks: [{ type: 'bold' }] });
            } else if (part.startsWith('*') && part.endsWith('*')) {
                textContent.push({ type: 'text', text: part.slice(1, -1), marks: [{ type: 'italic' }] });
            } else {
                textContent.push({ type: 'text', text: part });
            }
        });
        
        return { type: 'paragraph', content: textContent };
    });

    // Group list items
    const finalContent: any[] = [];
    let currentList: any = null;
    content.forEach(item => {
        if (item.type === 'listItem') {
            if (!currentList) {
                currentList = { type: 'bulletList', content: [] };
            }
            currentList.content.push(item);
        } else {
            if (currentList) {
                finalContent.push(currentList);
                currentList = null;
            }
            finalContent.push(item);
        }
    });
    if (currentList) {
        finalContent.push(currentList);
    }

    const tiptapJson = {
        type: 'doc',
        content: finalContent,
    };
    
    return { longDescription: JSON.stringify(tiptapJson) };

  } catch (e: any) {
    console.error("AI Generation Error:", e);
    if (e.isGenkitError) {
      const genkitError = e as GenkitError;
      throw new Error(`AI Error: ${genkitError.message} (Code: ${genkitError.code})`);
    }
    if (e.message.includes('API key not valid')) {
      throw new Error('The provided Gemini API key is not valid. Please check your AI settings.');
    }
    throw new Error('Failed to generate description due to an unexpected error.');
  }
}
