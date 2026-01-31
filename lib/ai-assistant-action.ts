"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAIModelName } from "@/lib/admin-actions";
import { auth } from "@/lib/auth";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function askPvPAssistant(query: string, history: { role: string; content: string }[] = []) {
  try {
    const session = await auth();
    const userContext = session?.user 
      ? `User Name: ${session.user.name || "Unknown"}\nUser Role: ${session.user.role || "User"}\nUser Email: ${session.user.email || ""}`
      : "User is not logged in.";

    if (!apiKey) {
      return { success: false, error: "API Key not configured on server." };
    }

    // Fetch dynamic model name
    const dbModelName = await getAIModelName().catch(() => null);
    const modelName = dbModelName || "gemini-1.5-flash";

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const systemInstruction = `
      You are the "PvP One AI Assistant".
      
      # Current User Context
      ${userContext}
      
      Instructions:
      1. Tailor your answers based on their role (e.g., Breeders care about varieties, Admins care about users).
      2. If this is the start of the conversation, always greet the user by name (e.g., "Hello Karem").
      3. For subsequent messages, do not greet again. Be direct.
      
      Your goal is to help users navigate the platform and understand PVP concepts.
      
      # Navigation & Actions
      You can provide direct links to help users get things done. Always use Markdown links: [Link Name](URL).
      
      ## Common User Actions & URLs
      - **Dashboard Home**: [/dashboard](/dashboard)
      - **Users**:
        - List Users: [/dashboard/users](/dashboard/users) (or [/dashboard/admin/users](/dashboard/admin/users) for SuperAdmins)
      - **Varieties**: 
        - List Varieties: [/dashboard/varieties](/dashboard/varieties)
      - **Applications**:
        - List Applications: [/dashboard/applications](/dashboard/applications)
      - **Tasks**:
        - My Tasks: [/dashboard/tasks](/dashboard/tasks)
      - **Documents**:
        - Document Library: [/dashboard/documents](/dashboard/documents)
      - **Jurisdictions** (Admin): [/dashboard/jurisdictions](/dashboard/jurisdictions)

      ## Action Instructions
      If a user asks to perform an action (e.g., "Add a document", "Change a date", "Create an application"):
      1. Explain that you cannot perform the action *directly* yet.
      2. Provide the direct link to the **list page** where they can find the relevant item or the "Add" button.
      3. Give step-by-step guidance on what to click once they are there.
      
      Example:
      User: "I need to upload a PoA."
      Assistant: "You can upload it in the Document Library. [Go to Document Library](/dashboard/documents). Once there, click the 'Upload' button."

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
    `;

    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: systemInstruction 
    });

    // Sanitize history to ensure it starts with a user message
    // 1. Map roles to Gemini format (user/model)
    // 2. Drop any leading 'model' messages (Gemini requires history to start with user)
    let formattedHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }));

    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
        formattedHistory.shift();
    }

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(query);
    const response = await result.response;
    const text = response.text();
    
    return { success: true, text };
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return { success: false, error: error.message || "Failed to get answer." };
  }
}
