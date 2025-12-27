"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createQuery, replyToQuery, getApplicationQueries } from "@/lib/actions";
import { format } from "date-fns";
import { MessageSquare, Plus, Send, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  content: string;
  senderId: string | null;
  createdAt: Date | string;
  sender?: { name: string | null } | null;
};

type Query = {
  id: string;
  title: string;
  status: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  messages: Message[];
  creator?: { name: string | null } | null;
};

export function QueriesUI({ 
  applicationId, 
  initialQueries,
  currentUserId 
}: { 
  applicationId: string; 
  initialQueries: Query[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [queries, setQueries] = useState(initialQueries);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [replyContent, setReplyContent] = useState("");

  // Polling ref to avoid closure staleness if needed, though simple effect works here
  useEffect(() => {
    const interval = setInterval(async () => {
      // Silent refresh
      try {
        const freshQueries = await getApplicationQueries(applicationId);
        setQueries(prev => {
          // Only update if different to avoid re-renders? 
          // For simplicity, we just update. React handles diffing.
          // We need to preserve the selectedQueryId if it still exists
          return freshQueries;
        });
      } catch (e) {
        console.error("Polling failed", e);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [applicationId]);

  // Also update when initialQueries changes (e.g. from server revalidation)
  useEffect(() => {
    setQueries(initialQueries);
  }, [initialQueries]);

  const selectedQuery = queries.find(q => q.id === selectedQueryId);

  const handleCreate = async () => {
    if (!newTitle || !newContent) return;
    
    await createQuery(applicationId, newTitle, newContent);
    setIsCreating(false);
    setNewTitle("");
    setNewContent("");
    
    // Immediate fetch to update UI
    const fresh = await getApplicationQueries(applicationId);
    setQueries(fresh);
    router.refresh();
  };

  const handleReply = async () => {
    if (!selectedQueryId || !replyContent) return;
    await replyToQuery(selectedQueryId, replyContent, applicationId);
    setReplyContent("");
    
    // Immediate fetch
    const fresh = await getApplicationQueries(applicationId);
    setQueries(fresh);
    router.refresh();
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const fresh = await getApplicationQueries(applicationId);
    setQueries(fresh);
    setIsRefreshing(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
      {/* List Column */}
      <div className="md:col-span-1 border-r pr-4 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Queries</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleManualRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <Button size="sm" onClick={() => { setIsCreating(true); setSelectedQueryId(null); }}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {queries.map(q => (
            <div 
              key={q.id}
              onClick={() => { setSelectedQueryId(q.id); setIsCreating(false); }}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedQueryId === q.id ? "bg-slate-100 border-slate-300" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium truncate">{q.title}</span>
                <Badge variant="outline" className="text-xs">{q.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>{q.creator?.name || "Unknown"}</span>
                <span>{format(new Date(q.createdAt), "MMM d")}</span>
              </div>
            </div>
          ))}
          {queries.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">
              No queries yet.
            </div>
          )}
        </div>
      </div>

      {/* Detail Column */}
      <div className="md:col-span-2 flex flex-col h-full">
        {isCreating ? (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>New Query</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div>
                <label className="text-sm font-medium mb-1 block">Subject</label>
                <Input 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="e.g., Clarification on DUS report"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-sm font-medium mb-1 block">Message</label>
                <Textarea 
                  value={newContent} 
                  onChange={(e) => setNewContent(e.target.value)} 
                  className="flex-1 min-h-[200px]"
                  placeholder="Type your query here..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Send Query</Button>
              </div>
            </CardContent>
          </Card>
        ) : selectedQuery ? (
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b py-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{selectedQuery.title}</CardTitle>
                <Badge>{selectedQuery.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedQuery.messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        isMe ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900"
                      }`}>
                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                        <div className={`text-[10px] mt-1 ${isMe ? "text-blue-100" : "text-slate-500"}`}>
                          {msg.sender?.name || "Unknown"} • {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <Textarea 
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type a reply..."
                    className="min-h-[60px]"
                  />
                  <Button className="h-auto" onClick={handleReply}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground border rounded-lg bg-slate-50">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Select a query to view the thread</p>
              <p className="text-sm">or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
