'use server';

/**
 * @fileOverview AI flows for generating product descriptions using OpenRouter.
 */

/**
 * Helper to extract JSON from AI response more robustly
 */
function extractJson(text: string) {
    if (!text) return null;
    try {
        // Find the first '{' and the last '}'
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1) {
            console.error("No JSON braces found in text:", text);
            return null;
        }
        
        const jsonStr = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("JSON Parse Error. Source text was:", text);
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
                "X-Title": "eHut SaaS"
            },
            body: JSON.stringify({
                model: "arcee-ai/trinity-large-preview:free",
                messages: [
                    { 
                        role: "system", 
                        content: "You are a specialized JSON generator for an e-commerce platform. You only speak JSON. Your output must start with '{' and end with '}'. No preamble, no postamble, no markdown code blocks, no explanation. Just valid JSON." 
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1, // Lower temperature for even more consistent JSON
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

        const prompt = `Task: Generate a professional product description for "${name}" in Bengali.
        
        Context:
        - Short Desc: ${description || ''}
        - Origin: ${origin || 'Bangladesh'}
        - Categories: ${categoryString}

        OUTPUT REQUIREMENTS:
        1. Language: Bengali.
        2. Content: Persuasive, high-end, and trustworthy.
        3. Structure: Must include Level 2 headings, detailed paragraphs, and a bullet point list of benefits.
        4. CRITICAL FORMAT: Return ONLY a valid Tiptap/ProseMirror JSON object (type: "doc"). 
        
        Example JSON structure to follow:
        {
          "type": "doc",
          "content": [
            { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "পণ্যের বিশেষত্ব" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "..." }] },
            { "type": "bulletList", "content": [{ "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "..." }] }] }] }
          ]
        }

        STRICT: Return ONLY the raw JSON object starting with { and ending with }. Do not include markdown code blocks.`;

        const aiResponse = await callOpenRouter(apiKey, prompt);
        const resultJson = extractJson(aiResponse);
        
        if (!resultJson || !resultJson.type || !resultJson.content) {
            throw new Error("AI failed to return valid Tiptap JSON format. Please try again.");
        }

        return { success: true, longDescription: JSON.stringify(resultJson) };
    } catch (e: any) {
        console.error("AI Generation Error:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Beautifies all product details for SEO and conversion, including tag generation
 */
export async function beautifyProductDetails(input: any) {
    try {
        const { apiKey, name, description, story, origin, categories } = input;
        
        if (!apiKey) {
            throw new Error("Missing AI API Key");
        }

        const categoryString = categories?.length ? categories.join(', ') : 'সাধারণ';

        const prompt = `Task: Optimize product details for "${name}" for high conversion and SEO in Bengali.
        
        Context:
        - Short Desc: ${description || 'N/A'}
        - Story: ${story || 'N/A'}
        - Origin: ${origin || 'N/A'}
        - Categories: ${categoryString}

        OUTPUT REQUIREMENTS:
        1. Language: Bengali.
        2. Return a JSON object with:
           - "name": Optimized catchy name.
           - "description": Catchy 2-line short description.
           - "story": Persuasive brand story.
           - "origin": Precise origin.
           - "tags": Array of 5-8 SEO tags.
           - "longDescription": A full Tiptap JSON document object (type: "doc") with headings and lists.

        STRICT: Return ONLY the raw JSON object. No markdown, no preamble. 
        Ensure "longDescription" is a nested object representing a Tiptap document, not a string.`;

        const aiResponse = await callOpenRouter(apiKey, prompt);
        const resultJson = extractJson(aiResponse);
        
        if (!resultJson) {
            throw new Error("Could not parse valid AI response. The AI might be busy or returned invalid data. Please try again.");
        }
        
        return {
            success: true,
            name: resultJson.name || name,
            description: resultJson.description || description,
            story: resultJson.story || story,
            origin: resultJson.origin || origin,
            tags: resultJson.tags || [],
            longDescription: typeof resultJson.longDescription === 'object' 
                ? JSON.stringify(resultJson.longDescription) 
                : resultJson.longDescription || '',
        };
    } catch (e: any) {
        console.error("Beautify Error:", e);
        return { success: false, error: e.message };
    }
}
