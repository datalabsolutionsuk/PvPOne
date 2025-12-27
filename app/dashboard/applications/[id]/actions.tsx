"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Edit, Plus } from "lucide-react";
import { deleteTask } from "@/lib/actions";
import Link from "next/link";

export function TaskActions({ taskId, applicationId }: { taskId: string, applicationId: string }) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
        <Link href={`/dashboard/tasks/${taskId}/edit`}>
          <Edit className="h-4 w-4" />
        </Link>
      </Button>
      <form action={deleteTask}>
        <input type="hidden" name="id" value={taskId} />
        <input type="hidden" name="applicationId" value={applicationId} />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

export function AddTaskButton({ applicationId, type }: { applicationId: string, type: string }) {
  return (
    <Button asChild size="sm" variant="outline" className="gap-1">
      <Link href={`/dashboard/tasks/new?applicationId=${applicationId}&type=${type}`}>
        <Plus className="h-3 w-3" /> Add
      </Link>
    </Button>
  );
}
