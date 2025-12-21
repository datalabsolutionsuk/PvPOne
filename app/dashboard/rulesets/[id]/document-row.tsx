"use client";

import { useState } from "react";
import { updateRuleDocumentRequirement, deleteRuleDocumentRequirement } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil, Save, X } from "lucide-react";

interface DocumentRowProps {
  doc: {
    id: string;
    rulesetId: string;
    docType: string;
    requiredBool: boolean;
    notes: string | null;
  };
}

export function DocumentRow({ doc }: DocumentRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <form 
        action={async (formData) => {
          await updateRuleDocumentRequirement(formData);
          setIsEditing(false);
        }}
        className="flex items-center gap-2 border-b pb-2 last:border-0 py-2"
      >
        <input type="hidden" name="id" value={doc.id} />
        <input type="hidden" name="rulesetId" value={doc.rulesetId} />
        
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor={`docType-${doc.id}`} className="sr-only">Name</Label>
            <Input 
              id={`docType-${doc.id}`} 
              name="docType" 
              defaultValue={doc.docType} 
              required 
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`notes-${doc.id}`} className="sr-only">Notes</Label>
            <Input 
              id={`notes-${doc.id}`} 
              name="notes" 
              defaultValue={doc.notes || ""} 
              placeholder="Notes"
              className="h-8"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 px-2">
          <input 
            type="checkbox" 
            id={`requiredBool-${doc.id}`} 
            name="requiredBool" 
            defaultChecked={doc.requiredBool}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor={`requiredBool-${doc.id}`} className="text-xs">Req.</Label>
        </div>

        <div className="flex items-center gap-1">
          <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
            <Save className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-gray-500 hover:text-gray-700"
            onClick={() => setIsEditing(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0 py-2">
      <div className="flex items-center gap-3">
        <span className="font-medium">{doc.docType}</span>
        <Badge variant={doc.requiredBool ? "default" : "secondary"}>
          {doc.requiredBool ? "Required" : "Optional"}
        </Badge>
        {doc.notes && <span className="text-sm text-muted-foreground">({doc.notes})</span>}
      </div>
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <form action={deleteRuleDocumentRequirement}>
          <input type="hidden" name="id" value={doc.id} />
          <input type="hidden" name="rulesetId" value={doc.rulesetId} />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
