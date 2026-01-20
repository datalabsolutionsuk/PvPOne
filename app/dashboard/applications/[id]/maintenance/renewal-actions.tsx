"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Upload } from "lucide-react";
import { updateRenewal } from "@/lib/actions";
import { useRef } from "react";

interface RenewalActionsProps {
  renewalId: string;
  applicationId: string;
  status: string;
}

export function RenewalActions({ renewalId, applicationId, status }: RenewalActionsProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex gap-2">
      {status !== "Paid" && (
        <form action={updateRenewal}>
          <input type="hidden" name="renewalId" value={renewalId} />
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="actionType" value="pay" />
          <Button size="sm" variant="outline" className="w-full gap-2">
            <CheckCircle className="h-3 w-3" />
            Mark Paid
          </Button>
        </form>
      )}
      
      <form 
        ref={formRef}
        action={updateRenewal} 
        className="flex-1"
      >
          <input type="hidden" name="renewalId" value={renewalId} />
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="actionType" value="upload" />
          <div className="flex items-center gap-2">
            <label htmlFor={`upload-${renewalId}`} className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3 w-full">
               <Upload className="h-3 w-3 mr-2" />
               Upload Doc
            </label>
            <input 
              id={`upload-${renewalId}`}
              type="file" 
              name="files" 
              multiple 
              className="hidden" 
              onChange={() => formRef.current?.requestSubmit()}
            />
          </div>
      </form>
    </div>
  );
}
