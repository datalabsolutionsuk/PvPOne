"use client";

import { Button } from "@/components/ui/button";
import { Check, X, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { updateRenewal } from "@/lib/actions";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AdminRenewalActionsProps {
  renewalId: string;
  applicationId: string;
  status: string;
  dueDate: Date | null;
}

export function AdminRenewalActions({ renewalId, applicationId, status, dueDate }: AdminRenewalActionsProps) {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [date, setDate] = useState<Date | undefined>(dueDate || undefined);

  const handleUpdateDate = async () => {
     if (!date) return;
     const formData = new FormData();
     formData.append("renewalId", renewalId);
     formData.append("applicationId", applicationId);
     formData.append("actionType", "update_date");
     formData.append("date", date.toISOString());
     await updateRenewal(formData);
     setOpenEdit(false);
  };

  return (
    <div className="flex justify-end gap-2 items-center">
      
      {/* Quick Paid Toggle */}
      <form action={updateRenewal}>
          <input type="hidden" name="renewalId" value={renewalId} />
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="actionType" value="toggle_paid" />
          <Button 
            size="sm" 
            variant={status === 'Paid' ? "default" : "outline"} 
            className="h-8 w-8 p-0"
            title={status === 'Paid' ? "Mark Unpaid" : "Mark Paid"}
          >
            <Check className="h-4 w-4" />
          </Button>
      </form>

      {/* Edit Date */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
         <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Edit Date">
                <CalendarIcon className="h-4 w-4" />
            </Button>
         </DialogTrigger>
         <DialogContent>
             <DialogHeader>
                 <DialogTitle>Edit Renewal Due Date</DialogTitle>
             </DialogHeader>
             <div className="py-4">
                 <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="rounded-md border mx-auto"
                 />
             </div>
             <DialogFooter>
                 <Button onClick={handleUpdateDate} disabled={!date}>Save Changes</Button>
             </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
         <DialogTrigger asChild>
            <Button size="sm" variant="destructive" className="h-8 w-8 p-0" title="Delete Renewal">
                <Trash2 className="h-4 w-4" />
            </Button>
         </DialogTrigger>
         <DialogContent>
             <DialogHeader>
                 <DialogTitle>Delete Renewal?</DialogTitle>
                 <DialogDescription>
                     This will permanently remove this renewal record. This cannot be undone.
                 </DialogDescription>
             </DialogHeader>
             <DialogFooter>
                 <form action={updateRenewal}>
                     <input type="hidden" name="renewalId" value={renewalId} />
                     <input type="hidden" name="applicationId" value={applicationId} />
                     <input type="hidden" name="actionType" value="delete" />
                     <Button variant="destructive" type="submit" onClick={() => setOpenDelete(false)}>Delete</Button>
                 </form>
             </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
