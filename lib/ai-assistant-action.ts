"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemSettings } from "@/lib/admin-actions";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function askPvPAssistant(query: string) {
  try {
    if (!apiKey) {
      return { success: false, error: "API Key not configured on server." };
    }

    // Fetch dynamic model name
    const settings = await getSystemSettings().catch(() => ({}));
    const modelName = settings["AI_MODEL_NAME"] || "gemini-1.5-flash";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const systemPrompt = `
      You are the "PvP One AI Assistant", an expert in Plant Variety Protection (PVP) laws and compliance.
      Your goal is to help users (Breeders, Client Admins, and Super Admins) understand the platform and PVP concepts.
      
      Key Knowledge Base:
      - **DUS**: Distinctness, Uniformity, and Stability testing. Required for granting a PVP certificate.
      - **UPOV**: The International Union for the Protection of New Varieties of Plants.
      - **Novelty**: A variety must be "new" (not sold/commercialized before certain dates).
      - **Documents**: Powers of Attorney (PoA) and Assignment Deeds are crucial legal docs.
      
      Instructions:
      - Answer concisely and professionally.
      - If asked about "Egypt" requirements: They typically require a Power of Attorney (legalized), an Assignment Deed (if breeder != applicant), and DUS samples.
      - If asked about specific platform tasks ("How do I upload?"), tell them to go to the "Task Details" page and click the "Upload" button.
      - Do NOT make up laws. If unsure, advise consulting a lawyer.
      
      User Query: "${query}"
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    return { success: true, text };
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return { success: false, error: error.message || "Failed to get answer." };
  }
}
