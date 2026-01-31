"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Loader2, Bot, User } from "lucide-react";
import { askPvPAssistant } from "@/lib/ai-assistant-action";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function PvPAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm your PvP Assistant. Ask me about DUS, documents, or regulations." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Convert messages to history format expected by backend
      // Exclude the very first hardcoded welcome message if needed, or mapping "assistant" -> "model" is handled backend side but the type definition there is 'role: string'.
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const result = await askPvPAssistant(userMsg.content, history);
      
      if (result.success && result.text) {
        setMessages((prev) => [...prev, { role: "assistant", content: result.text }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: result.error || "Sorry, I encountered an error. Please try again." }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error occurred." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-50 text-white"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[400px] h-[600px] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b bg-slate-50">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            PvP Knowledge Assistant
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                )}
                
                <div
                  className={`rounded-lg p-3 text-sm max-w-[80%] ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-slate-800"
                  }`}
                >
                  <div className={`prose prose-sm max-w-none ${
                        m.role === "user" ? "prose-invert" : "prose-slate"
                    } prose-p:my-1 prose-ul:my-1 prose-li:my-0`}>
                    <ReactMarkdown 
                      components={{
                        a: ({node, ...props}) => <a {...props} className="underline font-semibold hover:text-blue-400" target="_blank" rel="noopener noreferrer" />
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>

                {m.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                   <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-400 italic">
                  Typing...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
