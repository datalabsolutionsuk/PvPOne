"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTask } from "@/lib/actions";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useState } from "react";

function SubmitButton({ type }: { type: string }) {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : (type === "DEADLINE" ? "Create Task" : "Add Requirement")}
    </Button>
  );
}

export default function CreateTaskForm({ 
  applicationId, 
  type,
  varietyName,
  jurisdictionName,
  applications = []
}: { 
  applicationId?: string; 
  type: string;
  varietyName?: string;
  jurisdictionName?: string;
  applications?: any[];
}) {
  const [selectedAppId, setSelectedAppId] = useState(applicationId || "");

  return (
    <form action={createTask} className="space-y-4">
      <input type="hidden" name="type" value={type} />
      
      {!applicationId ? (
        <div className="space-y-2">
            <Label>Application</Label>
            <Select name="applicationId" required onValueChange={setSelectedAppId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an application for this task" />
              </SelectTrigger>
              <SelectContent>
                {applications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.variety.name} ({app.jurisdiction.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      ) : (
        <>
            <input type="hidden" name="applicationId" value={applicationId} />
            <div className="bg-muted/50 p-4 rounded-md mb-6 text-sm">
                <p className="font-medium text-muted-foreground mb-1">Creating {type === "DEADLINE" ? "Deadline" : "Requirement"} for:</p>
                <p className="text-foreground font-semibold">{varietyName} <span className="font-normal text-muted-foreground">({jurisdictionName})</span></p>
            </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input 
          id="title" 
          name="title" 
          required 
          placeholder={type === "DEADLINE" ? "e.g. Submit Annual Report" : "e.g. Power of Attorney"} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" placeholder="Optional details..." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input id="dueDate" name="dueDate" type="date" />
      </div>

      {type === "DOCUMENT" && (
        <div className="space-y-2 pt-2 border-t">
          <Label htmlFor="file">Upload Document (Optional)</Label>
          <Input id="file" name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
          <p className="text-xs text-muted-foreground">
            If you upload a file now, the requirement will be marked as COMPLETED.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button asChild variant="outline">
          <Link href={`/dashboard/applications/${applicationId}`}>Cancel</Link>
        </Button>
        <SubmitButton type={type} />
      </div>
    </form>
  );
}
