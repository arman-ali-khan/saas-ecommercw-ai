'use server';

/**
 * @fileOverview AI flows for generating product descriptions using OpenRouter.
 */

/**
 * Helper to extract JSON from AI response
 */
function extractJson(text: string) {
    try {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) return null;
        
        const jsonStr = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("JSON Parse Error. Raw text was:", text);
        return null;
    }
}

/**
 * Generic function to call OpenRouter API
 */
async function callOpenRouter(apiKey: string, prompt: string) {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://banglanaturals.site", // Optional, for OpenRouter tracking
                "X-Title": "Bangla Naturals SaaS"
            },
            body: JSON.stringify({
                model: "arcee-ai/trinity-large-preview:free",
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "OpenRouter API request failed");
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    } catch (e: any) {
        console.error("OpenRouter Call Error:", e);
        throw e;
    }
}

/**
 * Generates a detailed long description in Tiptap JSON format
 */
export async function generateProductDescription(input: any) {
    try {
        const { apiKey, name, description, categories, origin } = input;
        
        if (!apiKey) {
            throw new Error("Missing AI API Key");
        }

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

        const aiResponse = await callOpenRouter(apiKey, prompt);
        const resultJson = extractJson(aiResponse);
        
        if (!resultJson) throw new Error("AI failed to return valid JSON format.");

        return { success: true, longDescription: JSON.stringify(resultJson) };
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
        const { apiKey, name, description, story, origin, categories } = input;
        
        if (!apiKey) {
            throw new Error("Missing AI API Key");
        }

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

        const aiResponse = await callOpenRouter(apiKey, prompt);
        const resultJson = extractJson(aiResponse);
        
        if (!resultJson) throw new Error("Could not parse AI response as JSON");
        
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