/**
 * @fileOverview AI flows for generating and beautifying product details using OpenRouter.
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
                    content: "You are a professional JSON generator. Respond ONLY with valid JSON. No markdown, no extra text. Use Bengali language." 
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 4096
        })
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok) {
        let errorMsg = `API Error ${response.status}`;
        if (contentType && contentType.includes("application/json")) {
            const errJson = await response.json();
            errorMsg = errJson.error?.message || errorMsg;
        } else {
            errorMsg = await response.text() || errorMsg;
        }
        throw new Error(errorMsg);
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

        const prompt = `Task: Generate a high-conversion product description for "${name}" in Bengali.
        Context: Short Desc: ${description || ''}, Origin: ${origin || 'Bangladesh'}, Categories: ${categoryString}
        Return ONLY a valid Tiptap JSON object (type: "doc") with level 2 headings and paragraphs.`;

        const aiResponse = await callOpenRouter(apiKey, prompt);
        const resultJson = extractJson(aiResponse);
        
        if (!resultJson || resultJson.type !== "doc") {
            throw new Error("Invalid JSON structure from AI.");
        }

        return { success: true, longDescription: JSON.stringify(resultJson) };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function beautifyProductDetails(input: any) {
    try {
        const { apiKey, name, description, story, origin, categories } = input;
        const categoryString = categories?.length ? categories.join(', ') : 'সাধারণ';

        const prompt = `Task: Optimize product details for "${name}" in Bengali. 
        Input: Name: ${name}, Desc: ${description}, Story: ${story}, Origin: ${origin}.
        Return a JSON object with fields: "name", "description", "story", "origin", "tags" (array), and "longDescription" (Tiptap JSON object).`;

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
        return { success: false, error: e.message };
    }
}
