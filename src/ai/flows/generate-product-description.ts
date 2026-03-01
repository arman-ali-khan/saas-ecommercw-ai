/**
 * @fileOverview AI flows for generating and beautifying product details using OpenRouter.
 */

function extractJson(text: string) {
    if (!text) return null;
    try {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1) {
            console.error("JSON Braces not found in AI response:", text);
            return null;
        }
        
        const jsonStr = text.substring(firstBrace, lastBrace + 1);
        const cleanedStr = jsonStr.replace(/\n/g, " ").replace(/\r/g, " ").replace(/\t/g, " ");
        return JSON.parse(cleanedStr);
    } catch (e) {
        console.error("JSON Parse Error in extractJson:", e, "Raw text:", text);
        return null;
    }
}

async function callOpenRouter(apiKey: string, prompt: string) {
    if (!apiKey) {
        throw new Error("OpenRouter API Key is missing in server environment variables.");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ehut-saas.com",
            "X-Title": "eHut SaaS AI"
        },
        body: JSON.stringify({
            model: "arcee-ai/trinity-large-preview:free",
            messages: [
                { 
                    role: "system", 
                    content: "You are a professional product content optimizer. You respond ONLY with raw JSON. No markdown blocks, no backticks, no text before or after." 
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 3000
        })
    });

    if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `API Error ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    if (!content) throw new Error("AI returned an empty response.");
    return content;
}

export async function generateProductDescription(input: any) {
    try {
        const { apiKey, name, description, categories, origin } = input;
        const categoryString = categories?.length ? categories.join(', ') : 'সাধারণ';

        const prompt = `Task: Generate a conversion-optimized Tiptap product description for "${name}" in Bengali.
        Context: Short Desc: ${description || ''}, Origin: ${origin || 'Bangladesh'}, Categories: ${categoryString}
        
        Return ONLY this JSON structure:
        {
          "longDescription": {
            "type": "doc",
            "content": [
              { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Bengali Title" }] },
              { "type": "paragraph", "content": [{ "type": "text", "text": "Bengali Description..." }] }
            ]
          }
        }`;

        const aiResponse = await callOpenRouter(apiKey, prompt);
        const resultJson = extractJson(aiResponse);
        
        if (!resultJson || !resultJson.longDescription) {
            throw new Error("Invalid response structure from AI.");
        }

        return { 
            success: true, 
            longDescription: JSON.stringify(resultJson.longDescription) 
        };
    } catch (e: any) {
        console.error("AI Description Flow Error:", e);
        return { success: false, error: e.message };
    }
}

export async function beautifyProductDetails(input: any) {
    try {
        const { apiKey, name, description, story, origin, categories } = input;
        const categoryString = categories?.length ? categories.join(', ') : 'সাধারণ';

        const prompt = `Task: SEO optimize product details for "${name}" in Bengali.
        Context: Desc: ${description || ''}, Story: ${story || ''}, Origin: ${origin || ''}, Categories: ${categoryString}

        Return ONLY this JSON structure (max 5 tags):
        {
          "name": "Catchy Bengali Title",
          "description": "Short summary",
          "story": "Brand story",
          "origin": "Origin info",
          "tags": ["tag1", "tag2"],
          "longDescription": { "type": "doc", "content": [...] }
        }`;

        const aiResponse = await callOpenRouter(apiKey, prompt);
        const resultJson = extractJson(aiResponse);
        
        if (!resultJson) throw new Error("AI output parsing failed.");
        
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
        console.error("AI Beautify Flow Error:", e);
        return { success: false, error: e.message };
    }
}
