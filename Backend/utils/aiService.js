import {GoogleGenAI} from "@google/genai";

let client = null;
const getClient = () => {
 if (client) return client;
 const key = process.env.GEMINI_API_KEY;
 if (!key) return null;
 client = new GoogleGenAI({apiKey: key});
 return client;
};
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const isAIEnabled = () => !!process.env.GEMINI_API_KEY;

export const parseJSON = (text) => {
 let cleaned = (text || "").trim();
 if (cleaned.startsWith("```json")){
    cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
} else if(cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```\n?/g, "");
}
  return JSON.parse(cleaned.trim());
};

export const chatCompletion = async({ system, user, temperature = 0.7}) => {
 const client = getClient();
 if (!client) {
 return {
    ok: false,
    content: "AI features are disabled - set GEMINI_API_KEY in the backend .env to enable real AI responses.",
        }
 }
 try {
    const res = await client.models.generateContent({
     model: MODEL, 
     contents: user,
     config: {
        systemInstruction: system,
        temperature,
     },
    });
    return {
        ok: true,
        content: (res.text || "").trim(),};
 } catch (err) {
    console.error("AI error:", err.message);
    return {
        ok: false,
        content: "AI request failed. Please try again later.",};
 }
};

export const SYSTEM_PROMPTS = {
 weekly: `
 You are a warm, encouraging habit coach. Analyse the user's last 7 days of habit data and write a short report(120-200 words).Mention: what went well, what struggles, pattern noticed and one specific place of encouragement. Use the user's actual habit names. Be human, not generic. No markdown headers - use plain prose with line breaks.`,
 suggestion: `
 You are a helpful habit coach. Based on the user's goals, productive time, and past struggles, suggest exactly 3 personalised habits. Return valid JSON only with this shape: {\"suggestions\":[{\"name\":\"...\",\"description\":\"...\",\"frequency\":\"daily|weekly\",\"category\":\"Health|Fitness|Learning|Mindfulness|Productivity|Social|Finance|Creative|Other\",\"icon\":\"<emoji>\",\"reason\":\"...\"}]}. No prose outside JSON.`,
 recovery: `
 You are a compassionate habit recovery coach. The user broke a streak. Write a 3-day recovery plan tailored to this specific habits. Be warm but actionable. Use this structure: short empathetic opening (1-2 sentences), the Day 1 / Day 2 / Day 3 sections with one concrete action each, time a closing line of encouragement. 150-220 words total.`,
 chat: `
 You are a helpful analysis assistant. Answer the user's question using ONLY the provided habit data as context. Be specific - cite actual habit names, days, percentages. Keep replies under 120 words. If the data is insufficient, say so briefly.`,
 morning: `
 You are a warm,motivating friend. Write a single short morning message (30-60 words) using the user's actual habit names and current streaks. Mention 1-2 specific habits. Energetic but not cheesy. No emojis overload - max 1.`,
}
