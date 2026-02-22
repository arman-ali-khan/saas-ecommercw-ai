'use server';

/**
 * @fileOverview AI flows for generating product descriptions using OpenRouter.
 */

/**
 * Helper to extract JSON from AI response more robustly
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
                "HTTP-Referer": "https://banglanaturals.site",
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

        const prompt = `You are a premium e-commerce copywriter for "Bangla Naturals".
        
        Task: Generate a beautiful, persuasive, and detailed description for: "${name}".
        Context: ${description || ''}
        Origin: ${origin || 'Bangladesh'}
        Categories: ${categoryString}

        REQUIREMENTS:
        1. Language: Bengali.
        2. Structure: Use a clear layout with headers (level 2), impactful paragraphs, and bullet point lists for benefits.
        3. Experience: Make it sound high-end and trustworthy.
        4. FORMAT: Return ONLY a valid Tiptap/ProseMirror JSON object: {"type": "doc", "content": [...]}.
        
        Example Structure:
        {
          "type": "doc",
          "content": [
            { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "পণ্যের বিশেষত্ব" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "বর্ণনা..." }] },
            { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "কেন আমাদের পণ্যটি সেরা?" }] },
            { "type": "bulletList", "content": [
                { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "উপকারিতা ১" }] }] }
              ] 
            }
          ]
        }

        DO NOT include markdown code blocks. Just the raw JSON object.`;

        const aiResponse = await callOpenRouter(apiKey, prompt);
        const resultJson = extractJson(aiResponse);
        
        if (!resultJson || !resultJson.type) throw new Error("AI failed to return valid Tiptap JSON format.");

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

        const prompt = `You are an expert SEO copywriter. Optimize the following product info for high conversion.
        
        Current Name: ${name}
        Short Description: ${description || 'N/A'}
        Story: ${story || 'N/A'}
        Origin: ${origin || 'N/A'}
        Categories: ${categoryString}

        REQUIREMENTS:
        1. Language: Bengali.
        2. Return a JSON object with optimized fields.
        3. "longDescription" field MUST be a full Tiptap JSON document with headings and lists.

        FORMAT: Return ONLY a valid JSON object:
        {
          "name": "...",
          "description": "...",
          "story": "...",
          "origin": "...",
          "longDescription": {"type": "doc", "content": [...]}
        }

        DO NOT include markdown code blocks. Just the raw JSON object.`;

        const aiResponse = await callOpenRouter(apiKey, prompt);
        const resultJson = extractJson(aiResponse);
        
        if (!resultJson || !resultJson.longDescription) throw new Error("Could not parse valid AI response");
        
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
