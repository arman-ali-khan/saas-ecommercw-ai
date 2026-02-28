/**
 * @fileOverview AI flows for generating and beautifying product details using OpenRouter.
 * This file strictly uses OpenRouter API and does not rely on direct Gemini/Genkit calls.
 */

/**
 * Helper to extract JSON from AI response more robustly.
 * Handles cases where AI might wrap JSON in markdown blocks.
 */
function extractJson(text: string) {
    if (!text) return null;
    try {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1) {
            return null;
        }
        
        const jsonStr = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonStr);
    } catch (e) {
        // Try a simple cleanup if initial parsing fails
        try {
            const cleaned = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1)
                .replace(/\n/g, " ")
                .replace(/\r/g, " ");
            return JSON.parse(cleaned);
        } catch (e2) {
            return null;
        }
    }
}

/**
 * Generic function to call OpenRouter API.
 * Uses the API key provided from environment variables.
 */
async function callOpenRouter(apiKey: string, prompt: string) {
    if (!apiKey) {
        throw new Error("API configuration missing on server.");
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ehut-saas.com", // Optional platform identifier
                "X-Title": "eHut SaaS AI"
            },
            body: JSON.stringify({
                model: "arcee-ai/trinity-large-preview:free", // High quality free model on OpenRouter
                messages: [
                    { 
                        role: "system", 
                        content: "You are a professional JSON generator for an e-commerce platform. You must output ONLY valid JSON. No markdown, no conversational text, no explanations. Always respond in Bengali unless specified otherwise." 
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 4096
            })
        });

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `OpenRouter API Error ${response.status}`);
            } else {
                const textError = await response.text();
                throw new Error(textError || `OpenRouter server returned an error (${response.status})`);
            }
        }

        if (!contentType || !contentType.includes("application/json")) {
            const rawText = await response.text();
            throw new Error("AI returned an invalid response format.");
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        
        if (!content) {
            throw new Error("AI returned an empty message.");
        }

        return content;
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
        
        const categoryString = categories?.length ? categories.join(', ') : 'সাধারণ';

        const prompt = `Task: Generate a high-conversion professional product description for "${name}" in Bengali.
        
        Context:
        - Short Desc: ${description || ''}
        - Origin: ${origin || 'Bangladesh'}
        - Categories: ${categoryString}

        OUTPUT REQUIREMENTS:
        1. Language: Bengali.
        2. Format: Return ONLY a valid Tiptap/ProseMirror JSON object (type: "doc").
        3. Structure: Include Level 2 headings, descriptive paragraphs, and a bullet point list of benefits.
        
        Example JSON structure:
        {
          "type": "doc",
          "content": [
            { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "পণ্যের বিশেষত্ব" }] },
            { "type": "paragraph", "content": [{ "type": "text", "text": "..." }] }
          ]
        }`;

        const aiResponse = await callOpenRouter(apiKey, prompt);
        const resultJson = extractJson(aiResponse);
        
        if (!resultJson || resultJson.type !== "doc") {
            throw new Error("AI failed to generate a valid document structure. Please try again.");
        }

        return { success: true, longDescription: JSON.stringify(resultJson) };
    } catch (e: any) {
        return { success: false, error: e.message || "An error occurred during description generation." };
    }
}

/**
 * Beautifies product details for high conversion using OpenRouter AI.
 */
export async function beautifyProductDetails(input: any) {
    try {
        const { apiKey, name, description, story, origin, categories } = input;
        
        const categoryString = categories?.length ? categories.join(', ') : 'সাধারণ';

        const prompt = `Task: Optimize product details for "${name}" for SEO and high conversion in Bengali.
        
        Input Context:
        - Current Name: ${name}
        - Short Desc: ${description || 'N/A'}
        - Brand Story: ${story || 'N/A'}
        - Origin: ${origin || 'N/A'}
        - Categories: ${categoryString}

        OUTPUT REQUIREMENTS:
        1. Respond with a JSON object containing:
           - "name": Catchy, optimized product name.
           - "description": Enticing 2-line short description.
           - "story": Persuasive, emotional brand story.
           - "origin": Geographic origin.
           - "tags": Array of 5-8 SEO tags.
           - "longDescription": A full, highly DETAILED Tiptap JSON document object (type: "doc") with Level 2 headings, multiple paragraphs, and bullet points.

        STRICT: Return ONLY the raw JSON object. Use Bengali language.`;

        const aiResponse = await callOpenRouter(apiKey, prompt);
        const resultJson = extractJson(aiResponse);
        
        if (!resultJson) {
            throw new Error("AI returned data that could not be parsed. Please try again.");
        }
        
        return {
            success: true,
            name: resultJson.name || name,
            description: resultJson.description || description,
            story: resultJson.story || story,
            origin: resultJson.origin || origin,
            tags: Array.isArray(resultJson.tags) ? resultJson.tags : [],
            longDescription: typeof resultJson.longDescription === 'object' 
                ? JSON.stringify(resultJson.longDescription) 
                : resultJson.longDescription || '',
        };
    } catch (e: any) {
        return { success: false, error: e.message || "Optimization failed." };
    }
}
