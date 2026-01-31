"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { generateEmailDraft } from "@/lib/ai-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface AIDrafterProps {
  clientName: string;
  varietyName: string;
  jurisdiction: string;
  taskType: string;
  dueDate: Date | null;
  missingDocName?: string;
}

export function AICommunicator({
  clientName,
  varietyName,
  jurisdiction,
  taskType,
  dueDate,
  missingDocName,
}: AIDrafterProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateEmailDraft(
      clientName,
      varietyName,
      jurisdiction,
      taskType,
      dueDate,
      missingDocName
    );
    if (result.success && result.text) {
      setDraft(result.text);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          AI Draft Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Email Assistant</DialogTitle>
          <DialogDescription>
            Generate a professional follow-up email for this task.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!draft && !loading && (
            <div className="text-center py-8">
              <Button onClick={handleGenerate} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Draft
              </Button>
            </div>
          )}
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="text-sm text-muted-foreground">Writing email...</p>
            </div>
          )}

          {draft && (
            <div className="space-y-4">
               <Textarea 
                value={draft} 
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-[200px]" 
               />
               <div className="flex justify-end gap-2">
                 <Button variant="ghost" size="sm" onClick={() => setDraft("")}>
                    Regenerate
                 </Button>
                 <Button size="sm" onClick={handleCopy} className="gap-2">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy to Clipboard"}
                 </Button>
               </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
