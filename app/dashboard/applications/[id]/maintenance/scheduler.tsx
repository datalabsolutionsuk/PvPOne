"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Mail } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { rescheduleMaintenance } from "@/lib/actions";

export function MaintenanceScheduler({ 
    applicationId, 
    initialDate,
    isLocked = false,
    varietyName
}: { 
    applicationId: string, 
    initialDate?: Date, 
    isLocked?: boolean,
    varietyName?: string
}) {
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
      if (!date) return;
      const formData = new FormData();
      formData.append("applicationId", applicationId);
      formData.append("newStartDate", date.toISOString());
      
      await rescheduleMaintenance(formData);
      setOpen(false);
  };

  if (isLocked) {
      const subject = encodeURIComponent(`Maintenance Schedule Change Request - ${varietyName}`);
      const body = encodeURIComponent(
`Hello Admin,

I need to modify the maintenance schedule for the following application:

Variety Name: ${varietyName}
Application ID: ${applicationId}
Current Year 1 Date: ${date ? format(date, "yyyy-MM-dd") : 'N/A'}

Reason for change:
`
      );
      
      const mailtoLink = `mailto:foxh1@hotmail.com?subject=${subject}&body=${body}`;

      return (
        <div className="flex items-center gap-2 mb-4 p-4 border rounded-lg bg-orange-50 border-orange-200">
            <div className="flex-1">
                <p className="text-sm font-semibold text-orange-900">Renewal Start Date (Year 1)</p>
                <div className="flex items-center gap-2 mt-1">
                    <CalendarIcon className="h-4 w-4 text-orange-700" />
                    <span className="font-medium text-orange-900">{date ? format(date, "PPP") : "N/A"}</span>
                </div>
                <p className="text-xs text-orange-800 mt-2">
                    This date has been customized and is now locked.
                </p>
            </div>
            <Button variant="outline" className="gap-2 border-orange-300 text-orange-900 hover:bg-orange-100" asChild>
                <a href={mailtoLink}>
                   <Mail className="h-4 w-4" />
                   Contact Admin to Change
                </a>
            </Button>
        </div>
      );
  }

  return (
    <div className="flex items-center gap-2 mb-4 p-4 border rounded-lg bg-slate-50">
        <div className="flex-1">
            <p className="text-sm font-medium">Renewal Start Date (Year 1)</p>
            <p className="text-xs text-muted-foreground">Adjusting this will recalculate all future renewal dates automatically.</p>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button
            variant={"outline"}
            className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
            )}
            >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a start date</span>}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
            <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); }}
                initialFocus
            />
            <div className="p-2 border-t">
                <Button className="w-full" size="sm" onClick={handleSave} disabled={!date}>
                    Update Schedule
                </Button>
            </div>
        </PopoverContent>
        </Popover>
    </div>
  );
}
