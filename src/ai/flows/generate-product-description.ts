/**
 * @fileOverview AI flows for generating and beautifying product details using OpenRouter.
 */

function extractJson(text: string) {
    if (!text) return null;
    try {
        // Find the first '{' and the last '}'
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1) {
            console.error("JSON Braces not found in AI response:", text);
            return null;
        }
        
        const jsonStr = text.substring(firstBrace, lastBrace + 1);
        // Clean common problematic characters from AI output
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
            model: "google/gemini-2.0-flash-lite-preview-02-05:free",
            messages: [
                { 
                    role: "system", 
                    content: "You are a professional product content optimizer. You must respond ONLY with a valid JSON object. Do not include markdown code blocks, explanations, or any text before or after the JSON." 
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 4096
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

        const prompt = `Task: Generate a high-conversion product description for "${name}" in Bengali.
        Context: Short Desc: ${description || ''}, Origin: ${origin || 'Bangladesh'}, Categories: ${categoryString}
        
        Return ONLY a JSON object with this exact structure:
        {
          "longDescription": {
            "type": "doc",
            "content": [
              { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Heading in Bengali" }] },
              { "type": "paragraph", "content": [{ "type": "text", "text": "Paragraph text in Bengali" }] }
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

        const prompt = `Task: Optimize the following product details for SEO and conversion in Bengali language.
        Product: ${name}
        Short Description: ${description || 'N/A'}
        Origin: ${origin || 'N/A'}
        Story: ${story || 'N/A'}
        Categories: ${categoryString}

        Return ONLY a JSON object with these fields:
        - name: Catchy title
        - description: Persuasive short summary (max 150 chars)
        - story: Emotional brand/product story
        - origin: Authentic origin info
        - tags: Array of 5 relevant SEO tags
        - longDescription: A Tiptap JSON object (type: "doc") with structured headings and bullet points.

        Response Format:
        {
          "name": "...",
          "description": "...",
          "story": "...",
          "origin": "...",
          "tags": ["tag1", "tag2"],
          "longDescription": { "type": "doc", "content": [...] }
        }`;

        const aiResponse = await callOpenRouter(apiKey, prompt);
        const resultJson = extractJson(aiResponse);
        
        if (!resultJson) throw new Error("AI output parsing failed. AI response was not valid JSON.");
        
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
