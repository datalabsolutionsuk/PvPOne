import { db } from "@/lib/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTask } from "@/lib/actions";
import Link from "next/link";
import { format } from "date-fns";
import { getCurrentOrganisationId, isSuperAdmin } from "@/lib/context";

export default async function EditTaskPage({ params }: { params: { id: string } }) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, params.id),
    with: {
      application: true,
    }
  });

  if (!task) {
    notFound();
  }

  const organisationId = await getCurrentOrganisationId();
  const superAdmin = await isSuperAdmin();

  if (!superAdmin && task.application.organisationId !== organisationId) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateTask} className="space-y-4">
            <input type="hidden" name="id" value={task.id} />
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={task.title} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" name="owner" defaultValue={task.owner || ""} placeholder="e.g. John Doe" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={task.description || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input 
                id="dueDate" 
                name="dueDate" 
                type="date" 
                defaultValue={task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : ""} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={task.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button asChild variant="outline">
                <Link href={`/dashboard/tasks/${task.id}`}>Cancel</Link>
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
