"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAIModelName } from "@/lib/admin-actions";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function generateEmailDraft(
  clientName: string,
  varietyName: string,
  jurisdiction: string,
  taskType: string,
  dueDate: Date | null,
  missingDocName?: string
) {
  try {
    if (!apiKey) {
      return { success: false, error: "API Key not configured on server (GOOGLE_GENERATIVE_AI_API_KEY)." };
    }
    
    // Fetch dynamic model name from DB settings, fallback to flash
    const dbModelName = await getAIModelName().catch(() => null);
    const modelName = dbModelName || "gemini-1.5-flash";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
      You are an expert legal assistant for a Plant Variety Protection (PVP) firm.
      Write a polite, professional, and clear email to a client named "${clientName}".
      
      Context:
      - We are handling their application for variety: "${varietyName}" in jurisdiction: "${jurisdiction}".
      - Issue: There is a pending task related to "${taskType}".
      ${missingDocName ? `- Specifically, we are missing this document: "${missingDocName}".` : ""}
      - Due Date: ${dueDate ? dueDate.toDateString() : "As soon as possible"}.
      
      Goal:
      - Remind them to submit the necessary information/documents.
      - Emphasize the deadline to avoid penalties or loss of rights.
      - Keep it professional but helpful.
      - Do NOT include subject line, just the body.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return { success: true, text };
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return { success: false, error: error.message || "Failed to generate email." };
  }
}

