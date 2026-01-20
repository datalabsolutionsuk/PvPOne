"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { rescheduleMaintenance } from "@/lib/actions";

export function MaintenanceScheduler({ applicationId, initialDate }: { applicationId: string, initialDate?: Date }) {
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
